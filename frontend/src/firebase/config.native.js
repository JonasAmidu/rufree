import AsyncStorage from '@react-native-async-storage/async-storage';
import { app, db, firebaseConfig } from './firebaseCore';

const firebaseApp = require('@firebase/app');
const firebaseAuth = require('@firebase/auth');

const authApp =
  firebaseApp.getApps().length > 0 ? firebaseApp.getApp() : firebaseApp.initializeApp(firebaseConfig);

const createNativeAuth = () => {
  try {
    return firebaseAuth.initializeAuth(authApp, {
      persistence: firebaseAuth.getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    if (error?.code === 'auth/already-initialized') {
      return firebaseAuth.getAuth(authApp);
    }

    throw error;
  }
};

const auth = createNativeAuth();

export { app, auth, db };
