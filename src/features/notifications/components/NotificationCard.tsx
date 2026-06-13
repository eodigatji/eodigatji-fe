import type { NotificationItem } from '../../../app/data/prototype'

type NotificationCardProps = {
  notification: NotificationItem
  variant?: 'compact' | 'full'
}

function NotificationCard({
  notification,
  variant = 'full',
}: NotificationCardProps) {
  return (
    <article
      className={[
        'rounded-(--radius-card) border p-4',
        variant === 'full'
          ? notification.unread
            ? 'border-(--border-accent) bg-(--accent-soft)/40'
            : 'border-(--border-subtle) bg-(--surface-card)'
          : 'border-(--border-subtle) bg-(--surface-card)',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{notification.title}</p>
        <div className="flex items-center gap-2">
          {variant === 'full' && notification.unread ? (
            <span className="rounded-full bg-(--accent-strong) px-2 py-0.5 text-xs font-semibold text-white">
              NEW
            </span>
          ) : null}
          <span className="text-xs text-(--text-muted)">
            {notification.time}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-(--text-muted)">
        {notification.body}
      </p>
    </article>
  )
}

export default NotificationCard
