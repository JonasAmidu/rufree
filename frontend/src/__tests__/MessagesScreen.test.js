import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import MessagesScreen, {
  buildMessageMetrics,
  DEFAULT_MESSAGE_THREADS
} from '../screens/MessagesScreen';

describe('MessagesScreen', () => {
  it('summarises thread metrics for the hero card', () => {
    expect(buildMessageMetrics(DEFAULT_MESSAGE_THREADS)).toEqual({
      unreadCount: 3,
      availableNowCount: 2,
      activityMatches: 3
    });
  });

  it('renders conversation previews for active threads', () => {
    const onOpenThread = jest.fn();
    const { getByText, getByTestId } = render(
      <MessagesScreen onOpenThread={onOpenThread} threads={DEFAULT_MESSAGE_THREADS} />
    );

    expect(getByText('Your live circles')).toBeTruthy();
    expect(getByText('Maya')).toBeTruthy();
    expect(getByText('Keep the momentum going once people say yes.')).toBeTruthy();

    fireEvent.press(getByTestId('message-thread-coffee-maya'));
    expect(onOpenThread).toHaveBeenCalledWith(DEFAULT_MESSAGE_THREADS[0]);
  });

  it('shows an empty state when no threads exist', () => {
    const onFindPeople = jest.fn();
    const { getByTestId, getByText } = render(
      <MessagesScreen onFindPeople={onFindPeople} threads={[]} />
    );

    expect(getByTestId('messages-empty-state')).toBeTruthy();
    fireEvent.press(getByText('Find people available now'));
    expect(onFindPeople).toHaveBeenCalledTimes(1);
  });
});
