import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

const backgroundImage = require('../../assets/modern-app-background.png');

const AppBackground = ({ children, style }) => (
  <ImageBackground source={backgroundImage} resizeMode="cover" style={[styles.background, style]}>
    <View style={styles.scrim}>{children}</View>
  </ImageBackground>
);

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(255, 248, 238, 0.58)'
  }
});

export default AppBackground;
