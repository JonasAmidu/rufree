import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessageHeroCard = ({
  availableNowCount = 0,
  unreadCount = 0,
  activityMatches = 0
}) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.badge}>
        <Ionicons color="#12C7B1" name="flash" size={16} />
        <Text style={styles.badgeText}>Real-time social</Text>
      </View>
      <Text style={styles.statusText}>{unreadCount} unread</Text>
    </View>

    <Text style={styles.title}>Conversations that can turn into plans tonight.</Text>
    <Text style={styles.subtitle}>
      Keep chat lightweight so people can move from "maybe" to "see you there" without overplanning.
    </Text>

    <View style={styles.metricsRow}>
      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{availableNowCount}</Text>
        <Text style={styles.metricLabel}>available now</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{activityMatches}</Text>
        <Text style={styles.metricLabel}>activity circles</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{unreadCount}</Text>
        <Text style={styles.metricLabel}>need a reply</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#062636',
    borderRadius: 28,
    padding: 22,
    gap: 16
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  badgeText: {
    color: '#D8F7F2',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4
  },
  statusText: {
    color: '#A9D8DF',
    fontSize: 13,
    fontWeight: '700'
  },
  title: {
    color: '#F6FCFD',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34
  },
  subtitle: {
    color: '#BEDBE0',
    fontSize: 15,
    lineHeight: 22
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10
  },
  metricCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800'
  },
  metricLabel: {
    color: '#9ECCD3',
    fontSize: 12,
    marginTop: 4
  }
});

export default MessageHeroCard;
