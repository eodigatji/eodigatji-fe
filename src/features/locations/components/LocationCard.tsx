import { Link } from 'react-router-dom'
import {
  formatCoordinateValue,
  hasLocationCoordinates,
} from '../lib/locationCoordinates'

type LocationCardProps = {
  location: {
    id: number
    name: string
    detail: string
    number: string
    createdAt?: string
    keeper?: string
    latitude: number | null
    longitude: number | null
  }
  to?: string
  variant?: 'compact' | 'full'
}

function LocationCard({ location, to, variant = 'full' }: LocationCardProps) {
  const articleClassName =
    variant === 'compact'
      ? 'rounded-[var(--radius-card)] border border-(--border-subtle) bg-(--surface-soft) p-4'
      : 'rounded-(--radius-panel) border border-(--border-subtle) bg-[color:var(--surface-card)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5'

  const content = (
    <article className={articleClassName}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3
            className={
              variant === 'compact'
                ? 'text-sm font-semibold'
                : 'text-lg font-semibold'
            }
          >
            {location.name}
          </h3>
          <p className="mt-2 text-sm leading-6 text-(--text-muted)">
            {location.detail}
          </p>
        </div>
        <span
          className={[
            'rounded-full px-2.5 py-1 text-xs font-semibold text-(--text-muted)',
            variant === 'compact' ? 'bg-white' : 'bg-(--surface-soft)',
          ].join(' ')}
        >
          {location.number}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-(--text-muted)">
        <span>{location.keeper ?? location.createdAt ?? '추가 정보 없음'}</span>
        {variant === 'full' ? (
          <span>
            {hasLocationCoordinates(location) ? '지도 보기' : '좌표 미등록'}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-(--text-muted)">
        <span className="rounded-full bg-white px-2.5 py-1">
          위도 {formatCoordinateValue(location.latitude)}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1">
          경도 {formatCoordinateValue(location.longitude)}
        </span>
      </div>
    </article>
  )

  if (!to) {
    return content
  }

  return <Link to={to}>{content}</Link>
}

export default LocationCard
