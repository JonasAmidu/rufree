export const ACTIVITY_OPTIONS = [
  'Coffee Chats',
  'Running',
  'Gym Sessions',
  'Hiking',
  'Study Sessions',
  'Brunch',
  'Live Music',
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

  const hasBio = typeof profile.bio === 'string' && profile.bio.trim().length > 0;
  const hasPhoto = typeof profile.photoUrl === 'string' && profile.photoUrl.trim().length > 0;
  const hasActivities = Array.isArray(profile.favoriteActivities) && profile.favoriteActivities.length > 0;

  return hasBio && hasPhoto && hasActivities;
};
