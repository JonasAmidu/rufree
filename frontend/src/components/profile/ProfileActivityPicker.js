import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const ProfileActivityPicker = ({ activities, selectedActivities, onToggleActivity }) => (
  <View style={styles.wrapper}>
    {activities.map((activity) => {
      const selected = selectedActivities.includes(activity);

      return (
        <Pressable
          key={activity}
          accessibilityRole="button"
          testID={`profile-activity-${activity}`}
          style={({ pressed }) => [
            styles.chip,
            selected && styles.chipSelected,
            pressed && styles.chipPressed
          ]}
          onPress={() => onToggleActivity(activity)}
        >
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{activity}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  chip: {
    borderWidth: 1,
    borderColor: '#D6E4E1',
    backgroundColor: '#F7FBFA',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipSelected: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6'
  },
  chipPressed: {
    opacity: 0.88
  },
  chipText: {
    color: '#18404A',
    fontSize: 14,
    fontWeight: '600'
  },
  chipTextSelected: {
    color: '#FFFFFF'
  }
});

export default ProfileActivityPicker;
