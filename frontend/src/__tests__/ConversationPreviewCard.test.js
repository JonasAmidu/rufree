import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ConversationPreviewCard, {
  formatPresenceLabel
} from '../components/messages/ConversationPreviewCard';

describe('ConversationPreviewCard', () => {
  const thread = {
    id: 'coffee-maya',
    name: 'Maya',
    activity: 'Coffee Hangout',
    availableNow: true,
    distanceLabel: '0.8 km',
    lastActiveLabel: '2m ago',
    lastMessage: 'I can be there in 15.',
    unreadCount: 2
  };

  it('formats active presence for real-time conversations', () => {
    expect(formatPresenceLabel(thread)).toBe('Available now');
    expect(formatPresenceLabel({ availableNow: false, nextWindow: 'Tonight at 7:30' })).toBe(
      'Tonight at 7:30'
    );
  });

  it('renders conversation context and opens the thread callback', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = render(
      <ConversationPreviewCard onPress={onPress} thread={thread} />
    );

    expect(getByText('Maya')).toBeTruthy();
    expect(getByText('Coffee Hangout')).toBeTruthy();
    expect(getByText('Available now')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();

    fireEvent.press(getByTestId('message-thread-coffee-maya'));
    expect(onPress).toHaveBeenCalledWith(thread);
  });
});
