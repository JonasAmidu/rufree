import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const SettingsRow = ({
  icon,
  title,
  description,
  onPress,
  status,
  destructive = false,
  testID
}) => {
  const disabled = !onPress;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        destructive && styles.rowDestructive,
        disabled && styles.rowDisabled,
        pressed && !disabled && styles.rowPressed
      ]}
      testID={testID}
    >
      <View style={[styles.iconWrap, destructive && styles.iconWrapDestructive]}>
        <Ionicons color={destructive ? '#C94141' : '#0F9F90'} name={icon} size={20} />
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, destructive && styles.titleDestructive]}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>

      {status ? (
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      {!disabled ? (
        <Ionicons
          color={destructive ? '#C94141' : '#6C7E84'}
          name="chevron-forward"
          size={18}
          style={styles.chevron}
        />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E6E3',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  rowPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }]
  },
  rowDisabled: {
    opacity: 0.94
  },
  rowDestructive: {
    borderColor: '#F3CCCC',
    backgroundColor: '#FFF8F8'
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#E9FAF7',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42
  },
  iconWrapDestructive: {
    backgroundColor: '#FFE7E7'
  },
  copy: {
    flex: 1,
    gap: 4
  },
  title: {
    color: '#0B1E24',
    fontSize: 16,
    fontWeight: '800'
  },
  titleDestructive: {
    color: '#912D2D'
  },
  description: {
    color: '#61757B',
    fontSize: 13,
    lineHeight: 19
  },
  statusPill: {
    backgroundColor: '#FFF2DE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusText: {
    color: '#C96F1B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  chevron: {
    marginLeft: 2
  }
});

export default SettingsRow;
