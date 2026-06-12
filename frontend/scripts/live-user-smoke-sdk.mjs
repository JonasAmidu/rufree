import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBzPJ1lD10iSupQyq3Y_3DJMlxiGfWvvcw',
  authDomain: 'rufree-c16ed.firebaseapp.com',
  projectId: 'rufree-c16ed',
  storageBucket: 'rufree-c16ed.firebasestorage.app',
  messagingSenderId: '238443078956',
  appId: '1:238443078956:web:5b0c84322cd9b1e6b47889',
  measurementId: 'G-82PQZE0FHG'
};

const log = (stage, extra = {}) => {
  console.log(JSON.stringify({ stage, ...extra }, null, 2));
};

const buildProfile = (uid, displayName) => ({
  uid,
  displayName,
  bio: 'RC1 validation profile for Auth and Firestore flows.',
  photoUrl: '',
  favoriteActivities: ['Coffee Chats', 'Tennis'],
  location: { latitude: 51.51, longitude: -0.13 },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

const createSmokeUser = async (auth, db, label) => {
  const email = `rc1.${label}.${Date.now()}@example.com`;
  const password = 'TestPass123!';
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const displayName = `RC1 ${label}`;

  await setDoc(doc(db, 'users', credential.user.uid), buildProfile(credential.user.uid, displayName));
  log(`${label}-signup-profile-create`, { uid: credential.user.uid });

  await signOut(auth);
  await signInWithEmailAndPassword(auth, email, password);
  log(`${label}-login`, { uid: credential.user.uid });

  return {
    email,
    password,
    uid: credential.user.uid,
    displayName
  };
};

const run = async () => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const host = await createSmokeUser(auth, db, 'host');
  const guest = await createSmokeUser(auth, db, 'guest');

  await signInWithEmailAndPassword(auth, host.email, host.password);

  const activityRef = await addDoc(collection(db, 'posts'), {
    activity: 'Coffee Chats',
    location: {
      name: 'RC1 Test Cafe',
      latitude: 51.51,
      longitude: -0.13
    },
    startTime: new Date(Date.now() + 30 * 60 * 1000),
    availableUntil: new Date(Date.now() + 90 * 60 * 1000),
    isUrgent: true,
    createdAt: serverTimestamp(),
    creatorId: host.uid,
    creatorName: host.displayName,
    creatorPhotoUrl: '',
    tags: ['coffee chats'],
    likedBy: [],
    likesCount: 0,
    interestedUsers: [],
    interestedCount: 0
  });
  log('activity-create', { activityId: activityRef.id });

  await signInWithEmailAndPassword(auth, guest.email, guest.password);
  await updateDoc(doc(db, 'users', guest.uid), {
    bio: 'Updated during RC1 validation.',
    updatedAt: serverTimestamp()
  });
  log('profile-update', { uid: guest.uid });

  await updateDoc(doc(db, 'posts', activityRef.id), {
    interestedUsers: arrayUnion(guest.uid),
    interestedCount: increment(1)
  });
  log('activity-join', { activityId: activityRef.id, uid: guest.uid });

  const conversationId = `rc1_${activityRef.id}_${guest.uid}`.replace(/[^A-Za-z0-9_-]/g, '_');
  await setDoc(doc(db, 'conversations', conversationId), {
    activityId: activityRef.id,
    activity: 'Coffee Chats',
    participantIds: [host.uid, guest.uid],
    participantNames: {
      [host.uid]: host.displayName,
      [guest.uid]: guest.displayName
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: 'RC1 plan chat opened.',
    lastMessageAt: serverTimestamp()
  });
  log('conversation-create', { conversationId });

  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId: guest.uid,
    senderName: guest.displayName,
    text: 'RC1 validation message.',
    createdAt: serverTimestamp()
  });
  await updateDoc(doc(db, 'conversations', conversationId), {
    updatedAt: serverTimestamp(),
    lastMessage: 'RC1 validation message.',
    lastMessageAt: serverTimestamp()
  });
  log('message-send', { conversationId });

  const messages = await getDocs(query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc')));
  log('message-read', { count: messages.size });

  await addDoc(collection(db, 'reports'), {
    reporterId: guest.uid,
    targetType: 'post',
    targetId: activityRef.id,
    reason: 'RC1 validation report for activity.',
    createdAt: serverTimestamp(),
    status: 'open'
  });
  await addDoc(collection(db, 'reports'), {
    reporterId: guest.uid,
    targetType: 'user',
    targetId: host.uid,
    reason: 'RC1 validation report for user.',
    createdAt: serverTimestamp(),
    status: 'open'
  });
  log('reports-create');

  await setDoc(doc(db, 'blocks', `${guest.uid}_${host.uid}`), {
    ownerId: guest.uid,
    blockedUserId: host.uid,
    createdAt: serverTimestamp()
  });
  log('block-create');

  const conversationSnapshot = await getDoc(doc(db, 'conversations', conversationId));
  const activitySnapshot = await getDoc(doc(db, 'posts', activityRef.id));
  const profileSnapshot = await getDoc(doc(db, 'users', guest.uid));

  log('readback', {
    conversationExists: conversationSnapshot.exists(),
    activityJoined: activitySnapshot.data()?.interestedUsers?.includes(guest.uid) || false,
    profileUpdated: profileSnapshot.data()?.bio === 'Updated during RC1 validation.'
  });

  await signOut(auth);
  log('logout');
};

run().catch((error) => {
  console.error(error.code || error.message || error);
  process.exit(1);
});
