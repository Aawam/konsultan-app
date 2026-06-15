export function StatCard({
  label,
  value,
  sub,
  color = 'text-foreground',
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={`text-2xl font-bold font-mono leading-tight ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function pct(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export function MiniBar({
  label,
  count,
  total,
  colorClass,
}: {
  label: string
  count: number
  total: number
  colorClass: string
}) {
  const p = pct(count, total)
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[12px] text-foreground font-medium truncate max-w-[200px]">{label}</span>
        <span className="text-[11px] font-mono text-muted-foreground ml-2 shrink-0">{count}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}
