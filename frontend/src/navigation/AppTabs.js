import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { sendPasswordResetEmail, signOut } from '@firebase/auth';
import { collection, limit, onSnapshot, orderBy, query, where } from '@firebase/firestore';
import { auth, db } from '../firebase/config';
import HomeScreen from '../screens/HomeScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MessagesScreen, { buildThreadsFromActivities, buildThreadsFromConversations } from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { calculateDistanceKm } from '../utils/activityFeed';

const Tab = createBottomTabNavigator();
const PROFILE_RADIUS_KM = 10;

const TAB_ICONS = {
  Home: ['home-outline', 'home'],
  Activity: ['add-circle-outline', 'add-circle'],
  Messages: ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
  Profile: ['person-circle-outline', 'person-circle'],
  Settings: ['settings-outline', 'settings']
};

const AppTabs = ({ user, userProfile }) => {
  const [activities, setActivities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const unsubscribeActivities = onSnapshot(
      query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50)),
      (snapshot) => {
        setActivities(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }))
        );
      },
      (error) => {
        console.error('Tab activity subscription error', error);
      }
    );

    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users'), limit(100)),
      (snapshot) => {
        setAllUsers(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }))
        );
      },
      (error) => {
        console.error('Tab user subscription error', error);
      }
    );

    const unsubscribeConversations = onSnapshot(
      query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', user.uid),
        orderBy('lastMessageAt', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        setConversations(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }))
        );
      },
      (error) => {
        console.error('Conversation subscription error', error);
      }
    );

    return () => {
      unsubscribeActivities();
      unsubscribeUsers();
      unsubscribeConversations();
    };
  }, [user.uid]);

  const nearbyCount = useMemo(() => {
    if (!userProfile?.location) {
      return 0;
    }

    return allUsers.filter((person) => {
      if (!person?.uid || person.uid === user.uid) {
        return false;
      }

      const distanceKm = calculateDistanceKm(userProfile.location, person.location);
      return typeof distanceKm === 'number' && distanceKm <= PROFILE_RADIUS_KM;
    }).length;
  }, [allUsers, user.uid, userProfile?.location]);

  const messageThreads = useMemo(
    () => {
      const persistedThreads = buildThreadsFromConversations(conversations, user);
      return persistedThreads.length ? persistedThreads : buildThreadsFromActivities(activities, user);
    },
    [activities, conversations, user]
  );

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Profile tab sign out error', error);
      Alert.alert('Sign out failed', error.message || 'Please try again.');
      setSigningOut(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      Alert.alert('Email unavailable', 'Sign in again before requesting a password reset.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert('Reset email sent', 'Check your inbox for the Firebase password reset link.');
    } catch (error) {
      console.error('Password reset error', error);
      Alert.alert('Reset failed', error.message || 'Please try again.');
    }
  };

  const showPolicyNotice = (title) => {
    Alert.alert(title, 'Release policy copy is tracked in the RuFree release board and must be approved before public launch.');
  };

  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#17D6C5',
          tabBarInactiveTintColor: '#7A8B95',
          tabBarStyle: {
            backgroundColor: '#08161D',
            borderTopColor: '#14313C',
            height: 74,
            paddingBottom: 10,
            paddingTop: 10
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700'
          },
          tabBarIcon: ({ color, focused, size }) => {
            const [outlineName, filledName] = TAB_ICONS[route.name];
            return (
              <Ionicons
                color={color}
                name={focused ? filledName : outlineName}
                size={size}
              />
            );
          }
        })}
      >
        <Tab.Screen name="Home">
          {() => <HomeScreen user={user} userProfile={userProfile} />}
        </Tab.Screen>
        <Tab.Screen
          name="Activity"
          options={{
            tabBarLabel: 'Add Activity'
          }}
        >
          {() => (
            <CreateActivityScreen
              creatorProfile={userProfile}
              currentLocation={userProfile?.location || null}
              user={user}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Messages">
          {({ navigation }) => (
            <MessagesScreen
              onFindPeople={() => navigation.navigate('Home')}
              onOpenThread={(thread) =>
                Alert.alert(
                  thread?.name || 'Conversation',
                  thread?.lastMessage || 'This conversation is linked to one of your live plans.'
                )
              }
              threads={messageThreads}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {() => (
            <ProfileScreen
              activities={activities}
              nearbyCount={nearbyCount}
              onEditProfile={() => setShowEditProfileModal(true)}
              onSignOut={handleSignOut}
              signingOut={signingOut}
              user={user}
              userProfile={userProfile}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Settings">
          {() => (
            <SettingsScreen
              onAbout={() => Alert.alert('About RuFree', 'RuFree helps nearby people turn free time into real plans.')}
              onContactUs={() => Alert.alert('Contact RuFree', 'Support contact details are pending final release copy.')}
              onHelp={() => Alert.alert('Help', 'Use reports, blocks, and sign out if something feels wrong.')}
              onLogout={handleSignOut}
              onPrivacyPolicy={() => showPolicyNotice('Privacy Policy')}
              onResetPassword={handleResetPassword}
              onTerms={() => showPolicyNotice('Terms & Conditions')}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      <Modal animationType="slide" visible={showEditProfileModal}>
        <EditProfileScreen
          initialProfile={userProfile}
          onCancel={() => setShowEditProfileModal(false)}
          onProfileSaved={() => setShowEditProfileModal(false)}
          user={user}
        />
      </Modal>
    </>
  );
};

export default AppTabs;
