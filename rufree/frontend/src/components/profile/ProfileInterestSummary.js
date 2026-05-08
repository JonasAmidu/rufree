import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ProfileInterestSummary = ({ favoriteActivities = [] }) => (
  <View style={styles.card}>
    <Text style={styles.eyebrow}>Your activity lane</Text>
    <Text style={styles.title}>What you would say yes to right now</Text>
    <Text style={styles.body}>
      These interests help RuFree surface nearby people and spontaneous plans that feel natural to join.
    </Text>

    <View style={styles.chipRow}>
      {favoriteActivities.length > 0 ? (
        favoriteActivities.map((activity) => (
          <View key={activity} style={styles.chip}>
            <Text style={styles.chipText}>{activity}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Add a few favorite activities to unlock better nearby matches.</Text>
        </View>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCE8E6'
  },
  eyebrow: {
    color: '#FF7B54',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9
  },
  title: {
    marginTop: 8,
    color: '#0B1E24',
    fontSize: 24,
    fontWeight: '800'
  },
  body: {
    marginTop: 8,
    color: '#567077',
    fontSize: 14,
    lineHeight: 21
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18
  },
  chip: {
    borderRadius: 999,
    backgroundColor: '#E8FBF8',
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipText: {
    color: '#0A5F60',
    fontSize: 14,
    fontWeight: '700'
  },
  emptyCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#F4F8F8',
    padding: 16
  },
  emptyText: {
    color: '#61737A',
    fontSize: 14,
    lineHeight: 20
  }
});

export default ProfileInterestSummary;
