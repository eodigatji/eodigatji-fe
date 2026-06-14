type StatusBadgeProps = {
  status: 'LOST' | 'FOUND'
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={[
        'rounded-full px-2.5 py-1 text-xs font-semibold',
        status === 'LOST'
          ? 'bg-[color:var(--lost-soft)] text-[color:var(--lost-strong)]'
          : 'bg-[color:var(--found-soft)] text-[color:var(--found-strong)]',
      ].join(' ')}
    >
      {status}
    </span>
  )
}

export default StatusBadge
