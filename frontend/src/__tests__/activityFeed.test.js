import {
  calculateDistanceKm,
  createActivity,
  enrichActivities,
  fetchActivities,
  filterActivities,
  joinActivity,
  leaveActivity
} from '../utils/activityFeed';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  updateDoc
} from '@firebase/firestore';

jest.mock('@firebase/firestore', () => ({
  addDoc: jest.fn(() => ({ id: 'new-post' })),
  arrayRemove: jest.fn((value) => ({ type: 'remove', value })),
  arrayUnion: jest.fn((value) => ({ type: 'union', value })),
  collection: jest.fn(() => 'posts-collection'),
  doc: jest.fn(() => 'post-doc'),
  getDocs: jest.fn(),
  increment: jest.fn((value) => ({ type: 'increment', value })),
  orderBy: jest.fn(() => 'order-by-created-at'),
  query: jest.fn(() => 'posts-query'),
  updateDoc: jest.fn()
}));

describe('fetchActivities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates activities with Firestore-compatible dates and counters', async () => {
    const { addDoc } = require('@firebase/firestore');

    await expect(
      createActivity(
        { name: 'db-instance' },
        {
          activity: 'Coffee',
          startTime: '2026-05-08T18:30:00.000Z',
          availableUntil: null
        }
      )
    ).resolves.toBe('new-post');

    expect(addDoc).toHaveBeenCalledWith('posts-collection', {
      activity: 'Coffee',
      startTime: new Date('2026-05-08T18:30:00.000Z'),
      availableUntil: null,
      likedBy: [],
      likesCount: 0,
      interestedUsers: [],
      interestedCount: 0
    });
  });

  it('returns an empty list when no activities exist', async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await expect(fetchActivities({ name: 'db-instance' })).resolves.toEqual([]);
    expect(collection).toHaveBeenCalledWith({ name: 'db-instance' }, 'posts');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(query).toHaveBeenCalledWith('posts-collection', 'order-by-created-at');
  });

  it('maps Firestore docs into activity objects', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'post-1',
          data: () => ({
            activity: 'Coffee',
            creatorName: 'Jonas'
          })
        }
      ]
    });

    await expect(fetchActivities({ name: 'db-instance' })).resolves.toEqual([
      {
        id: 'post-1',
        activity: 'Coffee',
        creatorName: 'Jonas'
      }
    ]);
  });

  it('calculates distances in kilometers', () => {
    expect(
      calculateDistanceKm(
        { latitude: 51.5007, longitude: -0.1246 },
        { latitude: 51.5074, longitude: -0.1278 }
      )
    ).toBeGreaterThan(0);
  });

  it('enriches and filters activities by radius and interests', () => {
    const activities = enrichActivities(
      [
        {
          id: 'post-1',
          activity: 'Coffee hangout',
          creatorId: 'user-2',
          creatorName: 'Maya',
          location: {
            name: 'Central Cafe',
            latitude: 51.5007,
            longitude: -0.1246
          },
          likedBy: ['user-9'],
          startTime: new Date(Date.now() + 1000 * 60 * 60).toISOString()
        },
        {
          id: 'post-2',
          activity: 'Tennis match',
          creatorId: 'user-3',
          creatorName: 'Alex',
          location: {
            name: 'Court 1',
            latitude: 52.52,
            longitude: 13.405
          },
          likedBy: [],
          startTime: new Date(Date.now() + 1000 * 60 * 60).toISOString()
        }
      ],
      {
        currentLocation: { latitude: 51.5074, longitude: -0.1278 },
        favoriteActivities: ['Coffee Chats']
      }
    );

    const results = filterActivities(activities, {
      radiusKm: 10,
      onlyMatching: true,
      onlyAvailableNow: true
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('post-1');
    expect(results[0].interestMatches).toEqual(['Coffee Chats']);
  });

  it('joins an activity with lightweight presence', async () => {
    updateDoc.mockResolvedValue();

    await joinActivity({ name: 'db-instance' }, 'post-1', 'user-42');

    expect(doc).toHaveBeenCalledWith({ name: 'db-instance' }, 'posts', 'post-1');
    expect(arrayUnion).toHaveBeenCalledWith('user-42');
    expect(increment).toHaveBeenCalledWith(1);
    expect(updateDoc).toHaveBeenCalledWith('post-doc', {
      interestedUsers: { type: 'union', value: 'user-42' },
      interestedCount: { type: 'increment', value: 1 }
    });
  });

  it('leaves an activity and reduces lightweight presence', async () => {
    updateDoc.mockResolvedValue();

    await leaveActivity({ name: 'db-instance' }, 'post-1', 'user-42');

    expect(arrayRemove).toHaveBeenCalledWith('user-42');
    expect(increment).toHaveBeenCalledWith(-1);
    expect(updateDoc).toHaveBeenCalledWith('post-doc', {
      interestedUsers: { type: 'remove', value: 'user-42' },
      interestedCount: { type: 'increment', value: -1 }
    });
  });
});
