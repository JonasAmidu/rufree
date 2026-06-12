import {
  addDoc,
  collection,
  doc,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from '@firebase/firestore';

export const buildPlanConversationId = (activityId, userId) =>
  `plan_${activityId}_${userId}`.replace(/[^A-Za-z0-9_-]/g, '_');

export const buildParticipantNames = ({ activity, user, userProfile }) => ({
  [activity.creatorId]: activity.creatorName || 'RuFree host',
  [user.uid]: userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'RuFree user'
});

export const ensureActivityConversation = async (db, { activity, user, userProfile }) => {
  if (!activity?.id || !activity?.creatorId || !user?.uid) {
    throw new Error('A host, activity, and signed-in user are required before opening chat.');
  }

  if (activity.creatorId === user.uid) {
    return null;
  }

  const conversationId = buildPlanConversationId(activity.id, user.uid);
  const conversationRef = doc(db, 'conversations', conversationId);
  const existing = await getDoc(conversationRef);

  if (existing.exists()) {
    return conversationId;
  }

  await setDoc(conversationRef, {
    activityId: activity.id,
    activity: activity.activity || 'Nearby activity',
    participantIds: [activity.creatorId, user.uid],
    participantNames: buildParticipantNames({ activity, user, userProfile }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: 'Plan chat opened. Confirm the meetup details here.',
    lastMessageAt: serverTimestamp()
  });

  return conversationId;
};

export const buildMessagesQuery = (db, conversationId) =>
  query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));

export const sendConversationMessage = async (
  db,
  conversationId,
  { text, user, userProfile }
) => {
  const trimmed = text.trim();

  if (!conversationId || !user?.uid || !trimmed) {
    throw new Error('Choose a conversation and enter a message before sending.');
  }

  const senderName =
    userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'RuFree user';

  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId: user.uid,
    senderName,
    text: trimmed,
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, 'conversations', conversationId), {
    updatedAt: serverTimestamp(),
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp()
  });
};
