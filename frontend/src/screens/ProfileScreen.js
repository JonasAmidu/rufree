import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBackground from '../components/AppBackground';
import ProfileInterestSummary from '../components/profile/ProfileInterestSummary';
import ProfileMomentumCard from '../components/profile/ProfileMomentumCard';
import ProfilePreviewCard from '../components/profile/ProfilePreviewCard';
import ProfileStatGrid from '../components/profile/ProfileStatGrid';

const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildCompletionPercent = ({ displayName, bio, photoUrl, favoriteActivities, location }) => {
  const checks = [
    Boolean(displayName?.trim()),
    Boolean(bio?.trim()),
    Boolean(photoUrl?.trim()),
    Array.isArray(favoriteActivities) && favoriteActivities.length > 0,
    Boolean(location && typeof location.latitude === 'number' && typeof location.longitude === 'number')
  ];
  const completeCount = checks.filter(Boolean).length;
  return Math.round((completeCount / checks.length) * 100);
};

const ProfileScreen = ({
  user,
  userProfile,
  activities = [],
  nearbyCount = 0,
  onEditProfile,
  onSignOut,
  signingOut = false
}) => {
  const favoriteActivities = Array.isArray(userProfile?.favoriteActivities)
    ? userProfile.favoriteActivities
    : [];

  const profileIdentity = {
    displayName: userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'RuFree User',
    bio: userProfile?.bio || '',
    photoUrl: userProfile?.photoUrl || '',
    favoriteActivities
  };

  const stats = useMemo(() => {
    const hostedActivities = activities.filter((activity) => activity.creatorId === user?.uid);
    const joinedActivities = activities.filter((activity) =>
      Array.isArray(activity.interestedUsers) ? activity.interestedUsers.includes(user?.uid) : false
    );
    const likedActivities = activities.filter((activity) =>
      Array.isArray(activity.likedBy) ? activity.likedBy.includes(user?.uid) : false
    );
    const upcomingHosted = hostedActivities.filter((activity) => {
      const startTime = toDate(activity.startTime);
      return startTime ? startTime.getTime() >= Date.now() : false;
    });

    return {
      hostedCount: hostedActivities.length,
      joinedCount: joinedActivities.length,
      likedCount: likedActivities.length,
      upcomingHostedCount: upcomingHosted.length
    };
  }, [activities, user?.uid]);

  const completionPercent = buildCompletionPercent({
    displayName: profileIdentity.displayName,
    bio: profileIdentity.bio,
    photoUrl: profileIdentity.photoUrl,
    favoriteActivities,
    location: userProfile?.location
  });
  const profileReady = completionPercent >= 80;

  const statCards = [
    { label: 'Activities hosted', value: String(stats.hostedCount) },
    { label: 'Joined in real time', value: String(stats.joinedCount) },
    { label: 'Nearby people now', value: String(nearbyCount) },
    { label: 'Saved reactions', value: String(stats.likedCount) }
  ];

  const availabilityLine =
    stats.upcomingHostedCount > 0
      ? `${stats.upcomingHostedCount} of your posted plans are still live for people to join.`
      : 'No live hosted plans yet. Posting one nearby is the fastest way to activate your profile.';

  return (
    <AppBackground style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Your real-time identity</Text>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>
              Give people enough signal to know whether they should grab coffee, join a walk, or say yes right now.
            </Text>
          </View>

          <View style={styles.heroActions}>
            <Pressable
              testID="profile-edit-cta"
              style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
              onPress={onEditProfile}
            >
              <Text style={styles.editButtonText}>Edit profile</Text>
            </Pressable>

            {onSignOut ? (
              <Pressable
                testID="profile-sign-out-button"
                style={({ pressed }) => [
                  styles.signOutButton,
                  signingOut && styles.buttonDisabled,
                  pressed && !signingOut && styles.buttonPressed
                ]}
                onPress={onSignOut}
                disabled={signingOut}
              >
                <Text style={styles.signOutButtonText}>
                  {signingOut ? 'Signing out...' : 'Sign out'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <ProfilePreviewCard {...profileIdentity} />

        <ProfileMomentumCard
          profileReady={profileReady}
          completionPercent={completionPercent}
          joinedCount={stats.joinedCount}
          hostedCount={stats.hostedCount}
          nearbyCount={nearbyCount}
        />

        <ProfileStatGrid stats={statCards} />

        <View style={styles.availabilityCard}>
          <Text style={styles.availabilityEyebrow}>Live presence</Text>
          <Text style={styles.availabilityTitle}>How your profile shows up right now</Text>
          <Text style={styles.availabilityBody}>{availabilityLine}</Text>

          <View style={styles.signalRow}>
            <View style={styles.signalPill}>
              <Text style={styles.signalLabel}>Display name</Text>
              <Text style={styles.signalValue}>{profileIdentity.displayName}</Text>
            </View>
            <View style={styles.signalPill}>
              <Text style={styles.signalLabel}>Radius signal</Text>
              <Text style={styles.signalValue}>
                {userProfile?.location ? 'Location ready' : 'Needs location'}
              </Text>
            </View>
          </View>
        </View>

        <ProfileInterestSummary favoriteActivities={favoriteActivities} />
      </ScrollView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 40,
    gap: 18
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16
  },
  heroCopy: {
    flex: 1
  },
  heroActions: {
    alignItems: 'flex-end',
    gap: 10
  },
  eyebrow: {
    color: '#0F9F90',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  title: {
    marginTop: 10,
    color: '#0B1E24',
    fontSize: 34,
    fontWeight: '900'
  },
  subtitle: {
    marginTop: 10,
    color: '#4A636B',
    fontSize: 15,
    lineHeight: 22
  },
  editButton: {
    borderRadius: 999,
    backgroundColor: '#0C2730',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start'
  },
  editButtonText: {
    color: '#F2FFFD',
    fontSize: 14,
    fontWeight: '800'
  },
  buttonPressed: {
    opacity: 0.9
  },
  buttonDisabled: {
    opacity: 0.6
  },
  signOutButton: {
    borderRadius: 999,
    borderColor: '#C8D8D5',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start'
  },
  signOutButtonText: {
    color: '#31545B',
    fontSize: 14,
    fontWeight: '800'
  },
  availabilityCard: {
    backgroundColor: '#FFF7EE',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F7DEC9'
  },
  availabilityEyebrow: {
    color: '#FF7B54',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9
  },
  availabilityTitle: {
    marginTop: 8,
    color: '#0B1E24',
    fontSize: 24,
    fontWeight: '800'
  },
  availabilityBody: {
    marginTop: 8,
    color: '#5F6F76',
    fontSize: 14,
    lineHeight: 21
  },
  signalRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  signalPill: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  signalLabel: {
    color: '#7C817E',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  signalValue: {
    marginTop: 6,
    color: '#0B1E24',
    fontSize: 15,
    fontWeight: '800'
  }
});

export default ProfileScreen;
