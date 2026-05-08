import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc
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

const distanceKm = (a, b) => {
  if (!a || !b) return null;
  const r = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const value =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return r * (2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
};

const ensureSeedActivities = async (db) => {
  const snapshot = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));

  if (!snapshot.empty) {
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  }

  const baseLocation = { latitude: 51.5074, longitude: -0.1278 };
  const seedActivities = [
    {
      activity: 'Coffee Hangout',
      location: { name: 'Soho Coffee House', latitude: 51.5136, longitude: -0.1365 },
      startTime: new Date(Date.now() + 1000 * 60 * 45),
      isUrgent: true,
      creatorId: 'seed-user-1',
      creatorName: 'Maya',
      tags: ['Coffee Chats', 'Brunch'],
      likedBy: [],
      likesCount: 0,
      interestedUsers: [],
      createdAt: new Date()
    },
    {
      activity: 'Tennis Match',
      location: { name: 'Hyde Park Courts', latitude: 51.5079, longitude: -0.1657 },
      startTime: new Date(Date.now() + 1000 * 60 * 90),
      isUrgent: false,
      creatorId: 'seed-user-2',
      creatorName: 'Alex',
      tags: ['Tennis', 'Running'],
      likedBy: [],
      likesCount: 0,
      interestedUsers: [],
      createdAt: new Date()
    },
    {
      activity: 'Dinner Tonight',
      location: { name: 'Southbank Kitchen', latitude: 51.5061, longitude: -0.1141 },
      startTime: new Date(Date.now() + 1000 * 60 * 180),
      isUrgent: false,
      creatorId: 'seed-user-3',
      creatorName: 'Priya',
      tags: ['Dinner', 'Live Music'],
      likedBy: [],
      likesCount: 0,
      interestedUsers: [],
      createdAt: new Date()
    }
  ];

  const created = [];
  for (const activity of seedActivities) {
    const ref = await addDoc(collection(db, 'posts'), activity);
    created.push({ id: ref.id, ...activity });
  }

  return created.map((activity) => ({
    ...activity,
    distanceKm: distanceKm(baseLocation, activity.location)
  }));
};

const run = async () => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const email = `codex.${Date.now()}@example.com`;
  const password = 'TestPass123!';

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  console.log(
    JSON.stringify(
      {
        stage: 'auth-created',
        email,
        uid: userCredential.user.uid
      },
      null,
      2
    )
  );

  await setDoc(
    doc(db, 'users', userCredential.user.uid),
    {
      uid: userCredential.user.uid,
      email,
      displayName: 'Codex Test User',
      bio: 'Always up for coffee, tennis, and spontaneous dinner plans.',
      photoUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      favoriteActivities: ['Coffee Chats', 'Tennis', 'Dinner'],
      location: { latitude: 51.5074, longitude: -0.1278 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  console.log(
    JSON.stringify(
      {
        stage: 'profile-saved',
        uid: userCredential.user.uid
      },
      null,
      2
    )
  );

  await signInWithEmailAndPassword(auth, email, password);

  let posts = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));
  let activities = posts.docs.map((item) => ({ id: item.id, ...item.data() }));

  if (activities.length === 0) {
    activities = await ensureSeedActivities(db);
  }

  const userLocation = { latitude: 51.5074, longitude: -0.1278 };
  const nearbyActivities = activities
    .map((activity) => ({
      id: activity.id,
      activity: activity.activity,
      creatorName: activity.creatorName,
      locationName: activity.location?.name || '',
      distanceKm: distanceKm(userLocation, activity.location)
    }))
    .filter((activity) => typeof activity.distanceKm === 'number' && activity.distanceKm <= 10);

  console.log(
    JSON.stringify(
      {
        stage: 'activities-ready',
        activitiesRead: activities.length,
        nearbyActivities
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(error.code || error.message || error);
  process.exit(1);
});
