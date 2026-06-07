export const ACTIVITY_OPTIONS = [
  'Coffee Chats',
  'Running',
  'Gym Sessions',
  'Hiking',
  'Study Sessions',
  'Brunch',
  'Live Music',
  'Tennis',
  'Football',
  'Board Games',
  'Cinema',
  'Dog Walks',
  'Co-working'
];

export const isProfileComplete = (profile) => {
  if (!profile) {
    return false;
  }

  const hasDisplayName =
    typeof profile.displayName === 'string' && profile.displayName.trim().length > 0;
  const hasActivities = Array.isArray(profile.favoriteActivities) && profile.favoriteActivities.length > 0;

  return hasDisplayName && hasActivities;
};
