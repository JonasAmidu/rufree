import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ACTIVITY_OPTIONS } from '../../utils/activityOptions';

const QUICK_ACTIVITY_OPTIONS = [
  'Coffee Chats',
  'Walk',
  'Dinner',
  'Live Music',
  'Tennis',
  'Co-working'
];

const DATE_SHORTCUTS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' }
];

const TIME_SHORTCUTS = [
  { key: 'now', label: 'Now', value: 'Now' },
  { key: '30', label: '30 min', offsetMinutes: 30 },
  { key: '120', label: '2 hrs', offsetMinutes: 120 },
  { key: 'tonight', label: 'Tonight', value: '19:00' }
];

const padTime = (value) => String(value).padStart(2, '0');

const formatDateInput = (date) =>
  `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`;

const formatTimeInput = (date) => `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;

export const getDefaultActivityValues = () => ({
  activity: '',
  locationName: '',
  date: formatDateInput(new Date()),
  time: '',
  isUrgent: true
});

export const getInitialActivityValues = (initialValues = {}) => ({
  ...getDefaultActivityValues(),
  ...initialValues
});

export const buildStartTime = ({ date, time, isUrgent }) => {
  if (isUrgent && !date && !time) {
    return new Date();
  }

  if (!date || !time || time.toLowerCase() === 'now') {
    return isUrgent ? new Date() : null;
  }

  const candidate = new Date(`${date}T${time}`);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
};

export const validateActivityValues = (values) => {
  const activity = values.activity.trim();
  const locationName = values.locationName.trim();

  if (!activity || !locationName) {
    return 'Add an activity and a meetup spot so people know what they are saying yes to.';
  }

  if (!values.isUrgent) {
    if (!values.date || !values.time) {
      return 'Pick a date and time, or mark it as available now for a spontaneous plan.';
    }

    const startTime = buildStartTime(values);
    if (!startTime) {
      return 'Use a valid date and time for your activity.';
    }
  }

  return null;
};

const ActivityComposer = ({
  initialValues,
  onSubmit,
  onCancel,
  submitting = false
}) => {
  const [values, setValues] = useState(getInitialActivityValues(initialValues));
  const [error, setError] = useState('');

  const selectedActivity = values.activity.trim();
  const popularActivities = useMemo(() => {
    const combined = [...QUICK_ACTIVITY_OPTIONS, ...ACTIVITY_OPTIONS];
    return [...new Set(combined)].slice(0, 8);
  }, []);

  const updateField = (field, nextValue) => {
    setValues((current) => ({
      ...current,
      [field]: nextValue
    }));
    setError('');
  };

  const applyDateShortcut = (shortcut) => {
    const base = new Date();
    if (shortcut.key === 'tomorrow') {
      base.setDate(base.getDate() + 1);
    }

    updateField('date', formatDateInput(base));
  };

  const applyTimeShortcut = (shortcut) => {
    if (shortcut.value) {
      updateField('time', shortcut.value);
      return;
    }

    const base = new Date(Date.now() + shortcut.offsetMinutes * 60 * 1000);
    updateField('time', formatTimeInput(base));
  };

  const handleUrgentToggle = (nextValue) => {
    setValues((current) => ({
      ...current,
      isUrgent: nextValue,
      time: nextValue && !current.time ? 'Now' : current.time
    }));
    setError('');
  };

  const handleSubmit = () => {
    const nextValues = {
      ...values,
      activity: values.activity.trim(),
      locationName: values.locationName.trim()
    };

    const validationError = validateActivityValues(nextValues);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit?.({
      ...nextValues,
      startTime: buildStartTime(nextValues)
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Post something spontaneous</Text>
        <Text style={styles.title}>Who is free right now?</Text>
        <Text style={styles.subtitle}>
          Share a real activity, a real place, and the exact moment you want company.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Pick the vibe</Text>
      <View style={styles.chipRow}>
        {popularActivities.map((activity) => {
          const selected = selectedActivity === activity;

          return (
            <TouchableOpacity
              key={activity}
              testID={`activity-preset-${activity}`}
              onPress={() => updateField('activity', activity)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{activity}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Activity name</Text>
      <TextInput
        testID="activity-name-input"
        style={styles.input}
        placeholder="Coffee on Southbank"
        value={values.activity}
        onChangeText={(text) => updateField('activity', text)}
        placeholderTextColor="#7A8B95"
      />

      <Text style={styles.label}>Meetup spot</Text>
      <TextInput
        testID="location-name-input"
        style={styles.input}
        placeholder="Soho Coffee House"
        value={values.locationName}
        onChangeText={(text) => updateField('locationName', text)}
        placeholderTextColor="#7A8B95"
      />

      <View style={styles.urgentCard}>
        <View style={styles.urgentCopy}>
          <Text style={styles.urgentTitle}>Available now</Text>
          <Text style={styles.urgentBody}>
            Turn this on when you want people to join soon, not after a week of planning.
          </Text>
        </View>
        <Switch
          testID="urgent-toggle"
          value={values.isUrgent}
          onValueChange={handleUrgentToggle}
          trackColor={{ false: '#D0D9DE', true: '#20C9B3' }}
          thumbColor={values.isUrgent ? '#FFFFFF' : '#F4F6F7'}
        />
      </View>

      <View style={styles.shortcutGroup}>
        <Text style={styles.sectionTitle}>Set the moment</Text>
        <View style={styles.shortcutRow}>
          {DATE_SHORTCUTS.map((shortcut) => (
            <TouchableOpacity
              key={shortcut.key}
              testID={`date-shortcut-${shortcut.key}`}
              onPress={() => applyDateShortcut(shortcut)}
              style={styles.shortcutChip}
            >
              <Text style={styles.shortcutText}>{shortcut.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.shortcutRow}>
          {TIME_SHORTCUTS.map((shortcut) => (
            <TouchableOpacity
              key={shortcut.key}
              testID={`time-shortcut-${shortcut.key}`}
              onPress={() => applyTimeShortcut(shortcut)}
              style={styles.shortcutChip}
            >
              <Text style={styles.shortcutText}>{shortcut.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.datetimeRow}>
        <View style={styles.datetimeColumn}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            testID="activity-date-input"
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={values.date}
            onChangeText={(text) => updateField('date', text)}
            autoCapitalize="none"
            placeholderTextColor="#7A8B95"
          />
        </View>
        <View style={styles.datetimeColumn}>
          <Text style={styles.label}>Time</Text>
          <TextInput
            testID="activity-time-input"
            style={styles.input}
            placeholder="HH:MM or Now"
            value={values.time}
            onChangeText={(text) => updateField('time', text)}
            autoCapitalize="none"
            placeholderTextColor="#7A8B95"
          />
        </View>
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewBadge}>{values.isUrgent ? 'AVAILABLE NOW' : 'SCHEDULED'}</Text>
        <Text style={styles.previewHeadline}>
          {selectedActivity || 'Your activity'} at {values.locationName.trim() || 'your meetup spot'}
        </Text>
        <Text style={styles.previewMeta}>
          {values.isUrgent
            ? 'Shown to people who are up for a spontaneous plan nearby.'
            : `Happening ${values.date || 'soon'} ${values.time || ''}`.trim()}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          testID="cancel-activity-button"
          style={styles.secondaryButton}
          onPress={onCancel}
          disabled={submitting}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="submit-activity-button"
          style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Posting...' : 'Post activity'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#062636'
  },
  eyebrow: {
    color: '#20C9B3',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8
  },
  title: {
    color: '#F7FBFC',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10
  },
  subtitle: {
    color: '#D0E6EA',
    lineHeight: 22,
    fontSize: 15
  },
  sectionTitle: {
    color: '#123247',
    fontSize: 16,
    fontWeight: '700'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E2E8'
  },
  chipSelected: {
    backgroundColor: '#103B4B',
    borderColor: '#103B4B'
  },
  chipText: {
    color: '#305062',
    fontWeight: '600'
  },
  chipTextSelected: {
    color: '#FFFFFF'
  },
  label: {
    color: '#234455',
    fontSize: 15,
    fontWeight: '700'
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D6E2E8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#0B2231',
    fontSize: 16
  },
  urgentCard: {
    borderRadius: 20,
    backgroundColor: '#EAF9F6',
    borderWidth: 1,
    borderColor: '#B7EFE7',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  urgentCopy: {
    flex: 1
  },
  urgentTitle: {
    color: '#123247',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4
  },
  urgentBody: {
    color: '#41616F',
    lineHeight: 20
  },
  shortcutGroup: {
    gap: 10
  },
  shortcutRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  shortcutChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EEF4F7'
  },
  shortcutText: {
    color: '#305062',
    fontWeight: '600'
  },
  datetimeRow: {
    flexDirection: 'row',
    gap: 12
  },
  datetimeColumn: {
    flex: 1,
    gap: 8
  },
  previewCard: {
    borderRadius: 20,
    backgroundColor: '#FFF5E8',
    padding: 18,
    borderWidth: 1,
    borderColor: '#FFD39D',
    gap: 8
  },
  previewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF7A3D',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden'
  },
  previewHeadline: {
    color: '#103141',
    fontSize: 19,
    fontWeight: '800'
  },
  previewMeta: {
    color: '#5C6E77',
    lineHeight: 20
  },
  errorCard: {
    borderRadius: 16,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#F6B4B4',
    padding: 14
  },
  errorText: {
    color: '#A73232',
    lineHeight: 20,
    fontWeight: '600'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D6E2E8',
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  secondaryButtonText: {
    color: '#27485A',
    fontWeight: '700'
  },
  primaryButton: {
    flex: 1.4,
    borderRadius: 16,
    backgroundColor: '#11B9A6',
    paddingVertical: 16,
    alignItems: 'center'
  },
  primaryButtonDisabled: {
    opacity: 0.7
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16
  }
});

export default ActivityComposer;
