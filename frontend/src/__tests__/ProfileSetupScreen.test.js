import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { signOut } from '@firebase/auth';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';

jest.mock('@firebase/auth', () => ({
  signOut: jest.fn()
}));

jest.mock('@firebase/firestore', () => ({
  doc: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn()
}));

jest.mock('../firebase/config', () => ({
  auth: { name: 'auth-instance' },
  db: { name: 'db-instance' }
}));

describe('ProfileSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lets incomplete-profile users sign out from setup', async () => {
    signOut.mockResolvedValue();

    const { getByTestId } = render(
      <ProfileSetupScreen
        user={{ uid: 'user-123', email: 'maya@example.com' }}
        initialProfile={{ displayName: 'Maya' }}
        onProfileSaved={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('profile-setup-sign-out-button'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ name: 'auth-instance' });
    });
  });
});
