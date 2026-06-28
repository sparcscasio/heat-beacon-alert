import type { LatLng, Shelter } from "../types";

export function getDistanceMeters(a: LatLng, b: LatLng): number {
  const r = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * r * Math.asin(Math.sqrt(h));
}

export function findNearestShelter(
  currentLocation: LatLng,
  shelters: Shelter[]
): { shelter: Shelter; distanceMeters: number } | null {
  if (shelters.length === 0) return null;

  let nearest = shelters[0];
  let nearestDistance = getDistanceMeters(currentLocation, {
    lat: nearest.lat,
    lng: nearest.lng,
  });

  for (const shelter of shelters.slice(1)) {
    const distance = getDistanceMeters(currentLocation, {
      lat: shelter.lat,
      lng: shelter.lng,
    });

    if (distance < nearestDistance) {
      nearest = shelter;
      nearestDistance = distance;
    }
  }

  return {
    shelter: nearest,
    distanceMeters: nearestDistance,
  };
}