import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
}

function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-(--text-muted)">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export default SectionHeader
