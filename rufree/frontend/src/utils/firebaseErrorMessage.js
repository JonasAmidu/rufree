const AUTH_ERROR_MESSAGES = {
  'auth/configuration-not-found':
    "Email/password sign-in is not enabled in Firebase yet. Turn it on in Firebase Authentication > Sign-in method.",
  'auth/email-already-in-use': 'That email is already in use. Try logging in instead.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
  'auth/invalid-credential': 'That email or password is incorrect.'
};

export const getFirebaseAuthErrorMessage = (error) => {
  if (!error || typeof error !== 'object') {
    return 'Something went wrong while contacting Firebase. Please try again.';
  }

  return AUTH_ERROR_MESSAGES[error.code] || error.message || 'Authentication failed. Please try again.';
};
