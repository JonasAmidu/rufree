const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, getDocs, orderBy, query, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyBzPJ1lD10iSupQyq3Y_3DJMlxiGfWvvcw',
  authDomain: 'rufree-c16ed.firebaseapp.com',
  projectId: 'rufree-c16ed',
  storageBucket: 'rufree-c16ed.firebasestorage.app',
  messagingSenderId: '238443078956',
  appId: '1:238443078956:web:5b0c84322cd9b1e6b47889',
  measurementId: 'G-82PQZE0FHG'
};

const withTimeout = async (label, promise, ms = 12000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  return Promise.race([promise, timeoutPromise]);
};

(async () => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const email = `codex.${Date.now()}@example.com`;
  const password = 'TestPass123!';

  try {
    const userCredential = await withTimeout(
      'createUserWithEmailAndPassword',
      createUserWithEmailAndPassword(auth, email, password)
    );
    console.log('AUTH_CREATE_OK', userCredential.user.uid, email);

    try {
      await withTimeout(
        'setDoc profile',
        setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          displayName: 'Codex Test User',
          createdAt: serverTimestamp()
        })
      );
      console.log('PROFILE_WRITE_OK');
    } catch (profileError) {
      console.log('PROFILE_WRITE_ERR', profileError.code || '', profileError.message);
    }

    try {
      await withTimeout(
        'signInWithEmailAndPassword',
        signInWithEmailAndPassword(auth, email, password)
      );
      console.log('LOGIN_OK');
    } catch (loginError) {
      console.log('LOGIN_ERR', loginError.code || '', loginError.message);
    }

    try {
      const postsSnapshot = await withTimeout(
        'getDocs posts',
        getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')))
      );
      console.log('POSTS_READ_OK', postsSnapshot.size);
    } catch (postsError) {
      console.log('POSTS_READ_ERR', postsError.code || '', postsError.message);
    }
  } catch (authError) {
    console.log('AUTH_CREATE_ERR', authError.code || '', authError.message);
  }
})();
