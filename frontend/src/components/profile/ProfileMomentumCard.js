import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const buildMomentumLine = ({ joinedCount, hostedCount, nearbyCount }) => {
  if (joinedCount > 0) {
    return `You already have ${joinedCount} live plan${joinedCount === 1 ? '' : 's'} in motion.`;
  }

  if (hostedCount > 0) {
    return `You have hosted ${hostedCount} spontaneous plan${hostedCount === 1 ? '' : 's'} so far.`;
  }

  if (nearbyCount > 0) {
    return `${nearbyCount} people nearby could match with you once you jump into an activity.`;
  }

  return 'Your profile is ready for the next spontaneous yes.';
};

const ProfileMomentumCard = ({
  profileReady,
  completionPercent,
  joinedCount,
  hostedCount,
  nearbyCount
}) => {
  const headline = profileReady ? 'You are ready to meet people right now' : 'Finish your real-time identity';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.progressWrap}>
          <Text style={styles.progressValue}>{completionPercent}%</Text>
          <Text style={styles.progressLabel}>profile signal</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{headline}</Text>
          <Text style={styles.body}>
            {buildMomentumLine({ joinedCount, hostedCount, nearbyCount })}
          </Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Joined now</Text>
          <Text style={styles.badgeValue}>{joinedCount}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Hosted</Text>
          <Text style={styles.badgeValue}>{hostedCount}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Nearby matches</Text>
          <Text style={styles.badgeValue}>{nearbyCount}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0C2730',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#173D48'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  progressWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#123742',
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressValue: {
    color: '#F6FFFE',
    fontSize: 24,
    fontWeight: '900'
  },
  progressLabel: {
    marginTop: 2,
    color: '#7DE6DA',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  copy: {
    flex: 1,
    marginLeft: 16
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28
  },
  body: {
    marginTop: 8,
    color: '#B7D5D8',
    fontSize: 14,
    lineHeight: 20
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18
  },
  badge: {
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: '#123742',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  badgeLabel: {
    color: '#8FB8BE',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  badgeValue: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800'
  }
});

export default ProfileMomentumCard;
