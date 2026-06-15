export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}