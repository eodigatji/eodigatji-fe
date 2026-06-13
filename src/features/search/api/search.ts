import apiClient from '../../../shared/api/client'

export type SearchResultDto = {
  postId: number
  locationId: number
  title: string
  description: string
  type: string
  category: string
}

export async function searchPostsByKeyword(keyword: string) {
  const { data } = await apiClient.get<SearchResultDto[]>('/v1/posts/search', {
    params: { keyword },
  })
  return data
}

export async function searchPostsByCategory(category: string) {
  const { data } = await apiClient.get<SearchResultDto[]>(
    `/v1/posts/categories/${category}`,
  )
  return data
}

export async function searchPostsByDate(date: string) {
  const { data } = await apiClient.get<SearchResultDto[]>(
    '/v1/posts/search/date',
    {
      params: { date },
    },
  )
  return data
}

export async function searchPostsByPlace(place: string) {
  const { data } = await apiClient.get<SearchResultDto[]>(
    '/v1/posts/search/place',
    {
      params: { place },
    },
  )
  return data
}
