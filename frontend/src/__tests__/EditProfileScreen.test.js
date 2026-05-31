import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { doc, serverTimestamp, setDoc } from '@firebase/firestore';
import EditProfileScreen from '../screens/EditProfileScreen';

jest.mock('@firebase/firestore', () => ({
  doc: jest.fn(() => 'user-doc'),
  serverTimestamp: jest.fn(() => 'server-timestamp'),
  setDoc: jest.fn()
}));

jest.mock('../firebase/config', () => ({
  db: { name: 'db-instance' }
}));

describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    Alert.alert.mockRestore();
  });

  it('saves the edited profile to Firestore and returns the merged profile', async () => {
    setDoc.mockResolvedValue();
    const onProfileSaved = jest.fn();

    const { getByTestId } = render(
      <EditProfileScreen
        user={{ uid: 'user-123', email: 'maya@example.com', displayName: 'Maya' }}
        initialProfile={{
          bio: 'Old bio',
          photoUrl: 'https://example.com/old.jpg',
          favoriteActivities: ['Running'],
          createdAt: 'created-before'
        }}
        onProfileSaved={onProfileSaved}
      />
    );

    fireEvent.changeText(getByTestId('profile-bio-input'), ' Coffee, walks, and tennis ');
    fireEvent.changeText(getByTestId('profile-photo-url-input'), ' https://example.com/new.jpg ');
    fireEvent.press(getByTestId('profile-activity-Running'));
    fireEvent.press(getByTestId('profile-activity-Tennis'));
    fireEvent.press(getByTestId('profile-save-button'));

    await waitFor(() => {
      expect(doc).toHaveBeenCalledWith({ name: 'db-instance' }, 'users', 'user-123');
    });

    expect(serverTimestamp).toHaveBeenCalledTimes(1);
    expect(setDoc).toHaveBeenCalledWith(
      'user-doc',
      {
        uid: 'user-123',
        email: 'maya@example.com',
        displayName: 'Maya',
        bio: 'Coffee, walks, and tennis',
        photoUrl: 'https://example.com/new.jpg',
        favoriteActivities: ['Tennis'],
        updatedAt: 'server-timestamp',
        createdAt: 'created-before'
      },
      { merge: true }
    );

    expect(onProfileSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'user-123',
        displayName: 'Maya',
        favoriteActivities: ['Tennis']
      })
    );
    expect(Alert.alert).toHaveBeenCalledWith(
      'Profile updated',
      'Your profile is ready for more real-time matches.'
    );
  });
});
