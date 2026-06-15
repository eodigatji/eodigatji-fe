type StatusBadgeProps = {
  status: 'LOST' | 'FOUND'
}

function StatusBadge({ status }: StatusBadgeProps) {
  const label = status === 'LOST' ? '분실' : '습득'

  return (
    <span
      className={[
        'rounded-full px-2.5 py-1 text-[11px] font-semibold',
        status === 'LOST'
          ? 'bg-[color:var(--lost-soft)] text-[color:var(--lost-strong)]'
          : 'bg-[color:var(--found-soft)] text-[color:var(--found-strong)]',
      ].join(' ')}
    >
      {label}
    </span>
  )
}

export default StatusBadge
