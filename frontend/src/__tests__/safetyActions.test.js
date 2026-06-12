import { addDoc, collection, serverTimestamp } from '@firebase/firestore';
import { blockUser, reportTarget } from '../utils/safetyActions';

jest.mock('@firebase/firestore', () => ({
  addDoc: jest.fn(() => ({ id: 'new-safety-doc' })),
  collection: jest.fn((db, name) => `${db.name}-${name}`),
  serverTimestamp: jest.fn(() => 'server-timestamp')
}));

describe('safety actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a report document with the rules-compatible payload', async () => {
    await expect(
      reportTarget(
        { name: 'db-instance' },
        {
          reporterId: 'user-1',
          targetType: 'post',
          targetId: 'post-1',
          reason: 'Looks unsafe'
        }
      )
    ).resolves.toBe('new-safety-doc');

    expect(collection).toHaveBeenCalledWith({ name: 'db-instance' }, 'reports');
    expect(serverTimestamp).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalledWith('db-instance-reports', {
      reporterId: 'user-1',
      targetType: 'post',
      targetId: 'post-1',
      reason: 'Looks unsafe',
      createdAt: 'server-timestamp',
      status: 'open'
    });
  });

  it('creates a block document with the rules-compatible payload', async () => {
    await expect(
      blockUser(
        { name: 'db-instance' },
        {
          ownerId: 'user-1',
          blockedUserId: 'user-2'
        }
      )
    ).resolves.toBe('new-safety-doc');

    expect(collection).toHaveBeenCalledWith({ name: 'db-instance' }, 'blocks');
    expect(serverTimestamp).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalledWith('db-instance-blocks', {
      ownerId: 'user-1',
      blockedUserId: 'user-2',
      createdAt: 'server-timestamp'
    });
  });
});
