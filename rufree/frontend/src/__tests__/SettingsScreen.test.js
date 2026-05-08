import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SettingsScreen from '../screens/SettingsScreen';

describe('SettingsScreen', () => {
  it('renders grouped settings rows and updates the info card as rows are selected', () => {
    const callbacks = {
      onHelp: jest.fn(),
      onContactUs: jest.fn(),
      onTerms: jest.fn(),
      onPrivacyPolicy: jest.fn(),
      onResetPassword: jest.fn(),
      onLogout: jest.fn(),
      onAbout: jest.fn()
    };

    const { getAllByText, getByTestId, getByText } = render(<SettingsScreen {...callbacks} />);

    expect(getByText('People-first support')).toBeTruthy();
    expect(getByText('Security and access')).toBeTruthy();
    expect(getByText('Policies and trust')).toBeTruthy();
    expect(getByText('Why RuFree exists')).toBeTruthy();
    expect(getByText('About RuFree')).toBeTruthy();

    fireEvent.press(getByTestId('settings-help'));
    expect(callbacks.onHelp).toHaveBeenCalledTimes(1);
    expect(getByText('Help is close by')).toBeTruthy();

    fireEvent.press(getByTestId('settings-terms'));
    expect(callbacks.onTerms).toHaveBeenCalledTimes(1);
    expect(getAllByText('Terms & Conditions').length).toBeGreaterThan(0);
    expect(getAllByText('Coming soon').length).toBeGreaterThan(0);

    fireEvent.press(getByTestId('settings-reset-password'));
    expect(callbacks.onResetPassword).toHaveBeenCalledTimes(1);
    expect(getByText('Reset password')).toBeTruthy();

    fireEvent.press(getByTestId('settings-logout'));
    expect(callbacks.onLogout).toHaveBeenCalledTimes(1);
  });
});
