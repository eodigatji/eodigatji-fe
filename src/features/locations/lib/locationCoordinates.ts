export type Coordinates = {
  latitude: number
  longitude: number
}

export type CoordinateSource = {
  latitude: number | null | undefined
  longitude: number | null | undefined
}

export const DEFAULT_MAP_CENTER: Coordinates = {
  latitude: 37.5665,
  longitude: 126.978,
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
