import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { serverTimestamp } from '@firebase/firestore';
import CreateActivityScreen, { buildCreateActivityPayload } from '../screens/CreateActivityScreen';

jest.mock('@firebase/firestore', () => ({
  serverTimestamp: jest.fn(() => 'server-timestamp')
}));

jest.mock('../firebase/config', () => ({
  auth: { currentUser: { uid: 'auth-user', email: 'auth@example.com' } },
  db: { name: 'db-instance' }
}));

jest.mock('../utils/activityFeed', () => ({
  createActivity: jest.fn()
}));

describe('CreateActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    Alert.alert.mockRestore();
  });

  it('builds a payload that matches the shared activity model', () => {
    const payload = buildCreateActivityPayload(
      {
        activity: 'Coffee Chats',
        locationName: 'Soho Coffee House',
        isUrgent: true,
        startTime: new Date('2026-05-08T18:30:00.000Z')
      },
      {
        currentLocation: { latitude: 51.5007, longitude: -0.1246 },
        creatorProfile: { displayName: 'Jonas' },
        user: { uid: 'user-1', email: 'jonas@example.com' }
      }
    );

    expect(serverTimestamp).toHaveBeenCalled();
    expect(payload).toMatchObject({
      activity: 'Coffee Chats',
      creatorId: 'user-1',
      creatorName: 'Jonas',
      createdAt: 'server-timestamp',
      isUrgent: true,
      startTime: new Date('2026-05-08T18:30:00.000Z'),
      location: {
        name: 'Soho Coffee House',
        latitude: 51.501,
        longitude: -0.125
      },
      tags: ['coffee chats']
    });
    expect(payload.availableUntil).toBeInstanceOf(Date);
  });

  it('calls the submit callback and shows success feedback', async () => {
    const onSubmit = jest.fn().mockResolvedValue();
    const { getByTestId } = render(
      <CreateActivityScreen
        user={{ uid: 'user-1', email: 'jonas@example.com' }}
        creatorProfile={{ displayName: 'Jonas' }}
        currentLocation={{ latitude: 51.5, longitude: -0.12 }}
        onSubmit={onSubmit}
      />
    );

    fireEvent.press(getByTestId('activity-preset-Coffee Chats'));
    fireEvent.changeText(getByTestId('location-name-input'), 'Soho Coffee House');
    fireEvent.press(getByTestId('submit-activity-button'));

    expect(onSubmit).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Activity posted',
        'Your activity is live for nearby people right now.'
      );
    });
  });
});
