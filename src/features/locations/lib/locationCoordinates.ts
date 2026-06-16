export type Coordinates = {
  latitude: number
  longitude: number
}

export type LocationProximityTier = 'within-50m' | 'within-100m' | 'default'

export type CoordinateSource = {
  latitude: number | null | undefined
  longitude: number | null | undefined
}

export const DEFAULT_MAP_CENTER: Coordinates = {
  latitude: 37.2757,
  longitude: 127.1325,
}

export function hasLocationCoordinates(
  value: CoordinateSource,
): value is Coordinates {
  return typeof value.latitude === 'number' && typeof value.longitude === 'number'
}

export function formatCoordinateValue(value: number | null | undefined) {
  return typeof value === 'number' ? value.toFixed(6) : '미등록'
}

export function createNaverMapLink(name: string, coordinates: Coordinates) {
  return `https://map.naver.com/p/search/${encodeURIComponent(name)}?c=${coordinates.longitude},${coordinates.latitude},15,0,0,0,dh`
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

export function calculateHaversineDistanceMeters(
  origin: Coordinates,
  destination: Coordinates,
) {
  const earthRadiusMeters = 6_371_000
  const latitudeDelta = toRadians(destination.latitude - origin.latitude)
  const longitudeDelta = toRadians(destination.longitude - origin.longitude)
  const originLatitude = toRadians(origin.latitude)
  const destinationLatitude = toRadians(destination.latitude)

  const haversineValue =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2)

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))

  return earthRadiusMeters * angularDistance
}

export function getLocationProximityTier(
  distanceMeters: number,
): LocationProximityTier {
  if (distanceMeters <= 50) {
    return 'within-50m'
  }

  if (distanceMeters <= 100) {
    return 'within-100m'
  }

  return 'default'
}
