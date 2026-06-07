import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { ACTIVITY_OPTIONS } from '../../utils/activityOptions';
import ProfileActivityPicker from './ProfileActivityPicker';
import ProfilePreviewCard from './ProfilePreviewCard';

const buildInitialState = (initialValues = {}) => ({
  displayName: initialValues.displayName || '',
  bio: initialValues.bio || '',
  photoUrl: initialValues.photoUrl || '',
  favoriteActivities: Array.isArray(initialValues.favoriteActivities)
    ? initialValues.favoriteActivities
    : []
});

const validateValues = ({ displayName, favoriteActivities }) => {
  if (!displayName.trim()) {
    return 'Add a display name so people know who is free.';
  }

  if (favoriteActivities.length === 0) {
    return 'Pick at least one favorite activity to improve matching.';
  }

  return '';
};

const ProfileForm = ({
  initialValues,
  onSave,
  onCancel,
  saving = false,
  title = 'Edit your profile',
  subtitle = 'Make it easy for nearby people to understand what you would say yes to right now.',
  submitLabel = 'Save profile'
}) => {
  const [formValues, setFormValues] = useState(() => buildInitialState(initialValues));
  const [validationMessage, setValidationMessage] = useState('');

  const canSave = useMemo(
    () => validateValues(formValues).length === 0 && !saving,
    [formValues, saving]
  );

  const updateField = (field, value) => {
    setValidationMessage('');
    setFormValues((current) => ({
      ...current,
      [field]: value
    }));
  };

  const toggleActivity = (activity) => {
    setValidationMessage('');
    setFormValues((current) => {
      const isSelected = current.favoriteActivities.includes(activity);

      return {
        ...current,
        favoriteActivities: isSelected
          ? current.favoriteActivities.filter((item) => item !== activity)
          : [...current.favoriteActivities, activity]
      };
    });
  };

  const handleSubmit = async () => {
    const message = validateValues(formValues);

    if (message) {
      setValidationMessage(message);
      return;
    }

    await onSave({
      displayName: formValues.displayName.trim(),
      bio: formValues.bio.trim(),
      photoUrl: formValues.photoUrl.trim(),
      favoriteActivities: formValues.favoriteActivities
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Real-time profile</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <ProfilePreviewCard
          displayName={formValues.displayName}
          bio={formValues.bio}
          photoUrl={formValues.photoUrl}
          favoriteActivities={formValues.favoriteActivities}
        />

        <View style={styles.section}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            testID="profile-display-name-input"
            style={styles.input}
            value={formValues.displayName}
            onChangeText={(value) => updateField('displayName', value)}
            placeholder="How should nearby people know you?"
            placeholderTextColor="#7C9599"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Photo URL (optional)</Text>
          <TextInput
            testID="profile-photo-url-input"
            style={styles.input}
            value={formValues.photoUrl}
            onChangeText={(value) => updateField('photoUrl', value)}
            autoCapitalize="none"
            placeholder="https://example.com/profile-photo.jpg"
            placeholderTextColor="#7C9599"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Short bio (optional)</Text>
          <TextInput
            testID="profile-bio-input"
            style={[styles.input, styles.bioInput]}
            value={formValues.bio}
            onChangeText={(value) => updateField('bio', value)}
            multiline
            textAlignVertical="top"
            placeholder="Coffee before work, tennis after, and always open to last-minute plans."
            placeholderTextColor="#7C9599"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Favorite activities</Text>
            <Text style={styles.helper}>Choose the plans you would actually join now.</Text>
          </View>

          <ProfileActivityPicker
            activities={ACTIVITY_OPTIONS}
            selectedActivities={formValues.favoriteActivities}
            onToggleActivity={toggleActivity}
          />
        </View>

        {validationMessage ? (
          <View style={styles.validationBanner}>
            <Text style={styles.validationText}>{validationMessage}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {onCancel ? (
            <Pressable
              testID="profile-cancel-button"
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={onCancel}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          ) : null}

          <Pressable
            testID="profile-save-button"
            style={({ pressed }) => [
              styles.primaryButton,
              !canSave && styles.primaryButtonDisabled,
              pressed && canSave && styles.buttonPressed
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : submitLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F3F7F6'
  },
  content: {
    padding: 22,
    paddingBottom: 40,
    gap: 18
  },
  hero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#DCE8E6'
  },
  eyebrow: {
    color: '#0F9F90',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  title: {
    marginTop: 10,
    color: '#0B1E24',
    fontSize: 30,
    fontWeight: '800'
  },
  subtitle: {
    marginTop: 10,
    color: '#456068',
    fontSize: 15,
    lineHeight: 23
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCE8E6',
    gap: 12
  },
  sectionHeader: {
    gap: 4
  },
  label: {
    color: '#0B1E24',
    fontSize: 16,
    fontWeight: '700'
  },
  helper: {
    color: '#5A7177',
    fontSize: 13,
    lineHeight: 18
  },
  input: {
    borderWidth: 1,
    borderColor: '#D6E4E1',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FCFC',
    fontSize: 16,
    color: '#16323A'
  },
  bioInput: {
    minHeight: 120
  },
  validationBanner: {
    backgroundColor: '#FFF1F1',
    borderColor: '#F8CACA',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14
  },
  validationText: {
    color: '#A84242',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C8D8D5',
    backgroundColor: '#FFFFFF',
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: '#31545B',
    fontSize: 16,
    fontWeight: '700'
  },
  primaryButton: {
    flex: 1.2,
    borderRadius: 18,
    backgroundColor: '#14B8A6',
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonDisabled: {
    opacity: 0.55
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  buttonPressed: {
    opacity: 0.9
  }
});

export default ProfileForm;
