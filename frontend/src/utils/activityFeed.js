import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from '@firebase/firestore';

export const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const calculateDistanceKm = (pointA, pointB) => {
  if (!pointA || !pointB) {
    return null;
  }

  const hasCoords =
    typeof pointA.latitude === 'number' &&
    typeof pointA.longitude === 'number' &&
    typeof pointB.latitude === 'number' &&
    typeof pointB.longitude === 'number';

  if (!hasCoords) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = ((pointB.latitude - pointA.latitude) * Math.PI) / 180;
  const dLon = ((pointB.longitude - pointA.longitude) * Math.PI) / 180;
  const lat1 = (pointA.latitude * Math.PI) / 180;
  const lat2 = (pointB.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const buildSearchText = (activity) =>
  [
    activity.activity,
    activity.location?.name,
    activity.creatorName,
    ...(activity.tags || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const collectInterestMatches = (activity, favoriteActivities = []) => {
  const haystack = buildSearchText(activity);

  return favoriteActivities.filter((interest) => {
    const normalized = interest.toLowerCase();
    if (haystack.includes(normalized)) {
      return true;
    }

    return normalized
      .split(/\s+/)
      .filter((token) => token.length >= 4)
      .some((token) => haystack.includes(token));
  });
};

const findActivityDistance = (activity, currentLocation, nearbyUsersById) => {
  const activityLocation =
    typeof activity.location?.latitude === 'number' &&
    typeof activity.location?.longitude === 'number'
      ? activity.location
      : nearbyUsersById[activity.creatorId]?.location;

  return calculateDistanceKm(currentLocation, activityLocation);
};

export const enrichActivities = (
  activities,
  { currentLocation = null, favoriteActivities = [], nearbyUsersById = {} } = {}
) =>
  activities.map((activity) => {
    const likedBy = Array.isArray(activity.likedBy)
      ? activity.likedBy
      : Array.isArray(activity.likes)
        ? activity.likes
        : [];
    const interestedUsers = Array.isArray(activity.interestedUsers)
      ? activity.interestedUsers
      : Array.isArray(activity.joinedUsers)
        ? activity.joinedUsers
        : [];

    const startTime = toDate(activity.startTime);
    const availableUntil = toDate(activity.availableUntil);
    const now = new Date();
    const distanceKm = findActivityDistance(activity, currentLocation, nearbyUsersById);
    const interestMatches = collectInterestMatches(activity, favoriteActivities);
    const hoursUntilStart = startTime
      ? (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      : null;

    return {
      ...activity,
      likedBy,
      interestedUsers,
      likesCount:
        typeof activity.likesCount === 'number' ? activity.likesCount : likedBy.length,
      interestedCount:
        typeof activity.interestedCount === 'number'
          ? activity.interestedCount
          : interestedUsers.length,
      startTime,
      distanceKm,
      distanceLabel:
        typeof distanceKm === 'number' ? `${distanceKm.toFixed(1)} km away` : 'Near your area',
      interestMatches,
      availableUntil,
      availableNow:
        (activity.isUrgent && (!availableUntil || availableUntil.getTime() > now.getTime())) ||
        (typeof hoursUntilStart === 'number' && hoursUntilStart >= -2 && hoursUntilStart <= 6)
    };
  });

export const filterActivities = (
  activities,
  { radiusKm = 10, searchText = '', onlyMatching = false, onlyAvailableNow = true } = {}
) => {
  const normalizedSearch = searchText.trim().toLowerCase();

  return activities.filter((activity) => {
    const withinRadius =
      typeof activity.distanceKm !== 'number' || activity.distanceKm <= radiusKm;
    const matchesSearch =
      !normalizedSearch || buildSearchText(activity).includes(normalizedSearch);
    const matchesInterest = !onlyMatching || activity.interestMatches.length > 0;
    const matchesAvailability = !onlyAvailableNow || activity.availableNow;

    return withinRadius && matchesSearch && matchesInterest && matchesAvailability;
  });
};

export const fetchActivities = async (db) => {
  const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const postsSnapshot = await getDocs(postsQuery);

  return postsSnapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
};

export const subscribeToActivities = (db, onUpdate, onError) => {
  const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    postsQuery,
    (postsSnapshot) => {
      const activities = postsSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }));

      onUpdate(activities);
    },
    onError
  );
};

export const joinActivity = async (db, postId, userId) => {
  const postRef = doc(db, 'posts', postId);

  await updateDoc(postRef, {
    interestedUsers: arrayUnion(userId),
    interestedCount: increment(1)
  });
};

export const leaveActivity = async (db, postId, userId) => {
  const postRef = doc(db, 'posts', postId);

  await updateDoc(postRef, {
    interestedUsers: arrayRemove(userId),
    interestedCount: increment(-1)
  });
};

export const likeActivity = async (db, postId, userId) => {
  const postRef = doc(db, 'posts', postId);

  await updateDoc(postRef, {
    likedBy: arrayUnion(userId),
    likesCount: increment(1)
  });
};

export const unlikeActivity = async (db, postId, userId) => {
  const postRef = doc(db, 'posts', postId);

  await updateDoc(postRef, {
    likedBy: arrayRemove(userId),
    likesCount: increment(-1)
  });
};

export const createActivity = async (db, activityData) => {
  const postsRef = collection(db, 'posts');
  const docRef = await addDoc(postsRef, {
    ...activityData,
    startTime: normalizePostDate(activityData.startTime),
    availableUntil: toDate(activityData.availableUntil),
    likedBy: [],
    likesCount: 0,
    interestedUsers: [],
    interestedCount: 0
  });

  return docRef.id;
};

const normalizePostDate = (value, fallback = new Date()) => toDate(value) || fallback;
