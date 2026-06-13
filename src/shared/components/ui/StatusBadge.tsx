type StatusBadgeProps = {
  status: 'LOST' | 'FOUND'
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={[
        'rounded-full px-2.5 py-1 text-xs font-semibold',
        status === 'LOST'
          ? 'bg-(--lost-soft) text-(--lost-strong)'
          : 'bg-(--found-soft) text-(--found-strong)',
      ].join(' ')}
    >
      {status}
    </span>
  )
}

export default StatusBadge
