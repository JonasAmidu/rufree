import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SettingsSection = ({ eyebrow, title, description, children }) => (
  <View style={styles.section}>
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
    <View style={styles.rows}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    gap: 12
  },
  header: {
    gap: 6
  },
  eyebrow: {
    color: '#0F9F90',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase'
  },
  title: {
    color: '#0B1E24',
    fontSize: 22,
    fontWeight: '800'
  },
  description: {
    color: '#5B7178',
    fontSize: 14,
    lineHeight: 21
  },
  rows: {
    gap: 10
  }
});

export default SettingsSection;
