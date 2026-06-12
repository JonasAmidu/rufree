import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from '@firebase/auth';
import { doc, onSnapshot } from '@firebase/firestore';
import AuthScreen from './src/screens/AuthScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import { auth, db } from './src/firebase/config';
import { isProfileComplete } from './src/utils/activityOptions';
import AppTabs from './src/navigation/AppTabs';

const Stack = createNativeStackNavigator();

const App = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const buildUserProfile = (profileSnapshot) => {
    if (!profileSnapshot.exists()) {
      return null;
    }

    return {
      id: profileSnapshot.id,
      ...profileSnapshot.data()
    };
  };

  useEffect(() => {
    let unsubscribeProfile = null;
    const authFallback = setTimeout(() => {
      setLoading(false);
    }, 6000);

    const unsubscribeAuth = onAuthStateChanged(auth, (userAuth) => {
      clearTimeout(authFallback);
      setUser(userAuth);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!userAuth) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      const profileRef = doc(db, 'users', userAuth.uid);

      unsubscribeProfile = onSnapshot(
        profileRef,
        (profileSnapshot) => {
          setUserProfile(buildUserProfile(profileSnapshot));
          setLoading(false);
        },
        (error) => {
          console.error('Profile load error', error);
          setUserProfile(null);
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
      clearTimeout(authFallback);
      unsubscribeAuth();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Welcome" component={AuthScreen} />
        ) : !isProfileComplete(userProfile) ? (
          <Stack.Screen name="ProfileSetup">
            {() => (
              <ProfileSetupScreen
                initialProfile={userProfile}
                onProfileSaved={setUserProfile}
                user={user}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Tabs">
            {() => <AppTabs user={user} userProfile={userProfile} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
