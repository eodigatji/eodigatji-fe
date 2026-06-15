import { Link } from 'react-router-dom'
import StatusBadge from '../../../shared/components/ui/StatusBadge'
import type { PostSummary } from '../types'

type PostCardProps = {
  post: PostSummary
  to?: string
  variant?: 'compact' | 'full'
}

function PostCard({ post, to, variant = 'full' }: PostCardProps) {
  const articleClassName =
    variant === 'compact'
      ? 'rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) p-3.5'
      : 'rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5'

  const content = (
    <article className={articleClassName}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={post.status} />
        <span
          className={[
            'rounded-full px-2.5 py-1 text-[11px] font-medium text-(--text-muted)',
            variant === 'compact' ? 'bg-white' : 'bg-(--surface-soft)',
          ].join(' ')}
        >
          {post.category}
        </span>
      </div>

      <div
        className={[
          'mt-3 flex flex-col gap-3',
          variant === 'compact'
            ? 'md:flex-row md:items-start md:justify-between'
            : 'lg:flex-row lg:items-start lg:justify-between',
        ].join(' ')}
      >
        <div className="min-w-0">
          <h3
            className={
              variant === 'compact' ? 'text-[15px] font-semibold' : 'text-base font-semibold'
            }
          >
            {post.title}
          </h3>
          <p
            className={[
              'mt-2 text-sm leading-5 text-(--text-muted)',
              variant === 'full' ? 'max-w-2xl' : '',
            ].join(' ')}
          >
            {post.description}
          </p>
        </div>

        <div
          className={[
            'grid rounded-[var(--radius-card)] text-(--text-muted)',
            variant === 'compact'
              ? 'min-w-0 gap-1 bg-white p-3 text-[11px]'
              : 'gap-1.5 bg-(--surface-soft) p-3 text-xs lg:min-w-48',
          ].join(' ')}
        >
          <span>{variant === 'full' ? `장소: ${post.place}` : post.place}</span>
          <span>
            {variant === 'full'
              ? `시간: ${post.date} ${post.timeSlot}`
              : `${post.date} / ${post.timeSlot}`}
          </span>
          <span>{`댓글 ${post.comments}개`}</span>
        </div>
      </div>
    </article>
  )

  if (!to) {
    return content
  }

  return <Link to={to}>{content}</Link>
}

export default PostCard
