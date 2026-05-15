import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SettingsRow from '../components/profile/SettingsRow';

describe('SettingsRow', () => {
  it('renders the title, description, and fires presses', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = render(
      <SettingsRow
        description="Reach the team directly."
        icon="mail"
        onPress={onPress}
        testID="settings-row"
        title="Contact Us"
      />
    );

    expect(getByText('Contact Us')).toBeTruthy();
    expect(getByText('Reach the team directly.')).toBeTruthy();

    fireEvent.press(getByTestId('settings-row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a coming soon status pill when supplied', () => {
    const { getByText } = render(
      <SettingsRow
        description="Policy text is being shaped."
        icon="shield-checkmark"
        status="Coming soon"
        title="Privacy Policy"
      />
    );

    expect(getByText('Coming soon')).toBeTruthy();
  });
});
