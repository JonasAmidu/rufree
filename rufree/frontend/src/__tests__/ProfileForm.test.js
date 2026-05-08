import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ProfileForm from '../components/profile/ProfileForm';

describe('ProfileForm', () => {
  it('shows validation feedback when required fields are missing', async () => {
    const onSave = jest.fn();
    const { getByTestId, findByText } = render(<ProfileForm initialValues={{}} onSave={onSave} />);

    fireEvent.press(getByTestId('profile-save-button'));

    expect(await findByText('Add a display name so people know who is free.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits trimmed values after selecting activities', async () => {
    const onSave = jest.fn().mockResolvedValue();
    const { getByTestId } = render(
      <ProfileForm
        initialValues={{
          displayName: ' Maya ',
          bio: ' Love quick plans ',
          photoUrl: ' https://example.com/maya.jpg '
        }}
        onSave={onSave}
      />
    );

    fireEvent.press(getByTestId('profile-activity-Coffee Chats'));
    fireEvent.press(getByTestId('profile-save-button'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        displayName: 'Maya',
        bio: 'Love quick plans',
        photoUrl: 'https://example.com/maya.jpg',
        favoriteActivities: ['Coffee Chats']
      });
    });
  });
});
