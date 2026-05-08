import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import HomeScreen from '../screens/HomeScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { calculateDistanceKm } from '../utils/activityFeed';

const Tab = createBottomTabNavigator();
const PROFILE_RADIUS_KM = 10;

const TAB_ICONS = {
  Home: ['home-outline', 'home'],
  Activity: ['add-circle-outline', 'add-circle'],
  Messages: ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
  Profile: ['person-circle-outline', 'person-circle']
};

const AppTabs = ({ user, userProfile }) => {
  const [activities, setActivities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  useEffect(() => {
    const unsubscribeActivities = onSnapshot(
      collection(db, 'posts'),
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
      collection(db, 'users'),
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

    return () => {
      unsubscribeActivities();
      unsubscribeUsers();
    };
  }, []);

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
                  'Live activity-linked messaging is the next layer to wire in.'
                )
              }
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {() => (
            <ProfileScreen
              activities={activities}
              nearbyCount={nearbyCount}
              onEditProfile={() => setShowEditProfileModal(true)}
              user={user}
              userProfile={userProfile}
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
