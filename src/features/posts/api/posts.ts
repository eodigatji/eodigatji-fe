import apiClient from '../../../shared/api/client'
import type { PostCategory, PostStatus } from '../types'

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
  category: PostCategory
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
  category: PostCategory
  locationId: number
}

export type PostUpdateRequest = PostCreateRequest

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
  const formData = buildPostFormData(payload, images)

  const { data } = await apiClient.post<number>('/v1/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return data
}

function buildPostFormData(payload: PostCreateRequest, images: File[] = []) {
  const formData = new FormData()
  formData.append(
    'request',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }),
  )

  for (const image of images) {
    formData.append('images', image)
  }

  return formData
}

export async function updatePost(
  postId: number,
  payload: PostUpdateRequest,
  images: File[] = [],
) {
  const formData = buildPostFormData(payload, images)

  await apiClient.patch(`/v1/posts/${postId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export async function deletePost(postId: number) {
  await apiClient.delete(`/v1/posts/${postId}`)
}
