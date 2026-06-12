import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { serverTimestamp } from '@firebase/firestore';
import AppBackground from '../components/AppBackground';
import ActivityComposer from '../components/activity/ActivityComposer';
import { auth, db } from '../firebase/config';
import { createActivity } from '../utils/activityFeed';
import { toPublicLocation } from '../utils/privacy';

const getCreatorName = (user, creatorProfile) => {
  if (creatorProfile?.displayName) {
    return creatorProfile.displayName;
  }

  if (user?.displayName) {
    return user.displayName;
  }

  if (user?.email) {
    return user.email.split('@')[0];
  }

  return 'RuFree user';
};

export const buildCreateActivityPayload = (values, { currentLocation, creatorProfile, user }) => {
  const creatorId = user?.uid || auth.currentUser?.uid;
  const publicLocation = toPublicLocation(currentLocation || creatorProfile?.location);

  if (!creatorId) {
    throw new Error('Sign in again before posting an activity.');
  }

  return {
    activity: values.activity,
    creatorId,
    creatorName: getCreatorName(user || auth.currentUser, creatorProfile),
    createdAt: serverTimestamp(),
    isUrgent: values.isUrgent,
    availableUntil: values.isUrgent ? new Date(Date.now() + 60 * 60 * 1000) : null,
    location: {
      name: values.locationName,
      latitude: publicLocation?.latitude ?? null,
      longitude: publicLocation?.longitude ?? null
    },
    startTime: values.startTime || new Date(),
    tags: [values.activity.toLowerCase()]
  };
};

const CreateActivityScreen = ({
  user = auth.currentUser,
  creatorProfile = null,
  currentLocation = null,
  onSubmit,
  onCancel
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    try {
      const payload = buildCreateActivityPayload(values, {
        currentLocation,
        creatorProfile,
        user
      });

      setSubmitting(true);
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        await createActivity(db, payload);
      }

      Alert.alert('Activity posted', 'Your activity is live for nearby people right now.');
    } catch (error) {
      console.error('Create activity failed', error);
      Alert.alert('Could not post activity', error.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Create a live activity</Text>
            <Text style={styles.subtitle}>
              RuFree works best when the invite is simple, local, and easy to join fast.
            </Text>
          </View>

          <View style={styles.guidelineCard}>
            <Text style={styles.guidelineTitle}>A strong post has three things</Text>
            <Text style={styles.guidelineBody}>1. A real activity someone can picture immediately.</Text>
            <Text style={styles.guidelineBody}>2. A meetup spot nearby.</Text>
            <Text style={styles.guidelineBody}>3. A start time that feels like now, not someday.</Text>
          </View>

          <ActivityComposer onSubmit={handleSubmit} onCancel={onCancel} submitting={submitting} />
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
    padding: 24,
    gap: 20
  },
  header: {
    gap: 10
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D2B3D'
  },
  subtitle: {
    color: '#496471',
    fontSize: 16,
    lineHeight: 24
  },
  guidelineCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCE8ED',
    gap: 8
  },
  guidelineTitle: {
    color: '#14364B',
    fontSize: 17,
    fontWeight: '800'
  },
  guidelineBody: {
    color: '#4F6976',
    lineHeight: 22
  }
});

export default CreateActivityScreen;
