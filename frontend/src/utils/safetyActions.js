import { addDoc, collection, serverTimestamp } from '@firebase/firestore';

export const reportTarget = async (
  db,
  { reporterId, targetType, targetId, reason = 'User reported from RuFree client' }
) => {
  if (!reporterId || !targetType || !targetId) {
    throw new Error('Report target is incomplete.');
  }

  const docRef = await addDoc(collection(db, 'reports'), {
    reporterId,
    targetType,
    targetId,
    reason,
    createdAt: serverTimestamp(),
    status: 'open'
  });

  return docRef.id;
};

export const blockUser = async (db, { ownerId, blockedUserId }) => {
  if (!ownerId || !blockedUserId) {
    throw new Error('Block target is incomplete.');
  }

  const docRef = await addDoc(collection(db, 'blocks'), {
    ownerId,
    blockedUserId,
    createdAt: serverTimestamp()
  });

  return docRef.id;
};
