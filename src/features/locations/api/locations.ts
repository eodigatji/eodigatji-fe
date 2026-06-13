import apiClient from '../../../shared/api/client'

export type LocationDto = {
  id: number
  name: string
  detail: string
  number: string
  latitude: number | null
  longitude: number | null
  createdAt: string
}

export type LocationCreateRequest = {
  name: string
  detail: string
  number: string
  latitude?: number
  longitude?: number
}

export type LocationPatchRequest = Partial<LocationCreateRequest>

export async function getLocations() {
  const { data } = await apiClient.get<LocationDto[]>('/v1/locations')
  return data
}

export async function getLocation(id: number) {
  const { data } = await apiClient.get<LocationDto>(`/v1/locations/${id}`)
  return data
}

export async function createLocation(payload: LocationCreateRequest) {
  const { data } = await apiClient.post<LocationDto>('/v1/locations', payload)
  return data
}

export async function updateLocation(id: number, payload: LocationPatchRequest) {
  const { data } = await apiClient.patch<LocationDto>(
    `/v1/locations/${id}`,
    payload,
  )
  return data
}

export async function deleteLocation(id: number) {
  await apiClient.delete(`/v1/locations/${id}`)
}
