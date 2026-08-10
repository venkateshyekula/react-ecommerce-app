export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export const fallbackLocations = {
  guntur: {
    latitude: 16.3067,
    longitude: 80.4365
  },
  sattenapalli: {
    latitude: 16.3962,
    longitude: 80.1497
  },
  bengaluru: {
    latitude: 12.9716,
    longitude: 77.5946
  },
  hyderabad: {
    latitude: 17.385,
    longitude: 78.4867
  }
} satisfies Record<string, MapCoordinates>;

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

export const isValidLatitude = (
  latitude: unknown
): latitude is number => {
  return (
    isFiniteNumber(latitude) &&
    latitude >= -90 &&
    latitude <= 90
  );
};

export const isValidLongitude = (
  longitude: unknown
): longitude is number => {
  return (
    isFiniteNumber(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
};

export const hasValidCoordinates = (
  latitude?: number,
  longitude?: number
): boolean => {
  return (
    isValidLatitude(latitude) &&
    isValidLongitude(longitude)
  );
};

export const resolveCoordinates = (
  latitude?: number,
  longitude?: number,
  addressQuery?: string
): string => {
  if (
    isValidLatitude(latitude) &&
    isValidLongitude(longitude)
  ) {
    const coordinateQuery = encodeURIComponent(
      `${latitude},${longitude}`
    );

    return `https://www.google.com/maps/search/?api=1&query=${coordinateQuery}`;
  }

  const normalizedAddress = addressQuery?.trim();

  if (normalizedAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      normalizedAddress
    )}`;
  }

  return "https://www.google.com/maps";
}