import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const INFO_STYLES = {
  neutral: {
    backgroundColor: '#082C33',
    borderColor: '#104B56',
    iconColor: '#7DE6DA',
    titleColor: '#FFFFFF',
    bodyColor: '#CCE8E4'
  },
  warm: {
    backgroundColor: '#FFF5E8',
    borderColor: '#FFD5A5',
    iconColor: '#FF8B31',
    titleColor: '#0B1E24',
    bodyColor: '#596E78'
  }
};

const SettingsInfoCard = ({ icon, title, body, tone = 'neutral', testID }) => {
  const palette = INFO_STYLES[tone] || INFO_STYLES.neutral;

  return (
    <View
      style={[styles.card, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}
      testID={testID}
    >
      <View style={styles.iconWrap}>
        <Ionicons color={palette.iconColor} name={icon} size={18} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: palette.titleColor }]}>{title}</Text>
        <Text style={[styles.body, { color: palette.bodyColor }]}>{body}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 18
  },
  iconWrap: {
    marginTop: 2
  },
  copy: {
    flex: 1,
    gap: 6
  },
  title: {
    fontSize: 17,
    fontWeight: '800'
  },
  body: {
    fontSize: 14,
    lineHeight: 21
  }
});

export default SettingsInfoCard;
