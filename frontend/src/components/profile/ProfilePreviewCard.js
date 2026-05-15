import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const ProfilePreviewCard = ({ displayName, bio, photoUrl, favoriteActivities }) => {
  const safeDisplayName = displayName?.trim() || 'RuFree User';
  const previewBio =
    bio?.trim() || 'Let people know what you are up for when the right plan pops up.';
  const selectedActivities = favoriteActivities.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {photoUrl?.trim() ? (
          <Image source={{ uri: photoUrl.trim() }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{safeDisplayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.identityBlock}>
          <Text style={styles.name}>{safeDisplayName}</Text>
          <Text style={styles.status}>Available for spontaneous plans</Text>
        </View>
      </View>

      <Text style={styles.bio}>{previewBio}</Text>

      <View style={styles.tagsRow}>
        {selectedActivities.length > 0 ? (
          selectedActivities.map((activity) => (
            <View key={activity} style={styles.tag}>
              <Text style={styles.tagText}>{activity}</Text>
            </View>
          ))
        ) : (
          <View style={styles.tagMuted}>
            <Text style={styles.tagMutedText}>Choose activities to unlock better matches</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#082C33',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#04171C',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#BDECE6'
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0C7B78'
  },
  identityBlock: {
    flex: 1,
    marginLeft: 14
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800'
  },
  status: {
    marginTop: 4,
    color: '#7DE6DA',
    fontSize: 13,
    fontWeight: '600'
  },
  bio: {
    color: '#D5EEEA',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    backgroundColor: 'rgba(125, 230, 218, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  tagText: {
    color: '#C9FFF8',
    fontSize: 13,
    fontWeight: '700'
  },
  tagMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  tagMutedText: {
    color: '#B8CDCA',
    fontSize: 13,
    fontWeight: '600'
  }
});

export default ProfilePreviewCard;
