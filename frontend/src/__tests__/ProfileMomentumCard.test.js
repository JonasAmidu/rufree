import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileMomentumCard from '../components/profile/ProfileMomentumCard';

describe('ProfileMomentumCard', () => {
  it('shows joined momentum when there are active plans in motion', () => {
    const { getByText } = render(
      <ProfileMomentumCard
        profileReady
        completionPercent={100}
        joinedCount={3}
        hostedCount={1}
        nearbyCount={8}
      />
    );

    expect(getByText('You are ready to meet people right now')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
    expect(getByText('You already have 3 live plans in motion.')).toBeTruthy();
  });

  it('falls back to nearby-match encouragement when there is no current momentum yet', () => {
    const { getByText } = render(
      <ProfileMomentumCard
        profileReady={false}
        completionPercent={40}
        joinedCount={0}
        hostedCount={0}
        nearbyCount={5}
      />
    );

    expect(getByText('Finish your real-time identity')).toBeTruthy();
    expect(getByText('5 people nearby could match with you once you jump into an activity.')).toBeTruthy();
  });
});
