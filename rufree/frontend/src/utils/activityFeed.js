import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export const fetchActivities = async (db) => {
  const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const postsSnapshot = await getDocs(postsQuery);

  return postsSnapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
};
