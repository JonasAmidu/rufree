import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProminentTabIcon = ({
  accessibilityLabel = 'Add activity',
  color = '#17D6C5',
  focused = false,
  iconName = 'add',
  label = 'Add Activity'
}) => {
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={styles.wrapper}
      testID="prominent-tab-icon"
    >
      <View
        style={[
          styles.orb,
          focused ? styles.orbFocused : styles.orbBlurred,
          { borderColor: color }
        ]}
      >
        <View style={[styles.innerOrb, focused ? styles.innerOrbFocused : null]}>
          <Ionicons color="#08161D" name={iconName} size={28} />
        </View>
      </View>
      <Text style={[styles.label, focused ? styles.labelFocused : null]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    minWidth: 108
  },
  orb: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 3,
    elevation: 6,
    justifyContent: 'center',
    padding: 4,
    shadowColor: '#17D6C5',
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowOpacity: 0.28,
    shadowRadius: 16
  },
  orbBlurred: {
    backgroundColor: 'rgba(23, 214, 197, 0.2)'
  },
  orbFocused: {
    backgroundColor: 'rgba(23, 214, 197, 0.35)'
  },
  innerOrb: {
    alignItems: 'center',
    backgroundColor: '#8CF6E4',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  innerOrbFocused: {
    backgroundColor: '#B4FFF2'
  },
  label: {
    color: '#9AB1BB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: 6
  },
  labelFocused: {
    color: '#F4FFFD'
  }
});

export default ProminentTabIcon;
