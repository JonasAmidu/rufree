const PUBLIC_LOCATION_DECIMALS = 3;

const roundCoordinate = (value) => {
  if (typeof value !== 'number') {
    return null;
  }

  const factor = 10 ** PUBLIC_LOCATION_DECIMALS;
  return Math.round(value * factor) / factor;
};

export const toPublicLocation = (location) => {
  if (
    !location ||
    typeof location.latitude !== 'number' ||
    typeof location.longitude !== 'number'
  ) {
    return null;
  }

  return {
    latitude: roundCoordinate(location.latitude),
    longitude: roundCoordinate(location.longitude)
  };
};
