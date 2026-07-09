import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <div className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
