import type { ReactNode } from 'react'

type SectionPanelProps = {
  children: ReactNode
  className?: string
}

function SectionPanel({ children, className = '' }: SectionPanelProps) {
  return (
    <section
      className={[
        'rounded-(--radius-panel) border border-(--border-subtle) bg-(--surface-card) p-5 shadow-(--shadow-soft)',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  )
}

export default SectionPanel
