import { 
  collection, 
  getDocs, 
  orderBy, 
  query, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';

export const fetchActivities = async (db) => {
  const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const postsSnapshot = await getDocs(postsQuery);

  return postsSnapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
};

export const likeActivity = async (db, postId, userId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: arrayUnion(userId)
    });
    
    // Also increment a likes count field for easier querying
    await updateDoc(postRef, {
      likesCount: increment(1)
    });
  } catch (error) {
    console.error('Error liking activity:', error);
    throw error;
  }
};

export const unlikeActivity = async (db, postId, userId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: arrayRemove(userId)
    });
    
    // Also decrement the likes count
    await updateDoc(postRef, {
      likesCount: increment(-1)
    });
  } catch (error) {
    console.error('Error unliking activity:', error);
    throw error;
  }
};

export const createActivity = async (db, activityData) => {
  try {
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      ...activityData,
      likes: [],
      likesCount: 0,
      interestedUsers: []
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

// Helper function for increment/decrement (needs to be imported from firebase)
// In a real implementation, you'd import it: import { increment } from 'firebase/firestore';
const increment = (value) => {
  return { __increment: value };
};
