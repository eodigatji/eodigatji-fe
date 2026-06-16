import { ExternalLink, MessageSquareMore } from 'lucide-react'
import type { NotificationItem } from '../types'

type NotificationCardProps = {
  isPending?: boolean
  notification: NotificationItem
  onMarkAsRead?: (notificationId: number) => void
  onOpen?: (notification: NotificationItem) => void
  variant?: 'compact' | 'full'
}

function formatNotificationTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const elapsedMs = Date.now() - date.getTime()
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60))

  if (elapsedMinutes < 1) {
    return '방금 전'
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}분 전`
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60)

  if (elapsedHours < 24) {
    return `${elapsedHours}시간 전`
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function NotificationCard({
  isPending = false,
  notification,
  onMarkAsRead,
  onOpen,
  variant = 'full',
}: NotificationCardProps) {
  const title = `${notification.commenterNickname}님이 댓글을 남겼어요`

  return (
    <article
      className={[
        'rounded-[var(--radius-card)] border p-4 transition',
        notification.isRead
          ? 'border-(--border-subtle) bg-[color:var(--surface-card)]'
          : 'border-[color:var(--border-accent)] bg-[color:var(--accent-soft)]/40',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={[
              'mt-0.5 rounded-full p-2.5',
              notification.isRead
                ? 'bg-(--surface-soft)'
                : 'bg-[color:var(--accent-soft)]',
            ].join(' ')}
          >
            <MessageSquareMore
              className={[
                'h-4 w-4',
                notification.isRead
                  ? 'text-(--text-muted)'
                  : 'text-(--accent-strong)',
              ].join(' ')}
            />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{title}</p>
              {!notification.isRead ? (
                <span className="rounded-full bg-(--accent-strong) px-2 py-0.5 text-[11px] font-semibold text-white">
                  NEW
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-(--text-muted)">
              게시글 #{notification.postId}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs text-(--text-muted)">
          {formatNotificationTime(notification.createdAt)}
        </span>
      </div>

      <p className="mt-3 rounded-[16px] bg-white/80 px-3 py-3 text-sm leading-6 text-(--text-muted)">
        {notification.commentContent}
      </p>

      {variant === 'full' ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpen?.(notification)}
            className="inline-flex items-center gap-2 rounded-full bg-(--accent-strong) px-3.5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)]"
          >
            게시글 보기
            <ExternalLink className="h-4 w-4" />
          </button>
          {!notification.isRead ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onMarkAsRead?.(notification.notificationId)}
              className="rounded-full border border-(--border-subtle) bg-white px-3.5 py-2 text-sm font-semibold text-(--text-muted) disabled:opacity-60"
            >
              {isPending ? '처리 중...' : '읽음 처리'}
            </button>
          ) : (
            <span className="inline-flex items-center rounded-full bg-(--surface-soft) px-3.5 py-2 text-sm font-semibold text-(--text-muted)">
              읽음 완료
            </span>
          )}
        </div>
      ) : null}
    </article>
  )
}

export default NotificationCard
