export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <p className="section-title">{title}</p>
      </div>
      <div className="section-body">
        {children}
      </div>
    </div>
  )
}
