import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AuthScreen from '../screens/AuthScreen';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@firebase/auth';
import { doc, serverTimestamp, setDoc } from '@firebase/firestore';

jest.mock('@firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn()
}));

jest.mock('@firebase/firestore', () => ({
  doc: jest.fn(() => 'user-doc'),
  serverTimestamp: jest.fn(() => 'server-timestamp'),
  setDoc: jest.fn()
}));

jest.mock('../firebase/config', () => ({
  auth: { name: 'auth-instance' },
  db: { name: 'db-instance' }
}));

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    Alert.alert.mockRestore();
  });

  it('validates required signup fields', () => {
    const { getByTestId } = render(<AuthScreen />);

    fireEvent.press(getByTestId('auth-toggle-button'));
    fireEvent.press(getByTestId('auth-submit-button'));

    expect(Alert.alert).toHaveBeenCalledWith('Missing info', 'Please complete all required fields.');
  });

  it('shows a helpful Firebase configuration message when email/password auth is disabled', async () => {
    createUserWithEmailAndPassword.mockRejectedValue({
      code: 'auth/configuration-not-found',
      message: 'Firebase: Error (auth/configuration-not-found).'
    });

    const { getByTestId } = render(<AuthScreen />);

    fireEvent.press(getByTestId('auth-toggle-button'));
    fireEvent.changeText(getByTestId('display-name-input'), 'Codex User');
    fireEvent.changeText(getByTestId('email-input'), 'codex@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'TestPass123!');
    fireEvent.press(getByTestId('auth-submit-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Authentication Error',
        "Email/password sign-in is not enabled in Firebase yet. Turn it on in Firebase Authentication > Sign-in method."
      );
    });
  });

  it('creates the auth user and Firestore profile on successful signup', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'user-123' }
    });
    setDoc.mockResolvedValue();

    const { getByTestId } = render(<AuthScreen />);

    fireEvent.press(getByTestId('auth-toggle-button'));
    fireEvent.changeText(getByTestId('display-name-input'), 'Codex User');
    fireEvent.changeText(getByTestId('email-input'), 'codex@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'TestPass123!');
    fireEvent.press(getByTestId('auth-submit-button'));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        { name: 'auth-instance' },
        'codex@example.com',
        'TestPass123!'
      );
    });

    expect(doc).toHaveBeenCalledWith({ name: 'db-instance' }, 'users', 'user-123');
    expect(serverTimestamp).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalledWith('user-doc', {
      uid: 'user-123',
      displayName: 'Codex User',
      createdAt: 'server-timestamp'
    });
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Account created successfully.');
  });

  it('logs in with trimmed credentials', async () => {
    signInWithEmailAndPassword.mockResolvedValue();

    const { getByTestId } = render(<AuthScreen />);

    fireEvent.changeText(getByTestId('email-input'), ' codex@example.com ');
    fireEvent.changeText(getByTestId('password-input'), 'TestPass123!');
    fireEvent.press(getByTestId('auth-submit-button'));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        { name: 'auth-instance' },
        'codex@example.com',
        'TestPass123!'
      );
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
