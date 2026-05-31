import React, { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { doc, serverTimestamp, setDoc } from '@firebase/firestore';
import ProfileForm from '../components/profile/ProfileForm';
import { db } from '../firebase/config';

const EditProfileScreen = ({ user, initialProfile, onProfileSaved, onCancel }) => {
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo(
    () => ({
      displayName:
        initialProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || '',
      bio: initialProfile?.bio || '',
      photoUrl: initialProfile?.photoUrl || '',
      favoriteActivities: initialProfile?.favoriteActivities || []
    }),
    [initialProfile, user?.displayName, user?.email]
  );

  const handleSave = async (values) => {
    if (!user?.uid) {
      Alert.alert('Profile unavailable', 'Sign in again before editing your profile.');
      return;
    }

    setSaving(true);

    const profilePayload = {
      uid: user.uid,
      email: user.email || initialProfile?.email || '',
      displayName: values.displayName,
      bio: values.bio,
      photoUrl: values.photoUrl,
      favoriteActivities: values.favoriteActivities,
      updatedAt: serverTimestamp(),
      createdAt: initialProfile?.createdAt || serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', user.uid), profilePayload, { merge: true });

      const savedProfile = {
        ...initialProfile,
        ...profilePayload
      };

      onProfileSaved?.(savedProfile);
      Alert.alert('Profile updated', 'Your profile is ready for more real-time matches.');
    } catch (error) {
      console.error('Edit profile save error', error);
      Alert.alert('Save failed', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileForm
      initialValues={initialValues}
      onSave={handleSave}
      onCancel={onCancel}
      saving={saving}
      title="Tune your real-time profile"
      subtitle="Update the details that help nearby people decide whether to join you for a coffee, walk, gym run, or last-minute plan."
      submitLabel="Save changes"
    />
  );
};

export default EditProfileScreen;
