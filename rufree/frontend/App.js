import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import { auth, db } from './src/firebase/config';
import { isProfileComplete } from './src/utils/activityOptions';

const Stack = createNativeStackNavigator();

const App = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (currentUser) => {
    const profileRef = doc(db, 'users', currentUser.uid);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      setUserProfile(null);
      return;
    }

    setUserProfile({
      id: profileSnapshot.id,
      ...profileSnapshot.data()
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      setUser(userAuth);

      if (!userAuth) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        await loadUserProfile(userAuth);
      } catch (error) {
        console.error('Profile load error', error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
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
          <Stack.Screen name="Auth" component={AuthScreen} />
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
          <Stack.Screen name="Home">
            {() => <HomeScreen user={user} userProfile={userProfile} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
