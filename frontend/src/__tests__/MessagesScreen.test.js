import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import MessagesScreen, {
  buildThreadsFromConversations,
  buildThreadsFromActivities,
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

    expect(getByText('Your plans')).toBeTruthy();
    expect(getByText('Maya')).toBeTruthy();
    expect(getByText('Chats start from real plans.')).toBeTruthy();

    fireEvent.press(getByTestId('message-thread-coffee-maya'));
    expect(onOpenThread).toHaveBeenCalledWith(DEFAULT_MESSAGE_THREADS[0]);
  });

  it('builds message threads from joined and hosted activities', () => {
    const threads = buildThreadsFromActivities(
      [
        {
          id: 'post-hosted',
          activity: 'Coffee Chats',
          creatorId: 'user-1',
          creatorName: 'Host User',
          interestedUsers: ['user-2'],
          isUrgent: true
        },
        {
          id: 'post-joined',
          activity: 'Tennis',
          creatorId: 'user-3',
          creatorName: 'Maya',
          interestedUsers: ['user-1']
        },
        {
          id: 'post-unrelated',
          activity: 'Cinema',
          creatorId: 'user-4',
          interestedUsers: []
        }
      ],
      { uid: 'user-1' }
    );

    expect(threads).toHaveLength(2);
    expect(threads[0]).toMatchObject({
      id: 'post-hosted',
      activity: 'Coffee Chats',
      availableNow: true
    });
    expect(threads[1]).toMatchObject({
      id: 'post-joined',
      name: 'Maya',
      activity: 'Tennis'
    });
  });

  it('builds message threads from persisted conversations', () => {
    const threads = buildThreadsFromConversations(
      [
        {
          id: 'conversation-1',
          activity: 'Coffee Chats',
          participantNames: {
            'user-1': 'Host User',
            'user-2': 'Maya'
          },
          lastMessage: 'See you at 6.',
          lastMessageAt: new Date('2026-06-12T18:00:00.000Z')
        }
      ],
      { uid: 'user-1' }
    );

    expect(threads).toEqual([
      expect.objectContaining({
        id: 'conversation-1',
        name: 'Maya',
        activity: 'Coffee Chats',
        lastMessage: 'See you at 6.'
      })
    ]);
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
