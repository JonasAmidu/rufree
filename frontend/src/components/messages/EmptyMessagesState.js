import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EmptyMessagesState = ({ onPrimaryAction }) => (
  <View style={styles.card} testID="messages-empty-state">
    <View style={styles.iconWrap}>
      <Ionicons color="#12C7B1" name="chatbubbles" size={28} />
    </View>
    <Text style={styles.title}>No conversations yet</Text>
    <Text style={styles.body}>
      Messages should start because something real is happening nearby. Join an activity or post one,
      and your chat space will come alive fast.
    </Text>
    <TouchableOpacity onPress={onPrimaryAction} style={styles.button}>
      <Text style={styles.buttonText}>Find people available now</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E2E8',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#E8FBF6',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: 16,
    width: 48
  },
  title: {
    color: '#123247',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10
  },
  body: {
    color: '#5A707B',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#11B9A6',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  }
});

export default EmptyMessagesState;
