import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ActivityComposer, {
  buildStartTime,
  validateActivityValues
} from '../components/activity/ActivityComposer';

describe('ActivityComposer', () => {
  it('validates missing core fields', () => {
    expect(
      validateActivityValues({
        activity: '',
        locationName: '',
        date: '',
        time: '',
        isUrgent: true
      })
    ).toContain('Add an activity');
  });

  it('requires date and time when not urgent', () => {
    expect(
      validateActivityValues({
        activity: 'Coffee Chats',
        locationName: 'Soho Coffee House',
        date: '',
        time: '',
        isUrgent: false
      })
    ).toContain('Pick a date and time');
  });

  it('submits trimmed values and a computed startTime', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<ActivityComposer onSubmit={onSubmit} />);

    fireEvent.changeText(getByTestId('activity-name-input'), ' Coffee Chats ');
    fireEvent.changeText(getByTestId('location-name-input'), ' Soho Coffee House ');
    fireEvent.changeText(getByTestId('activity-date-input'), '2026-05-08');
    fireEvent.changeText(getByTestId('activity-time-input'), '18:30');
    fireEvent(getByTestId('urgent-toggle'), 'valueChange', false);
    fireEvent.press(getByTestId('submit-activity-button'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      activity: 'Coffee Chats',
      locationName: 'Soho Coffee House',
      isUrgent: false
    });
    expect(onSubmit.mock.calls[0][0].startTime).toBeInstanceOf(Date);
  });

  it('lets people use presets and cancel', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(<ActivityComposer onCancel={onCancel} />);

    fireEvent.press(getByTestId('activity-preset-Coffee Chats'));
    fireEvent.press(getByTestId('cancel-activity-button'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('builds an immediate start time for urgent plans', () => {
    expect(
      buildStartTime({
        date: '',
        time: '',
        isUrgent: true
      })
    ).toBeInstanceOf(Date);
  });
});
