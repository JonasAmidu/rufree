import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ProfileScreen from '../screens/ProfileScreen';

describe('ProfileScreen', () => {
  it('summarizes live profile stats and exposes the edit action', () => {
    const onEditProfile = jest.fn();
    const onSignOut = jest.fn();
    const activities = [
      {
        id: 'hosted-1',
        creatorId: 'user-1',
        interestedUsers: ['user-2', 'user-1'],
        likedBy: ['user-3'],
        startTime: new Date(Date.now() + 60 * 60 * 1000)
      },
      {
        id: 'joined-1',
        creatorId: 'user-9',
        interestedUsers: ['user-1'],
        likedBy: ['user-1']
      }
    ];

    const { getAllByText, getByText, getByTestId } = render(
      <ProfileScreen
        user={{ uid: 'user-1', email: 'alex@example.com' }}
        userProfile={{
          displayName: 'Alex',
          bio: 'Coffee, walks, and tennis when the timing works.',
          photoUrl: 'https://example.com/alex.jpg',
          favoriteActivities: ['Coffee Chats', 'Tennis'],
          location: { latitude: 51.5, longitude: -0.1 }
        }}
        activities={activities}
        nearbyCount={6}
        onEditProfile={onEditProfile}
        onSignOut={onSignOut}
      />
    );

    expect(getByText('Profile')).toBeTruthy();
    expect(getAllByText('Alex').length).toBeGreaterThan(0);
    expect(getByText('Activities hosted')).toBeTruthy();
    expect(getByText('Joined in real time')).toBeTruthy();
    expect(getByText('Nearby people now')).toBeTruthy();
    expect(getByText('Saved reactions')).toBeTruthy();
    expect(getAllByText('6').length).toBeGreaterThan(0);
    expect(getByText('Location ready')).toBeTruthy();

    fireEvent.press(getByTestId('profile-edit-cta'));
    expect(onEditProfile).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('profile-sign-out-button'));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('shows fallback guidance when the profile is still sparse', () => {
    const { getByText } = render(
      <ProfileScreen
        user={{ uid: 'user-2', email: 'sam@example.com' }}
        userProfile={{ favoriteActivities: [] }}
        activities={[]}
        nearbyCount={0}
      />
    );

    expect(getByText('Finish your real-time identity')).toBeTruthy();
    expect(getByText('Add a few favorite activities to unlock better nearby matches.')).toBeTruthy();
    expect(getByText('Needs location')).toBeTruthy();
  });
});
