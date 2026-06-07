import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from '@firebase/auth';
import ActivityComposer from '../components/activity/ActivityComposer';
import EditProfileScreen from './EditProfileScreen';
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from '@firebase/firestore';
import { auth, db } from '../firebase/config';
import {
  calculateDistanceKm,
  createActivity,
  enrichActivities,
  filterActivities,
  joinActivity,
  leaveActivity,
  likeActivity,
  subscribeToActivities,
  unlikeActivity
} from '../utils/activityFeed';

const RADIUS_OPTIONS = [2, 5, 10, 25];
const mapVisual = require('../../assets/nearby-map-visual.png');

const ACTIVITY_EMOJIS = {
  coffee: '☕',
  walk: '🚶',
  running: '🏃',
  gym: '🏋️',
  hike: '🥾',
  brunch: '🥐',
  dinner: '🍽️',
  live: '🎵',
  football: '⚽',
  tennis: '🎾',
  board: '🎲',
  cinema: '🎬',
  gaming: '🎮',
  study: '📚',
  co: '💻'
};

const formatDate = (value) => {
  if (!value) {
    return 'Pick a time';
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Pick a time' : parsed.toLocaleString();
};

const getActivityEmoji = (label = '') => {
  const normalized = label.toLowerCase();
  const entry = Object.entries(ACTIVITY_EMOJIS).find(([key]) => normalized.includes(key));
  return entry ? entry[1] : '✨';
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const projectPointToMap = (origin, location, radiusKm) => {
  if (
    !origin ||
    !location ||
    typeof origin.latitude !== 'number' ||
    typeof origin.longitude !== 'number' ||
    typeof location.latitude !== 'number' ||
    typeof location.longitude !== 'number'
  ) {
    return null;
  }

  const kmPerLatDegree = 111;
  const kmPerLonDegree =
    111 * Math.cos((origin.latitude * Math.PI) / 180) || 111;
  const deltaXKm = (location.longitude - origin.longitude) * kmPerLonDegree;
  const deltaYKm = (origin.latitude - location.latitude) * kmPerLatDegree;
  const safeRadius = Math.max(radiusKm, 1);
  const maxOffset = 38;

  return {
    left: 50 + clamp((deltaXKm / safeRadius) * maxOffset, -maxOffset, maxOffset),
    top: 50 + clamp((deltaYKm / safeRadius) * maxOffset, -maxOffset, maxOffset)
  };
};

const HomeScreen = ({ user, userProfile }) => {
  const [activities, setActivities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userLikes, setUserLikes] = useState(new Set());
  const [userJoinedActivities, setUserJoinedActivities] = useState(new Set());
  const [radiusKm, setRadiusKm] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [onlyAvailableNow, setOnlyAvailableNow] = useState(true);
  const [onlyMatchingInterests, setOnlyMatchingInterests] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activitiesReady, setActivitiesReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [isFreeNow, setIsFreeNow] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [locationMessage, setLocationMessage] = useState('Checking your nearby radius...');
  const [userLocation, setUserLocation] = useState(null);

  const favoriteActivities = userProfile?.favoriteActivities || [];

  useEffect(() => {
    const availability = userProfile?.availability;
    const freeUntil = availability?.freeUntil?.toDate
      ? availability.freeUntil.toDate()
      : availability?.freeUntil
        ? new Date(availability.freeUntil)
        : null;
    const isStillFree = !freeUntil || freeUntil.getTime() > Date.now();

    setIsFreeNow(Boolean(availability?.isFreeNow && isStillFree));
  }, [userProfile?.availability]);

  const nearbyUsers = useMemo(() => {
    if (!userLocation) {
      return [];
    }

    return allUsers
      .filter((person) => person.uid && person.uid !== user.uid)
      .map((person) => {
        const distanceKm = calculateDistanceKm(userLocation, person.location);
        const freeUntil = person.availability?.freeUntil?.toDate
          ? person.availability.freeUntil.toDate()
          : person.availability?.freeUntil
            ? new Date(person.availability.freeUntil)
            : null;
        const isPersonFreeNow = Boolean(
          person.availability?.isFreeNow && (!freeUntil || freeUntil.getTime() > Date.now())
        );
        const sharedInterests = favoriteActivities.filter((interest) =>
          Array.isArray(person.favoriteActivities) ? person.favoriteActivities.includes(interest) : false
        );

        return {
          id: person.id,
          uid: person.uid,
          displayName: person.displayName || 'RuFree user',
          photoUrl: person.photoUrl || '',
          bio: person.bio || '',
          favoriteActivities: person.favoriteActivities || [],
          sharedInterests,
          isFreeNow: isPersonFreeNow,
          distanceKm,
          distanceLabel:
            typeof distanceKm === 'number' ? `${distanceKm.toFixed(1)} km away` : 'Near your area',
          location: person.location
        };
      })
      .filter((person) => typeof person.distanceKm === 'number' && person.distanceKm <= radiusKm)
      .sort((left, right) => {
        if (left.isFreeNow !== right.isFreeNow) {
          return left.isFreeNow ? -1 : 1;
        }

        return left.distanceKm - right.distanceKm;
      });
  }, [allUsers, favoriteActivities, radiusKm, user.uid, userLocation]);

  const nearbyUsersById = useMemo(
    () =>
      allUsers.reduce((accumulator, currentUser) => {
        accumulator[currentUser.uid] = currentUser;
        return accumulator;
      }, {}),
    [allUsers]
  );

  const enrichedActivities = useMemo(
    () =>
      enrichActivities(activities, {
        currentLocation: userLocation,
        favoriteActivities,
        nearbyUsersById
      }),
    [activities, userLocation, favoriteActivities, nearbyUsersById]
  );

  const visibleActivities = useMemo(
    () =>
      filterActivities(enrichedActivities, {
        radiusKm,
        searchText,
        onlyMatching: onlyMatchingInterests,
        onlyAvailableNow
      }),
    [enrichedActivities, radiusKm, searchText, onlyMatchingInterests, onlyAvailableNow]
  );

  const availableNowCount = visibleActivities.filter((activity) => activity.availableNow).length;
  const mapPins = useMemo(() => {
    if (!userLocation) {
      return [];
    }

    const peoplePins = nearbyUsers
      .slice(0, 6)
      .map((person) => {
        const point = projectPointToMap(userLocation, person.location, radiusKm);
        if (!point) {
          return null;
        }

        return {
          id: `person-${person.uid}`,
          label: person.displayName,
          top: point.top,
          left: point.left,
          tone: 'person',
          glyph: person.displayName.charAt(0).toUpperCase()
        };
      })
      .filter(Boolean);

    const activityPins = visibleActivities
      .slice(0, 6)
      .map((activity) => {
        const point = projectPointToMap(userLocation, activity.location, radiusKm);
        if (!point) {
          return null;
        }

        return {
          id: `activity-${activity.id}`,
          label: activity.activity || 'Activity',
          top: point.top,
          left: point.left,
          tone: 'activity',
          glyph: getActivityEmoji(activity.activity)
        };
      })
      .filter(Boolean);

    return [...peoplePins, ...activityPins].slice(0, 10);
  }, [nearbyUsers, radiusKm, userLocation, visibleActivities]);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationMessage('Location is off. We’re showing broader suggestions instead.');
        return null;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const location = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude
      };

      setUserLocation(location);
      setLocationMessage(`Showing people and activities within ${radiusKm} km.`);

      await setDoc(
        doc(db, 'users', user.uid),
        {
          location,
          locationUpdatedAt: serverTimestamp()
        },
        { merge: true }
      );

      return location;
    } catch (error) {
      console.error('Location setup error', error);
      setLocationMessage('We could not update your location, but you can still browse activities.');
      return null;
    }
  };

  useEffect(() => {
    const unsubscribeActivities = subscribeToActivities(
      db,
      (fetchedActivities) => {
        setActivities(fetchedActivities);

        const liked = new Set();
        const joined = new Set();

        fetchedActivities.forEach((activity) => {
          if (Array.isArray(activity.likedBy) && activity.likedBy.includes(user.uid)) {
            liked.add(activity.id);
          }

          if (Array.isArray(activity.interestedUsers) && activity.interestedUsers.includes(user.uid)) {
            joined.add(activity.id);
          }
        });

        setUserLikes(liked);
        setUserJoinedActivities(joined);
        setActivitiesReady(true);
      },
      (error) => {
        console.error('Activity subscription error', error);
        setActivitiesReady(true);
        Alert.alert('Live feed failed', 'We could not subscribe to activities right now.');
      }
    );

    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const users = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));

        setAllUsers(users);
      },
      (error) => {
        console.error('Users subscription error', error);
      }
    );

    return () => {
      unsubscribeActivities();
      unsubscribeUsers();
    };
  }, [user.uid]);

  const loadHomeData = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      await requestLocation();
    } catch (error) {
      console.error('Home load error', error);
      Alert.alert('Home load failed', 'We could not load nearby activity data right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    if (userLocation) {
      setLocationMessage(`Showing people and activities within ${radiusKm} km.`);
    }
  }, [radiusKm, userLocation]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHomeData({ silent: true });
  };

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error', error);
      Alert.alert('Sign out failed', error.message || 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const handleToggleAvailability = async () => {
    const nextValue = !isFreeNow;
    const freeUntil = nextValue ? new Date(Date.now() + 60 * 60 * 1000) : null;

    setAvailabilitySaving(true);
    setIsFreeNow(nextValue);

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          availability: {
            isFreeNow: nextValue,
            freeUntil,
            updatedAt: serverTimestamp()
          }
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Availability update error', error);
      setIsFreeNow(!nextValue);
      Alert.alert('Availability failed', 'We could not update your live status right now.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handleCreatePost = async (values) => {
    try {
      await createActivity(db, {
        activity: values.activity.trim(),
        location: {
          name: values.locationName.trim(),
          ...(userLocation || userProfile?.location || {})
        },
        startTime: values.startTime || new Date(),
        availableUntil: values.isUrgent ? new Date(Date.now() + 60 * 60 * 1000) : null,
        isUrgent: values.isUrgent,
        createdAt: serverTimestamp(),
        creatorId: user.uid,
        creatorName: userProfile?.displayName || user.email?.split('@')[0] || 'RuFree User',
        creatorPhotoUrl: userProfile?.photoUrl || '',
        tags: [...new Set([values.activity.trim(), ...favoriteActivities])]
      });

      setShowCreateModal(false);
      Alert.alert('Activity posted', 'Your nearby activity is now live.');
    } catch (error) {
      console.error('Create activity error', error);
      Alert.alert('Post failed', error.message || 'Please try again.');
    }
  };

  const handleLike = async (activityId) => {
    const alreadyLiked = userLikes.has(activityId);

    try {
      if (alreadyLiked) {
        await unlikeActivity(db, activityId, user.uid);
        setUserLikes((current) => {
          const next = new Set(current);
          next.delete(activityId);
          return next;
        });
      } else {
        await likeActivity(db, activityId, user.uid);
        setUserLikes((current) => {
          const next = new Set(current);
          next.add(activityId);
          return next;
        });
      }

      setActivities((current) =>
        current.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                likedBy: alreadyLiked
                  ? (activity.likedBy || []).filter((id) => id !== user.uid)
                  : [...(activity.likedBy || []), user.uid],
                likesCount: alreadyLiked
                  ? Math.max((activity.likesCount || 1) - 1, 0)
                  : (activity.likesCount || 0) + 1
              }
            : activity
        )
      );
    } catch (error) {
      console.error('Like toggle error', error);
      Alert.alert('Reaction failed', 'We could not update that activity right now.');
    }
  };

  const handleJoin = async (activityId) => {
    const alreadyJoined = userJoinedActivities.has(activityId);

    try {
      if (alreadyJoined) {
        await leaveActivity(db, activityId, user.uid);
        setUserJoinedActivities((current) => {
          const next = new Set(current);
          next.delete(activityId);
          return next;
        });
      } else {
        await joinActivity(db, activityId, user.uid);
        setUserJoinedActivities((current) => {
          const next = new Set(current);
          next.add(activityId);
          return next;
        });
      }

      setActivities((current) =>
        current.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                interestedUsers: alreadyJoined
                  ? (activity.interestedUsers || []).filter((id) => id !== user.uid)
                  : [...(activity.interestedUsers || []), user.uid],
                interestedCount: alreadyJoined
                  ? Math.max((activity.interestedCount || 1) - 1, 0)
                  : (activity.interestedCount || 0) + 1
              }
            : activity
        )
      );
    } catch (error) {
      console.error('Join toggle error', error);
      Alert.alert('Join failed', 'We could not update your participation right now.');
    }
  };

  const renderNearbyUser = (person) => (
    <View key={person.uid} style={styles.nearbyCard}>
      <View style={styles.nearbyVisual}>
        {person.photoUrl ? (
          <Image source={{ uri: person.photoUrl }} style={styles.nearbyAvatar} />
        ) : (
          <View style={[styles.nearbyAvatar, styles.nearbyAvatarFallback]}>
            <Text style={styles.nearbyInitial}>{person.displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.nearbyStatusDot, !person.isFreeNow && styles.nearbyStatusDotMuted]} />
        <View style={styles.nearbyDistanceBubble}>
          <Ionicons color="#0B2C34" name="navigate" size={12} />
          <Text style={styles.nearbyDistanceBubbleText}>{person.distanceLabel}</Text>
        </View>
      </View>
      <Text style={styles.nearbyName}>{person.displayName}</Text>
      <Text style={styles.nearbyLiveText}>{person.isFreeNow ? 'Free now' : 'Nearby'}</Text>
      <View style={styles.matchTagRow}>
        {(person.sharedInterests.length ? person.sharedInterests : person.favoriteActivities).slice(0, 2).map((interest) => (
          <View key={interest} style={styles.matchTag}>
            <Text style={styles.matchTagText}>{interest}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderActivityCard = (activity) => {
    const isLiked = userLikes.has(activity.id);
    const isJoined = userJoinedActivities.has(activity.id);
    const interestedCount =
      typeof activity.interestedCount === 'number'
        ? activity.interestedCount
        : Array.isArray(activity.interestedUsers)
          ? activity.interestedUsers.length
          : 0;
    const participantPreview = (activity.interestedUsers || [])
      .map((participantId) => {
        if (participantId === user.uid) {
          return 'You';
        }

        return allUsers.find((person) => person.uid === participantId)?.displayName || null;
      })
      .filter(Boolean)
      .slice(0, 3);

    return (
      <View key={activity.id} style={[styles.activityCard, activity.isUrgent && styles.activityCardUrgent]}>
        <View style={styles.activityTopRow}>
          <View style={styles.activityEmojiWrap}>
            <Text style={styles.activityEmoji}>{getActivityEmoji(activity.activity)}</Text>
          </View>
          <View style={styles.activityTopCopy}>
            <View style={styles.activityTitleRow}>
              <Text style={styles.activityTitle}>{activity.activity || 'Nearby activity'}</Text>
              {activity.availableNow && (
                <View style={styles.nowBadge}>
                  <Text style={styles.nowBadgeText}>AVAILABLE NOW</Text>
                </View>
              )}
            </View>
            <View style={styles.activityVisualMetaRow}>
              <View style={styles.activityVisualPill}>
                <Ionicons color="#0D5255" name="navigate" size={14} />
                <Text style={styles.activityVisualPillText}>{activity.distanceLabel}</Text>
              </View>
              <View style={styles.activityVisualPill}>
                <Ionicons color="#0D5255" name="time" size={14} />
                <Text style={styles.activityVisualPillText}>{formatDate(activity.startTime)}</Text>
              </View>
            </View>
            <Text style={styles.activityMeta} numberOfLines={1}>
              {activity.location?.name || 'Location coming soon'} by {activity.creatorName || 'RuFree user'}
            </Text>
          </View>
        </View>

        {activity.interestMatches.length > 0 && (
          <View style={styles.interestMatchRow}>
            {activity.interestMatches.slice(0, 3).map((interest) => (
              <View key={interest} style={styles.interestMatchChip}>
                <Text style={styles.interestMatchChipText}>{interest}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.activityActionRow}>
          <TouchableOpacity
            style={[styles.joinButton, isJoined && styles.joinButtonActive]}
            onPress={() => handleJoin(activity.id)}
          >
            <Text style={[styles.joinButtonText, isJoined && styles.joinButtonTextActive]}>
              {isJoined ? 'Joined' : 'Join now'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.likeButton, isLiked && styles.likeButtonActive]}
            onPress={() => handleLike(activity.id)}
          >
            <Text style={styles.likeButtonText}>
              {isLiked ? '♥' : '♡'} {activity.likesCount || 0}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.participationRow}>
          <View style={styles.participantStack}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={[styles.participantDot, { marginLeft: index === 0 ? 0 : -8 }]}>
                <Text style={styles.participantDotText}>
                  {(participantPreview[index] || activity.creatorName || 'R').charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.participationText}>
            {interestedCount > 0
              ? `${interestedCount} joining now`
              : 'Be the first to join this activity'}
          </Text>
          {participantPreview.length > 0 ? (
            <Text style={styles.participationNames}>{participantPreview.join(' • ')}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading || !activitiesReady) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color="#17D6C5" />
        <Text style={styles.loaderText}>Finding people near you right now…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroBrand}>
              <Text style={styles.heroTitle}>RU FREE?</Text>
              <Text style={styles.heroSubtitle}>Meet nearby, right now.</Text>
            </View>
            <TouchableOpacity style={styles.signOutPill} onPress={handleSignOut} disabled={signingOut}>
              <Ionicons color="#D7EEF0" name={signingOut ? 'sync' : 'log-out-outline'} size={18} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            disabled={availabilitySaving}
            onPress={handleToggleAvailability}
            style={[styles.availabilityCard, isFreeNow && styles.availabilityCardActive]}
          >
            <View style={[styles.availabilityIcon, isFreeNow && styles.availabilityIconActive]}>
              <Ionicons
                color={isFreeNow ? '#062126' : '#A9FFF5'}
                name={isFreeNow ? 'radio-button-on' : 'radio-button-off'}
                size={22}
              />
            </View>
            <View style={styles.availabilityCopy}>
              <Text style={[styles.availabilityTitle, isFreeNow && styles.availabilityTitleActive]}>
                {isFreeNow ? "You're free now" : "I'm free now"}
              </Text>
              <Text style={[styles.availabilitySubtitle, isFreeNow && styles.availabilitySubtitleActive]}>
                {isFreeNow ? 'Visible nearby for 1 hour' : 'Go live so nearby people can find you'}
              </Text>
            </View>
            <Ionicons color={isFreeNow ? '#062126' : '#A9FFF5'} name="chevron-forward" size={20} />
          </TouchableOpacity>

          <View style={styles.mapCardHero}>
            <ImageBackground source={mapVisual} resizeMode="cover" style={styles.mapSurface} imageStyle={styles.mapVisualImage}>
              <View style={styles.mapScrim} />
              <View style={styles.mapRingOuter} />
              <View style={styles.mapRingMiddle} />
              <View style={styles.mapRingInner} />

              {mapPins.map((pin) => (
                <View
                  key={pin.id}
                  style={[
                    styles.mapPin,
                    pin.tone === 'activity' ? styles.mapPinActivity : styles.mapPinPerson,
                    {
                      top: `${pin.top}%`,
                      left: `${pin.left}%`
                    }
                  ]}
                >
                  <Text style={styles.mapPinText}>{pin.glyph}</Text>
                </View>
              ))}

              <View style={styles.mapCenterMarker}>
                <View style={styles.mapCenterPulse} />
                <View style={styles.mapCenterDot} />
              </View>

              {!userLocation && (
                <View style={styles.mapPermissionCard}>
                  <Ionicons color="#FFFFFF" name="location" size={26} />
                  <Text style={styles.mapPermissionTitle}>Share location</Text>
                  <TouchableOpacity style={styles.mapPermissionButton} onPress={() => loadHomeData({ silent: true })}>
                    <Text style={styles.mapPermissionButtonText}>Pin me</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ImageBackground>

            <View style={styles.mapHudRow}>
              <View style={styles.mapHudPill}>
                <Text style={styles.mapHudValue}>{availableNowCount}</Text>
                <Text style={styles.mapHudLabel}>now</Text>
              </View>
              <View style={styles.mapHudPill}>
                <Text style={styles.mapHudValue}>{nearbyUsers.length}</Text>
                <Text style={styles.mapHudLabel}>people</Text>
              </View>
              <View style={styles.mapHudPill}>
                <Text style={styles.mapHudValue}>{radiusKm}</Text>
                <Text style={styles.mapHudLabel}>km</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.discoveryCard}>
          <View style={styles.discoveryHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>Filters</Text>
              <Text style={styles.sectionTitle}>Tune the map</Text>
            </View>
            <TouchableOpacity style={styles.createButtonInline} onPress={() => setShowCreateModal(true)}>
              <Ionicons color="#FFFFFF" name="add" size={20} />
            </TouchableOpacity>
          </View>

          <Text style={styles.locationStatus}>{locationMessage}</Text>

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search coffee, tennis, dinner, walks..."
            placeholderTextColor="#6A7A84"
            style={styles.searchInput}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.radiusChip, radiusKm === option && styles.radiusChipActive]}
                onPress={() => setRadiusKm(option)}
              >
                <Text style={[styles.radiusChipText, radiusKm === option && styles.radiusChipTextActive]}>
                  {option} km
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.toggleRow}>
            <View style={styles.toggleCard}>
              <Text style={styles.toggleTitle}>Now</Text>
              <Switch value={onlyAvailableNow} onValueChange={setOnlyAvailableNow} />
            </View>
            <View style={styles.toggleCard}>
              <Text style={styles.toggleTitle}>Match</Text>
              <Switch value={onlyMatchingInterests} onValueChange={setOnlyMatchingInterests} />
            </View>
          </View>
        </View>

        <View style={styles.profileStrip}>
          {userProfile?.photoUrl ? (
            <Image source={{ uri: userProfile.photoUrl }} style={styles.profileStripImage} />
          ) : (
            <View style={[styles.profileStripImage, styles.nearbyAvatarFallback]}>
              <Text style={styles.nearbyInitial}>
                {(userProfile?.displayName || 'R').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileStripCopy}>
            <View style={styles.profileStripHeader}>
              <Text style={styles.profileStripName}>{userProfile?.displayName || 'RuFree User'}</Text>
              <TouchableOpacity
                style={styles.profileEditButton}
                onPress={() => setShowEditProfileModal(true)}
              >
                <Text style={styles.profileEditButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.profileStripBio} numberOfLines={2}>
              {userProfile?.bio || 'Complete your profile so people nearby can understand your vibe.'}
            </Text>
            <View style={styles.profileInterestRow}>
              {favoriteActivities.slice(0, 4).map((activity) => (
                <View key={activity} style={styles.profileInterestChip}>
                  <Text style={styles.profileInterestChipText}>{activity}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>Available</Text>
          <Text style={styles.sectionTitle}>Nearby people</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyRow}>
            {nearbyUsers.length > 0 ? (
              nearbyUsers.map(renderNearbyUser)
            ) : (
              <View style={styles.emptyNearbyCard}>
                <Text style={styles.emptyNearbyTitle}>No nearby profiles yet</Text>
                <Text style={styles.emptyNearbyBody}>
                  Once more people nearby finish their profiles, they’ll show up here with shared interests and distance.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>Live activities</Text>
          <Text style={styles.sectionTitle}>Find activities near you</Text>
          {visibleActivities.length > 0 ? (
            visibleActivities.map(renderActivityCard)
          ) : (
            <View style={styles.emptyFeedCard}>
              <Text style={styles.emptyFeedTitle}>Nothing in this radius yet</Text>
              <Text style={styles.emptyFeedBody}>
                Try widening your radius, turning off a filter, or posting the first activity nearby.
              </Text>
              <TouchableOpacity style={styles.emptyFeedButton} onPress={() => setShowCreateModal(true)}>
                <Text style={styles.emptyFeedButtonText}>Create the first one</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={showCreateModal}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create an activity</Text>
              <Text style={styles.modalSubtitle}>
                Post something simple that people nearby can join right now.
              </Text>

              <ActivityComposer
                onSubmit={handleCreatePost}
                onCancel={() => setShowCreateModal(false)}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal animationType="slide" visible={showEditProfileModal}>
        <EditProfileScreen
          user={user}
          initialProfile={userProfile}
          onCancel={() => setShowEditProfileModal(false)}
          onProfileSaved={() => setShowEditProfileModal(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07141B'
  },
  scrollContent: {
    paddingBottom: 120
  },
  loaderScreen: {
    flex: 1,
    backgroundColor: '#07141B',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderText: {
    color: '#BFEDEE',
    marginTop: 14,
    fontSize: 15
  },
  hero: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 18,
    backgroundColor: '#07141B'
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  heroBrand: {
    flex: 1,
    paddingRight: 12
  },
  heroEyebrow: {
    color: '#17D6C5',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 10
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  heroSubtitle: {
    color: '#D8E9EC',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 4
  },
  signOutPill: {
    borderWidth: 1,
    borderColor: '#1C3C46',
    borderRadius: 18,
    width: 42,
    height: 42,
    backgroundColor: '#10232C',
    justifyContent: 'center',
    alignItems: 'center'
  },
  signOutPillText: {
    color: '#D7EEF0',
    fontWeight: '700'
  },
  availabilityCard: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: '#10232C',
    borderWidth: 1,
    borderColor: '#1D4652',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center'
  },
  availabilityCardActive: {
    backgroundColor: '#A9FFF5',
    borderColor: '#A9FFF5'
  },
  availabilityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#173847',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  availabilityIconActive: {
    backgroundColor: '#FFFFFF'
  },
  availabilityCopy: {
    flex: 1
  },
  availabilityTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900'
  },
  availabilityTitleActive: {
    color: '#062126'
  },
  availabilitySubtitle: {
    color: '#A8C6CB',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3
  },
  availabilitySubtitleActive: {
    color: '#0D5255'
  },
  heroStatsRow: {
    flexDirection: 'row',
    marginTop: 22
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: '#10232C',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginRight: 10
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6
  },
  heroStatLabel: {
    color: '#A8C6CB',
    fontSize: 13
  },
  discoveryCard: {
    marginTop: 4,
    marginHorizontal: 16,
    backgroundColor: '#F7F2EA',
    borderRadius: 28,
    padding: 18
  },
  discoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionEyebrow: {
    color: '#FF7B54',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 6
  },
  sectionTitle: {
    color: '#10212A',
    fontSize: 24,
    fontWeight: '900'
  },
  createButtonInline: {
    backgroundColor: '#0D1C24',
    borderRadius: 18,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center'
  },
  createButtonInlineText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  locationStatus: {
    color: '#5E6C74',
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20
  },
  searchInput: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#10212A'
  },
  radiusRow: {
    marginTop: 14
  },
  radiusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D9E0E3',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10
  },
  radiusChipActive: {
    backgroundColor: '#17D6C5',
    borderColor: '#17D6C5'
  },
  radiusChipText: {
    color: '#33444D',
    fontWeight: '700'
  },
  radiusChipTextActive: {
    color: '#08232A'
  },
  toggleRow: {
    marginTop: 16,
    flexDirection: 'row'
  },
  toggleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 10,
    flex: 1
  },
  toggleTitle: {
    color: '#10212A',
    fontWeight: '700',
    fontSize: 15
  },
  profileStrip: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: '#0F2430',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row'
  },
  mapCardHero: {
    marginTop: 18,
    backgroundColor: '#071923',
    borderRadius: 28,
    padding: 10,
    borderWidth: 1,
    borderColor: '#12303C'
  },
  mapSurface: {
    height: 390,
    borderRadius: 22,
    backgroundColor: '#0D2530',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapVisualImage: {
    borderRadius: 22
  },
  mapScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 15, 24, 0.14)'
  },
  mapRingOuter: {
    position: 'absolute',
    width: '88%',
    height: '88%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(23, 214, 197, 0.22)'
  },
  mapRingMiddle: {
    position: 'absolute',
    width: '58%',
    height: '58%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(23, 214, 197, 0.3)'
  },
  mapRingInner: {
    position: 'absolute',
    width: '28%',
    height: '28%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(23, 214, 197, 0.45)'
  },
  mapCrosshairVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(132, 173, 184, 0.16)'
  },
  mapCrosshairHorizontal: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(132, 173, 184, 0.16)'
  },
  mapCenterMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 214, 197, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)'
  },
  mapCenterPulse: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(23, 214, 197, 0.5)'
  },
  mapCenterDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#17D6C5'
  },
  mapPin: {
    position: 'absolute',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2
  },
  mapPinPerson: {
    backgroundColor: '#FFF6ED',
    borderColor: '#FF9D72'
  },
  mapPinActivity: {
    backgroundColor: '#E7FFFB',
    borderColor: '#17D6C5'
  },
  mapPinText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10212A'
  },
  mapPermissionCard: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(7, 20, 27, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center'
  },
  mapPermissionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
    marginLeft: 10
  },
  mapPermissionButton: {
    borderRadius: 999,
    backgroundColor: '#17D6C5',
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  mapPermissionButtonText: {
    color: '#052227',
    fontWeight: '900'
  },
  mapHudRow: {
    flexDirection: 'row',
    marginTop: 10
  },
  mapHudPill: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#10232C',
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8
  },
  mapHudValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900'
  },
  mapHudLabel: {
    color: '#A8C6CB',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2
  },
  mapLegendRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  mapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8
  },
  mapLegendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  mapLegendSwatchPerson: {
    backgroundColor: '#FF9D72'
  },
  mapLegendSwatchActivity: {
    backgroundColor: '#17D6C5'
  },
  mapLegendText: {
    color: '#BFEDEE',
    fontSize: 13,
    fontWeight: '700'
  },
  mapRadiusLabel: {
    color: '#89B9C1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  profileStripImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#173847'
  },
  profileStripCopy: {
    flex: 1,
    marginLeft: 14
  },
  profileStripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  profileEditButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A505C',
    backgroundColor: '#173847',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  profileEditButtonText: {
    color: '#D7F8F3',
    fontWeight: '700'
  },
  profileStripName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800'
  },
  profileStripBio: {
    color: '#BFD2D7',
    fontSize: 14,
    lineHeight: 20
  },
  profileInterestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10
  },
  profileInterestChip: {
    borderRadius: 999,
    backgroundColor: '#173847',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8
  },
  profileInterestChipText: {
    color: '#A9FFF5',
    fontSize: 12,
    fontWeight: '700'
  },
  sectionBlock: {
    marginTop: 24,
    paddingHorizontal: 16
  },
  nearbyRow: {
    paddingTop: 12,
    paddingBottom: 4
  },
  nearbyCard: {
    width: 172,
    backgroundColor: '#FFF6ED',
    borderRadius: 24,
    padding: 16,
    marginRight: 14
  },
  nearbyVisual: {
    height: 104,
    borderRadius: 22,
    backgroundColor: '#16333F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden'
  },
  nearbyAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34
  },
  nearbyAvatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A3642'
  },
  nearbyInitial: {
    color: '#A7FFF5',
    fontWeight: '900',
    fontSize: 22
  },
  nearbyName: {
    color: '#14232C',
    fontSize: 18,
    fontWeight: '800'
  },
  nearbyLiveText: {
    color: '#FF7B54',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
    textTransform: 'uppercase'
  },
  nearbyStatusDot: {
    position: 'absolute',
    top: 16,
    right: 18,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#17D6C5',
    borderWidth: 2,
    borderColor: '#FFF6ED'
  },
  nearbyStatusDotMuted: {
    backgroundColor: '#8DA4AA'
  },
  nearbyDistanceBubble: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A9FFF5',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  nearbyDistanceBubbleText: {
    color: '#0B2C34',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 3
  },
  matchTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10
  },
  matchTag: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8
  },
  matchTagText: {
    color: '#0D4447',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyNearbyCard: {
    backgroundColor: '#FFF6ED',
    borderRadius: 24,
    padding: 18,
    width: 280
  },
  emptyNearbyTitle: {
    color: '#14232C',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8
  },
  emptyNearbyBody: {
    color: '#61717A',
    lineHeight: 20
  },
  activityCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    padding: 16,
    marginTop: 14
  },
  activityCardUrgent: {
    borderWidth: 2,
    borderColor: '#FF7B54'
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  activityEmojiWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EAFBFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  activityEmoji: {
    fontSize: 24
  },
  activityTopCopy: {
    flex: 1
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  activityTitle: {
    color: '#13212A',
    fontSize: 20,
    fontWeight: '900',
    marginRight: 10,
    marginBottom: 4
  },
  nowBadge: {
    backgroundColor: '#17D6C5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6
  },
  nowBadgeText: {
    color: '#052227',
    fontSize: 11,
    fontWeight: '900'
  },
  activityMeta: {
    color: '#65717A',
    fontSize: 14,
    marginTop: 4
  },
  activityVisualMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6
  },
  activityVisualPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAFBFA',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6
  },
  activityVisualPillText: {
    color: '#0D5255',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4
  },
  interestMatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14
  },
  interestMatchChip: {
    backgroundColor: '#FFF0E4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8
  },
  interestMatchChipText: {
    color: '#AF562B',
    fontWeight: '700',
    fontSize: 12
  },
  activityActionRow: {
    flexDirection: 'row',
    marginTop: 16
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#11C8A1',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10
  },
  joinButtonActive: {
    backgroundColor: '#083B44'
  },
  joinButtonText: {
    color: '#072327',
    fontWeight: '900',
    fontSize: 16
  },
  joinButtonTextActive: {
    color: '#E8FFFC'
  },
  likeButton: {
    minWidth: 86,
    borderRadius: 18,
    backgroundColor: '#F3F1ED',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  likeButtonActive: {
    backgroundColor: '#FFE5E3'
  },
  likeButtonText: {
    color: '#14232C',
    fontWeight: '800'
  },
  participationRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  participantStack: {
    flexDirection: 'row',
    marginRight: 10
  },
  participantDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#173847',
    borderWidth: 2,
    borderColor: '#FFFDF9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  participantDotText: {
    color: '#A9FFF5',
    fontSize: 11,
    fontWeight: '900'
  },
  participationText: {
    color: '#0D5255',
    fontWeight: '800',
    fontSize: 14
  },
  participationNames: {
    color: '#65717A',
    fontSize: 13,
    marginTop: 4
  },
  emptyFeedCard: {
    backgroundColor: '#FFF6ED',
    borderRadius: 24,
    padding: 20,
    marginTop: 14
  },
  emptyFeedTitle: {
    color: '#14232C',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8
  },
  emptyFeedBody: {
    color: '#65717A',
    fontSize: 14,
    lineHeight: 20
  },
  emptyFeedButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: '#13212A',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  emptyFeedButtonText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FF7B54',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 13, 19, 0.65)',
    justifyContent: 'flex-end'
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#FFF9F0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20
  },
  modalTitle: {
    color: '#13212A',
    fontSize: 26,
    fontWeight: '900'
  },
  modalSubtitle: {
    color: '#65717A',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18
  },
});

export default HomeScreen;
