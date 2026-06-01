const { getApp, getApps, initializeApp } = require('@firebase/app');
const { getFirestore } = require('@firebase/firestore');

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
const db = getFirestore(app);

export { app, db, firebaseConfig };
