import { create } from 'zustand'
import { getApiErrorMessage } from '../../../shared/utils/getApiErrorMessage'
import {
  getCommentNotifications,
  markCommentNotificationAsRead,
} from '../api/notifications'
import type {
  NotificationConnectionStatus,
  NotificationItem,
} from '../types'

type NotificationState = {
  connectionStatus: NotificationConnectionStatus
  errorMessage: string | null
  isLoading: boolean
  items: NotificationItem[]
  clearNotifications: () => void
  loadNotifications: () => Promise<void>
  markAsRead: (notificationId: number) => Promise<void>
  receiveNotification: (notification: NotificationItem) => void
  setConnectionStatus: (status: NotificationConnectionStatus) => void
  setErrorMessage: (message: string | null) => void
}

function sortNotifications(items: NotificationItem[]) {
  return [...items].sort((left, right) => {
    const timeGap =
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()

    if (timeGap !== 0) {
      return timeGap
    }

    return right.notificationId - left.notificationId
  })
}

function mergeNotifications(...groups: NotificationItem[][]) {
  const byId = new Map<number, NotificationItem>()

  for (const group of groups) {
    for (const notification of group) {
      byId.set(notification.notificationId, notification)
    }
  }

  return sortNotifications([...byId.values()])
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  connectionStatus: 'idle',
  errorMessage: null,
  isLoading: false,
  items: [],
  clearNotifications: () =>
    set({
      connectionStatus: 'idle',
      errorMessage: null,
      isLoading: false,
      items: [],
    }),
  loadNotifications: async () => {
    set({ errorMessage: null, isLoading: true })

    try {
      const notifications = await getCommentNotifications()

      set((state) => ({
        errorMessage: null,
        isLoading: false,
        items: mergeNotifications(notifications, state.items),
      }))
    } catch (error) {
      set({
        errorMessage: getApiErrorMessage(
          error,
          '알림 목록을 불러오지 못했어요.',
        ),
        isLoading: false,
      })

      throw error
    }
  },
  markAsRead: async (notificationId) => {
    const previousItems = get().items
    const target = previousItems.find(
      (notification) => notification.notificationId === notificationId,
    )

    if (!target || target.isRead) {
      return
    }

    const nextItems = previousItems.map((notification) =>
      notification.notificationId === notificationId
        ? { ...notification, isRead: true }
        : notification,
    )

    set({ errorMessage: null, items: nextItems })

    try {
      await markCommentNotificationAsRead(notificationId)
    } catch (error) {
      set({
        errorMessage: getApiErrorMessage(error, '알림 읽음 처리에 실패했어요.'),
        items: previousItems,
      })

      throw error
    }
  },
  receiveNotification: (notification) =>
    set((state) => ({
      errorMessage: null,
      items: mergeNotifications([notification], state.items),
    })),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
}))
