import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBzPJ1lD10iSupQyq3Y_3DJMlxiGfWvvcw',
  authDomain: 'rufree-c16ed.firebaseapp.com',
  projectId: 'rufree-c16ed',
  storageBucket: 'rufree-c16ed.firebasestorage.app',
  messagingSenderId: '238443078956',
  appId: '1:238443078956:web:5b0c84322cd9b1e6b47889',
  measurementId: 'G-82PQZE0FHG'
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const createNativeAuth = () => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    return getAuth(app);
  }
};

const auth = Platform.OS === 'web' ? getAuth(app) : createNativeAuth();
const db = getFirestore(app);

export { app, auth, db };
