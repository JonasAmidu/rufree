import { app, db, firebaseConfig } from './firebaseCore';

const firebaseApp = require('@firebase/app');
const firebaseAuth = require('@firebase/auth');

const authApp =
  firebaseApp.getApps().length > 0 ? firebaseApp.getApp() : firebaseApp.initializeApp(firebaseConfig);
const auth = firebaseAuth.getAuth(authApp);

export { app, auth, db };
