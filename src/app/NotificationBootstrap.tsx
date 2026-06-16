import { useEffect, useEffectEvent } from 'react'
import { useAuthStore } from '../features/auth/store/authStore'
import { subscribeToCommentNotifications } from '../features/notifications/api/notifications'
import { useNotificationStore } from '../features/notifications/store/notificationStore'
import type { NotificationItem } from '../features/notifications/types'

function NotificationBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const tokenType = useAuthStore((state) => state.tokenType)

  const clearNotifications = useNotificationStore(
    (state) => state.clearNotifications,
  )
  const loadNotifications = useNotificationStore(
    (state) => state.loadNotifications,
  )
  const receiveNotification = useNotificationStore(
    (state) => state.receiveNotification,
  )
  const setConnectionStatus = useNotificationStore(
    (state) => state.setConnectionStatus,
  )
  const setErrorMessage = useNotificationStore((state) => state.setErrorMessage)

  const handleConnected = useEffectEvent(() => {
    setConnectionStatus('connected')
    setErrorMessage(null)
  })

  const handleNotification = useEffectEvent((notification: NotificationItem) => {
    receiveNotification(notification)
    setConnectionStatus('connected')
  })

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !tokenType) {
      clearNotifications()
      return
    }

    let isDisposed = false
    let reconnectTimerId: number | null = null
    let controller: AbortController | null = null

    const connect = async () => {
      if (isDisposed) {
        return
      }

      controller?.abort()
      controller = new AbortController()
      setConnectionStatus('connecting')

      try {
        await subscribeToCommentNotifications({
          onConnect: handleConnected,
          onNotification: handleNotification,
          signal: controller.signal,
          tokens: {
            accessToken,
            tokenType,
          },
        })

        if (isDisposed || controller.signal.aborted) {
          return
        }

        setConnectionStatus('disconnected')
        reconnectTimerId = window.setTimeout(() => {
          void connect()
        }, 3000)
      } catch (error) {
        if (
          isDisposed ||
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return
        }

        setConnectionStatus('disconnected')
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '실시간 알림 연결이 끊어졌어요. 재연결을 시도할게요.',
        )

        reconnectTimerId = window.setTimeout(() => {
          void connect()
        }, 3000)
      }
    }

    void loadNotifications().catch(() => undefined)
    void connect()

    return () => {
      isDisposed = true

      if (reconnectTimerId !== null) {
        window.clearTimeout(reconnectTimerId)
      }

      controller?.abort()
      setConnectionStatus('idle')
    }
  }, [
    accessToken,
    clearNotifications,
    isAuthenticated,
    loadNotifications,
    setConnectionStatus,
    setErrorMessage,
    tokenType,
  ])

  return null
}

export default NotificationBootstrap
