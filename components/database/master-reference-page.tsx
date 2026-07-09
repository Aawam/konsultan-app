import type { ReactNode } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Column<T> = {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

type Stat = {
  label: string
  value: string | number
}

export function MasterReferencePage<T extends { id: string }>({
  eyebrow = 'Referensi PRD',
  title,
  description,
  rows,
  columns,
  stats,
  emptyLabel,
}: {
  eyebrow?: string
  title: string
  description: string
  rows: T[]
  columns: Column<T>[]
  stats?: Stat[]
  emptyLabel: string
}) {
  return (
    <div className="pb-10">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {stats && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-border bg-muted/40 hover:bg-transparent">
              {columns.map((column) => (
                <TableHead key={column.key} className={`table-head ${column.className ?? ''}`}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id} className="border-border hover:bg-muted/40">
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-sm text-muted-foreground">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
