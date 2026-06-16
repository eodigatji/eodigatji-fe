import { BellOff, RefreshCw, ShieldCheck, Wifi, WifiOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NotificationCard from '../features/notifications/components/NotificationCard'
import { useAuthStore } from '../features/auth/store/authStore'
import { useNotificationStore } from '../features/notifications/store/notificationStore'
import type {
  NotificationConnectionStatus,
  NotificationItem,
} from '../features/notifications/types'
import SectionPanel from '../shared/components/ui/SectionPanel'

function getConnectionLabel(status: NotificationConnectionStatus) {
  switch (status) {
    case 'connected':
      return '실시간 연결됨'
    case 'connecting':
      return '실시간 연결 중'
    case 'disconnected':
      return '재연결 대기 중'
    default:
      return '대기 중'
  }
}

function NotificationsPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const connectionStatus = useNotificationStore(
    (state) => state.connectionStatus,
  )
  const errorMessage = useNotificationStore((state) => state.errorMessage)
  const isLoading = useNotificationStore((state) => state.isLoading)
  const notifications = useNotificationStore((state) => state.items)
  const loadNotifications = useNotificationStore((state) => state.loadNotifications)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const setErrorMessage = useNotificationStore((state) => state.setErrorMessage)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pendingNotificationId, setPendingNotificationId] = useState<
    number | null
  >(null)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  )

  async function handleRefresh() {
    setIsRefreshing(true)
    setErrorMessage(null)

    try {
      await loadNotifications()
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleMarkAsRead(notificationId: number) {
    setPendingNotificationId(notificationId)

    try {
      await markAsRead(notificationId)
    } finally {
      setPendingNotificationId((currentValue) =>
        currentValue === notificationId ? null : currentValue,
      )
    }
  }

  async function handleOpenNotification(notification: NotificationItem) {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.notificationId)
    }

    navigate(`/posts/${notification.postId}`)
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <SectionPanel>
          <div className="flex items-start gap-4">
            <span className="rounded-full bg-(--surface-soft) p-3">
              <ShieldCheck className="h-5 w-5 text-(--accent-strong)" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">알림</h1>
              <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                댓글 알림은 로그인한 뒤 바로 확인할 수 있어요.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/auth/login"
                  className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)]"
                >
                  로그인하기
                </Link>
                <Link
                  to="/posts"
                  className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
                >
                  게시글 보러가기
                </Link>
              </div>
            </div>
          </div>
        </SectionPanel>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionPanel>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">알림</h1>
            <p className="mt-1 text-sm text-(--text-muted)">
              내 게시글에 달린 댓글 알림을 최신 순서로 확인할 수 있어요.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-(--surface-soft) px-3 py-2 text-sm font-semibold text-(--text-muted)">
              전체 {notifications.length}개
            </span>
            <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-semibold text-(--accent-strong)">
              안 읽음 {unreadCount}개
            </span>
            <span
              className={[
                'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold',
                connectionStatus === 'connected'
                  ? 'bg-[color:var(--found-soft)] text-[color:var(--found-strong)]'
                  : 'bg-(--surface-soft) text-(--text-muted)',
              ].join(' ')}
            >
              {connectionStatus === 'connected' ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              {getConnectionLabel(connectionStatus)}
            </span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-full border border-(--border-subtle) bg-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              <RefreshCw
                className={[
                  'h-4 w-4',
                  isRefreshing ? 'animate-spin' : '',
                ].join(' ')}
              />
              새로고침
            </button>
          </div>
        </div>
      </SectionPanel>

      {errorMessage ? (
        <SectionPanel>
          <p className="text-sm leading-6 text-[color:var(--danger-strong)]">
            {errorMessage}
          </p>
        </SectionPanel>
      ) : null}

      <SectionPanel>
        {isLoading && !notifications.length ? (
          <p className="text-sm text-(--text-muted)">
            알림 목록을 불러오는 중이에요...
          </p>
        ) : notifications.length ? (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.notificationId}
                isPending={pendingNotificationId === notification.notificationId}
                notification={notification}
                onMarkAsRead={(notificationId) =>
                  void handleMarkAsRead(notificationId)
                }
                onOpen={(nextNotification) =>
                  void handleOpenNotification(nextNotification)
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <span className="rounded-full bg-(--surface-soft) p-3">
              <BellOff className="h-5 w-5 text-(--text-muted)" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">아직 알림이 없어요</h2>
              <p className="mt-2 text-sm leading-6 text-(--text-muted)">
                다른 사용자가 내 게시글에 댓글을 남기면 여기에 바로 쌓여요.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/posts"
                  className="rounded-full bg-(--accent-strong) px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)]"
                >
                  게시글 둘러보기
                </Link>
                <Link
                  to="/mypage"
                  className="rounded-full border border-(--border-subtle) bg-white px-4 py-2 text-sm font-semibold"
                >
                  내 정보 보기
                </Link>
              </div>
            </div>
          </div>
        )}
      </SectionPanel>
    </div>
  )
}

export default NotificationsPage
