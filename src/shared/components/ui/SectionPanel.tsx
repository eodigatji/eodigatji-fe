import type { ReactNode } from 'react'

type SectionPanelProps = {
  children: ReactNode
  className?: string
}

function SectionPanel({ children, className = '' }: SectionPanelProps) {
  return (
    <section
      className={[
        'rounded-[var(--radius-panel)] border border-(--border-subtle) bg-[color:var(--surface-card)] p-4 shadow-[var(--shadow-soft)]',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  )
}

export default SectionPanel
