import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const formatPresenceLabel = (thread) => {
  if (thread.availableNow) {
    return 'Available now';
  }

  if (thread.nextWindow) {
    return thread.nextWindow;
  }

  return 'Open to connect';
};

const ConversationPreviewCard = ({ thread, onPress }) => {
  const unreadCount = thread.unreadCount || 0;
  const presenceLabel = formatPresenceLabel(thread);
  const avatarLetter = thread.name?.trim()?.charAt(0)?.toUpperCase() || '?';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => onPress?.(thread)}
      style={styles.card}
      testID={`message-thread-${thread.id}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarLetter}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.name}>
            {thread.name}
          </Text>
          <Text style={styles.timestamp}>{thread.lastActiveLabel}</Text>
        </View>

        <View style={styles.contextRow}>
          <View style={[styles.presenceBadge, thread.availableNow && styles.presenceBadgeActive]}>
            <Ionicons
              color={thread.availableNow ? '#0E8B7D' : '#6A7D89'}
              name={thread.availableNow ? 'flash' : 'time-outline'}
              size={13}
            />
            <Text
              style={[
                styles.presenceText,
                thread.availableNow && styles.presenceTextActive
              ]}
            >
              {presenceLabel}
            </Text>
          </View>
          {thread.activity ? (
            <Text numberOfLines={1} style={styles.activityText}>
              {thread.activity}
            </Text>
          ) : null}
        </View>

        <Text numberOfLines={2} style={styles.preview}>
          {thread.lastMessage}
        </Text>

        <View style={styles.footerRow}>
          <Text numberOfLines={1} style={styles.metaText}>
            {thread.distanceLabel} away {thread.activity ? `• ${thread.activity}` : ''}
          </Text>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E4E9',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    shadowColor: '#123247',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#0C3343',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800'
  },
  content: {
    flex: 1,
    gap: 10
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between'
  },
  name: {
    color: '#14364B',
    flex: 1,
    fontSize: 18,
    fontWeight: '800'
  },
  timestamp: {
    color: '#69808C',
    fontSize: 12,
    fontWeight: '700'
  },
  contextRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  presenceBadge: {
    alignItems: 'center',
    backgroundColor: '#EEF4F7',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  presenceBadgeActive: {
    backgroundColor: '#DFF8F3'
  },
  presenceText: {
    color: '#506672',
    fontSize: 12,
    fontWeight: '700'
  },
  presenceTextActive: {
    color: '#0E8B7D'
  },
  activityText: {
    color: '#F36A3D',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700'
  },
  preview: {
    color: '#44616E',
    fontSize: 14,
    lineHeight: 20
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between'
  },
  metaText: {
    color: '#6A7D89',
    flex: 1,
    fontSize: 12,
    fontWeight: '600'
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: '#FF7A3D',
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 8
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  }
});

export default ConversationPreviewCard;
