import { fetchActivities } from '../utils/activityFeed';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'posts-collection'),
  getDocs: jest.fn(),
  orderBy: jest.fn(() => 'order-by-created-at'),
  query: jest.fn(() => 'posts-query')
}));

describe('fetchActivities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
