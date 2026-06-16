export type NotificationItem = {
  notificationId: number
  commentId: number
  postId: number
  commentContent: string
  commenterNickname: string
  isRead: boolean
  createdAt: string
}

export type NotificationConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
