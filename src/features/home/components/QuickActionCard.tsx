import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

type QuickActionCardProps = {
  body: string
  icon: LucideIcon
  title: string
  to: string
}

function QuickActionCard({
  body,
  icon: Icon,
  title,
  to,
}: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className="rounded-[var(--radius-card)] border border-(--border-subtle) bg-[color:var(--surface-card)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-(--accent-strong)">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-(--text-muted)">{body}</p>
    </Link>
  )
}

export default QuickActionCard
