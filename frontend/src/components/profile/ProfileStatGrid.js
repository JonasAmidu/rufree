import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ProfileStatGrid = ({ stats = [] }) => (
  <View style={styles.grid}>
    {stats.map((stat) => (
      <View key={stat.label} style={styles.card}>
        <Text style={styles.value}>{stat.value}</Text>
        <Text style={styles.label}>{stat.label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  card: {
    minWidth: '47%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#DCE8E6'
  },
  value: {
    color: '#0B1E24',
    fontSize: 24,
    fontWeight: '800'
  },
  label: {
    marginTop: 6,
    color: '#587178',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600'
  }
});

export default ProfileStatGrid;
