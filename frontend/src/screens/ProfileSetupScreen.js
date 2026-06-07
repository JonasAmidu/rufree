import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { signOut } from '@firebase/auth';
import { doc, serverTimestamp, setDoc } from '@firebase/firestore';
import AppBackground from '../components/AppBackground';
import { auth, db } from '../firebase/config';
import { ACTIVITY_OPTIONS } from '../utils/activityOptions';

const ProfileSetupScreen = ({ user, initialProfile, onProfileSaved }) => {
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [photoUrl, setPhotoUrl] = useState(initialProfile?.photoUrl || '');
  const [favoriteActivities, setFavoriteActivities] = useState(
    Array.isArray(initialProfile?.favoriteActivities) ? initialProfile.favoriteActivities : []
  );
  const [loading, setLoading] = useState(false);

  const displayName = useMemo(() => {
    if (initialProfile?.displayName) {
      return initialProfile.displayName;
    }

    if (user?.displayName) {
      return user.displayName;
    }

    return user?.email?.split('@')[0] || 'RuFree User';
  }, [initialProfile?.displayName, user?.displayName, user?.email]);

  const toggleActivity = (activity) => {
    setFavoriteActivities((current) =>
      current.includes(activity)
        ? current.filter((item) => item !== activity)
        : [...current, activity]
    );
  };

  const handleSaveProfile = async () => {
    if (favoriteActivities.length === 0) {
      Alert.alert(
        'Complete your profile',
        'Pick at least one favorite activity so nearby people can match with you.'
      );
      return;
    }

    setLoading(true);

    const profilePayload = {
      uid: user.uid,
      email: user.email,
      displayName,
      bio: bio.trim(),
      photoUrl: photoUrl.trim(),
      favoriteActivities,
      updatedAt: serverTimestamp(),
      createdAt: initialProfile?.createdAt || serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'users', user.uid), profilePayload, { merge: true });
      onProfileSaved({
        ...initialProfile,
        ...profilePayload
      });
      Alert.alert('Profile saved', 'Your profile is ready. Let’s find your people.');
    } catch (error) {
      console.error('Profile save error', error);
      Alert.alert('Profile save failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Profile setup sign out error', error);
      Alert.alert('Sign out failed', error.message || 'Please try again.');
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Pick Your Vibe</Text>
          <Text style={styles.subtitle}>
            Choose what you would say yes to. You can add a photo and bio later.
          </Text>

        <View style={styles.previewCard}>
          {photoUrl.trim() ? (
            <Image source={{ uri: photoUrl.trim() }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.previewText}>
            <Text style={styles.previewName}>{displayName}</Text>
            <Text style={styles.previewBio}>
              {bio.trim() || 'Your quick intro will show up here.'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Profile Photo URL (optional)</Text>
        <TextInput
          testID="photo-url-input"
          style={styles.input}
          placeholder="https://example.com/my-photo.jpg"
          value={photoUrl}
          onChangeText={setPhotoUrl}
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <Text style={styles.sectionLabel}>Your Bio (optional)</Text>
        <TextInput
          testID="bio-input"
          style={[styles.input, styles.bioInput]}
          placeholder="I’m usually free for last-minute coffee, runs, and live music."
          value={bio}
          onChangeText={setBio}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#999"
        />

        <Text style={styles.sectionLabel}>Favorite Activities</Text>
        <View style={styles.activityGrid}>
          {ACTIVITY_OPTIONS.map((activity) => {
            const selected = favoriteActivities.includes(activity);

            return (
              <TouchableOpacity
                key={activity}
                testID={`activity-option-${activity}`}
                style={[styles.activityChip, selected && styles.activityChipSelected]}
                onPress={() => toggleActivity(activity)}
              >
                <Text style={[styles.activityChipText, selected && styles.activityChipTextSelected]}>
                  {activity}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          testID="save-profile-button"
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Enter RuFree'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="profile-setup-sign-out-button"
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={styles.signOutButtonText}>Sign out</Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  container: {
    padding: 24
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 24
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#F5D5B8'
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FF6B6B'
  },
  previewText: {
    flex: 1,
    marginLeft: 16
  },
  previewName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6
  },
  previewBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D8CB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20
  },
  bioInput: {
    minHeight: 120
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24
  },
  activityChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0D4B7',
    marginRight: 10,
    marginBottom: 10
  },
  activityChipSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B'
  },
  activityChipText: {
    color: '#66574A',
    fontWeight: '600'
  },
  activityChipTextSelected: {
    color: '#FFFFFF'
  },
  saveButton: {
    backgroundColor: '#FFC048',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20
  },
  saveButtonText: {
    color: '#4D3425',
    fontSize: 18,
    fontWeight: 'bold'
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: '#D8BFA6',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    paddingVertical: 14
  },
  signOutButtonText: {
    color: '#66574A',
    fontSize: 16,
    fontWeight: '700'
  }
});

export default ProfileSetupScreen;
