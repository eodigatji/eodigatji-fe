import apiClient from '../../../shared/api/client'

export type CommentDto = {
  commentId: number
  userId: number
  content: string
  createdAt: string
}

export type CreateCommentRequest = {
  userId: number
  content: string
}

export async function getComments(postId: number) {
  const { data } = await apiClient.get<CommentDto[]>(
    `/v1/posts/${postId}/comments`,
  )
  return data
}

export async function createComment(
  postId: number,
  payload: CreateCommentRequest,
) {
  await apiClient.post(`/v1/posts/${postId}/comments`, payload)
}

export async function deleteComment(postId: number, commentId: number) {
  await apiClient.delete(`/v1/posts/${postId}/comments/${commentId}`)
}
