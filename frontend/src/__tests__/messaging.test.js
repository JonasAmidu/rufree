import {
  buildMessagesQuery,
  buildParticipantNames,
  buildPlanConversationId,
  ensureActivityConversation,
  sendConversationMessage
} from '../utils/messaging';
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

jest.mock('@firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn((...args) => args.join('/')),
  doc: jest.fn((...args) => args.join('/')),
  getDoc: jest.fn(),
  orderBy: jest.fn((field, direction) => ({ field, direction })),
  query: jest.fn((...args) => ({ queryArgs: args })),
  serverTimestamp: jest.fn(() => 'server-time'),
  setDoc: jest.fn(),
  updateDoc: jest.fn()
}));

describe('messaging utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const activity = {
    id: 'post/one',
    activity: 'Coffee Chats',
    creatorId: 'host-1',
    creatorName: 'Maya'
  };

  const user = {
    uid: 'user-2',
    email: 'user@example.com'
  };

  it('builds safe deterministic plan conversation ids', () => {
    expect(buildPlanConversationId('post/one', 'user.2')).toBe('plan_post_one_user_2');
  });

  it('builds participant names from host and signed-in profile', () => {
    expect(
      buildParticipantNames({
        activity,
        user,
        userProfile: { displayName: 'Guest User' }
      })
    ).toEqual({
      'host-1': 'Maya',
      'user-2': 'Guest User'
    });
  });

  it('creates a plan conversation when a user joins an activity', async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    await expect(
      ensureActivityConversation('db', {
        activity,
        user,
        userProfile: { displayName: 'Guest User' }
      })
    ).resolves.toBe('plan_post_one_user-2');

    expect(doc).toHaveBeenCalledWith('db', 'conversations', 'plan_post_one_user-2');
    expect(setDoc).toHaveBeenCalledWith('db/conversations/plan_post_one_user-2', {
      activityId: 'post/one',
      activity: 'Coffee Chats',
      participantIds: ['host-1', 'user-2'],
      participantNames: {
        'host-1': 'Maya',
        'user-2': 'Guest User'
      },
      createdAt: 'server-time',
      updatedAt: 'server-time',
      lastMessage: 'Plan chat opened. Confirm the meetup details here.',
      lastMessageAt: 'server-time'
    });
  });

  it('does not recreate existing conversations', async () => {
    getDoc.mockResolvedValue({ exists: () => true });

    await expect(
      ensureActivityConversation('db', {
        activity,
        user,
        userProfile: { displayName: 'Guest User' }
      })
    ).resolves.toBe('plan_post_one_user-2');

    expect(setDoc).not.toHaveBeenCalled();
  });

  it('builds an ordered message query', () => {
    expect(buildMessagesQuery('db', 'conversation-1')).toEqual({
      queryArgs: [
        'db/conversations/conversation-1/messages',
        { field: 'createdAt', direction: 'asc' }
      ]
    });
    expect(collection).toHaveBeenCalledWith('db', 'conversations', 'conversation-1', 'messages');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'asc');
    expect(query).toHaveBeenCalled();
  });

  it('sends a message and updates the conversation preview', async () => {
    await sendConversationMessage('db', 'conversation-1', {
      text: '  See you by the window.  ',
      user,
      userProfile: { displayName: 'Guest User' }
    });

    expect(addDoc).toHaveBeenCalledWith('db/conversations/conversation-1/messages', {
      senderId: 'user-2',
      senderName: 'Guest User',
      text: 'See you by the window.',
      createdAt: 'server-time'
    });
    expect(updateDoc).toHaveBeenCalledWith('db/conversations/conversation-1', {
      updatedAt: 'server-time',
      lastMessage: 'See you by the window.',
      lastMessageAt: 'server-time'
    });
    expect(serverTimestamp).toHaveBeenCalled();
  });
});
