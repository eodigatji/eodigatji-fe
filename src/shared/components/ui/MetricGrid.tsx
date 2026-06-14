type MetricItem = {
  label: string
  value: string
}

type MetricGridProps = {
  items: MetricItem[]
  columnsClassName?: string
}

function MetricGrid({
  items,
  columnsClassName = 'sm:grid-cols-3',
}: MetricGridProps) {
  return (
    <div className={`grid gap-3 ${columnsClassName}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[var(--radius-card)] bg-(--surface-soft) p-4"
        >
          <p className="eyebrow-tracking text-xs font-semibold text-(--text-muted) uppercase">
            {item.label}
          </p>
          <p className="mt-2 text-sm font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

export default MetricGrid
