import AsyncStorage from '@react-native-async-storage/async-storage';
import { app, db } from './firebaseCore';
import { initializeAuth, getAuth, getReactNativePersistence } from '@firebase/auth';

const createNativeAuth = () => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    if (error?.code === 'auth/already-initialized') {
      return getAuth(app);
    }

    throw error;
  }
};

const auth = createNativeAuth();

export { app, auth, db };
