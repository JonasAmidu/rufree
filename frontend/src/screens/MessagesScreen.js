import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppBackground from '../components/AppBackground';
import MessageHeroCard from '../components/messages/MessageHeroCard';
import ConversationPreviewCard from '../components/messages/ConversationPreviewCard';
import EmptyMessagesState from '../components/messages/EmptyMessagesState';

export const DEFAULT_MESSAGE_THREADS = [
  {
    id: 'coffee-maya',
    name: 'Maya',
    activity: 'Coffee Hangout',
    availableNow: true,
    distanceLabel: '0.8 km',
    lastActiveLabel: '2m ago',
    lastMessage: 'I can be there in 15. Want to grab the table by the window?',
    nextWindow: '',
    unreadCount: 2
  },
  {
    id: 'walk-james',
    name: 'James',
    activity: 'Evening Walk',
    availableNow: true,
    distanceLabel: '1.3 km',
    lastActiveLabel: '5m ago',
    lastMessage: 'A couple of us are heading toward the riverside path now.',
    nextWindow: '',
    unreadCount: 0
  },
  {
    id: 'tennis-priya',
    name: 'Priya',
    activity: 'Tennis Match',
    availableNow: false,
    distanceLabel: '2.1 km',
    lastActiveLabel: '20m ago',
    lastMessage: 'Court 3 opened up. If you are free after work, join us there.',
    nextWindow: 'Tonight at 7:30',
    unreadCount: 1
  }
];

export const buildMessageMetrics = (threads = []) => ({
  unreadCount: threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0),
  availableNowCount: threads.filter((thread) => thread.availableNow).length,
  activityMatches: new Set(threads.map((thread) => thread.activity).filter(Boolean)).size
});

const MessagesScreen = ({
  threads = DEFAULT_MESSAGE_THREADS,
  onOpenThread,
  onFindPeople
}) => {
  const metrics = useMemo(() => buildMessageMetrics(threads), [threads]);
  const hasThreads = threads.length > 0;

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Messages</Text>
          <Text style={styles.title}>Keep the momentum going once people say yes.</Text>
          <Text style={styles.subtitle}>
            RuFree messaging should feel like the bridge between finding someone nearby and meeting up
            in real life.
          </Text>
        </View>

        <MessageHeroCard
          activityMatches={metrics.activityMatches}
          availableNowCount={metrics.availableNowCount}
          unreadCount={metrics.unreadCount}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your live circles</Text>
          <Text style={styles.sectionCaption}>Built for fast replies and activity-led plans.</Text>
        </View>

        {hasThreads ? (
          <View style={styles.threadList}>
            {threads.map((thread) => (
              <ConversationPreviewCard key={thread.id} onPress={onOpenThread} thread={thread} />
            ))}
          </View>
        ) : (
          <EmptyMessagesState onPrimaryAction={onFindPeople} />
        )}

        <View style={styles.guidanceCard}>
          <Text style={styles.guidanceTitle}>What this should become</Text>
          <Text style={styles.guidanceBody}>
            Conversations should attach to an activity, show who is still available, and make it
            easy to move into a meetup without a long back-and-forth.
          </Text>
        </View>
      </ScrollView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  container: {
    gap: 18,
    padding: 24
  },
  header: {
    gap: 10
  },
  eyebrow: {
    color: '#0CA999',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1
  },
  title: {
    color: '#0E2F43',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38
  },
  subtitle: {
    color: '#4F6976',
    fontSize: 16,
    lineHeight: 24
  },
  sectionHeader: {
    gap: 4,
    marginTop: 4
  },
  sectionTitle: {
    color: '#13354A',
    fontSize: 19,
    fontWeight: '800'
  },
  sectionCaption: {
    color: '#637A86',
    fontSize: 14
  },
  threadList: {
    gap: 12
  },
  guidanceCard: {
    backgroundColor: '#FFF5E8',
    borderColor: '#FFD39D',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 20
  },
  guidanceTitle: {
    color: '#103141',
    fontSize: 18,
    fontWeight: '800'
  },
  guidanceBody: {
    color: '#596E78',
    lineHeight: 22
  }
});

export default MessagesScreen;
