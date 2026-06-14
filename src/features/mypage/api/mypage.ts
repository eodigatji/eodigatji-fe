import apiClient from '../../../shared/api/client'

export type MyPageProfileDto = {
  email: string
  nickname: string
  studentNumber: string
  temperature: number
}

export type MyPageCommentDto = {
  commentId: number
  content: string
}

export type MyPageTemperatureDto = {
  temperature: number
}

export type MyPagePostDto = {
  postId: number
  title: string
}

export async function getMyPageProfile() {
  const { data } = await apiClient.get<MyPageProfileDto>('/v1/mypage')
  return data
}

export async function getMyPageComments() {
  const { data } = await apiClient.get<MyPageCommentDto[]>('/v1/mypage/comments')
  return data
}

export async function getMyPageTemperature() {
  const { data } = await apiClient.get<MyPageTemperatureDto>('/v1/mypage/temperature')
  return data
}

export async function getMyPagePosts() {
  const { data } = await apiClient.get<MyPagePostDto[]>('/v1/mypage/posts')
  return data
}
