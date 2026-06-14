import apiClient from '../../../shared/api/client'
import type { PostStatus } from '../types'

export type PostListItemDto = {
  id: number
  title: string
  type: PostStatus
  thumbnailImageUrl: string | null
  createdAt: string
}

export type PostDetailDto = {
  id: number
  title: string
  description: string
  type: PostStatus
  category: string
  locationId: number
  userId: number
  imageUrls: string[]
  createdAt: string
}

type GetPostsParams = {
  page?: number
  size?: number
  sort?: string
}

export type PostPageDto = {
  content: PostListItemDto[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export type PostCreateRequest = {
  title: string
  description: string
  type: PostStatus
  category: string
  locationId: number
}

export async function getPosts(params: GetPostsParams = {}) {
  const { data } = await apiClient.get<PostPageDto>('/v1/posts', { params })
  return data
}

export async function getPost(postId: number) {
  const { data } = await apiClient.get<PostDetailDto>(`/v1/posts/${postId}`)
  return data
}

export async function createPost(
  payload: PostCreateRequest,
  images: File[] = [],
) {
  const formData = new FormData()
  formData.append(
    'request',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }),
  )

  for (const image of images) {
    formData.append('images', image)
  }

  const { data } = await apiClient.post<number>('/v1/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return data
}
