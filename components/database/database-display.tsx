import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { BadgeJenis } from '@/components/proyek/badges'
import { formatRupiah } from '@/lib/utils'

export type YearFilter = number | 'semua'

export type ManagedDinasRow = {
  id?: string
  dinas: string
  total: number
  berjalan: number
  selesai: number
  nilai: number
}

export type DetailProject = {
  id: string
  nama_proyek: string
  jenis_pekerjaan: string
  tahun_anggaran: number
  nilai_penawaran: number | null
  dinas: string
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-1">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Referensi</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative w-full sm:w-96">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">🔍</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = 'text-foreground',
  compact = false,
}: {
  label: string
  value: string | number
  tone?: string
  compact?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/25 p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 font-mono font-bold leading-tight ${compact ? 'text-xl md:text-2xl break-words' : 'text-3xl'} ${tone}`}>
        {value}
      </p>
    </div>
  )
}

function SectionCardSimple({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="section-card">
      <div className="section-header">
        <p className="section-title">{title}</p>
      </div>
      <div className="section-body">{children}</div>
    </div>
  )
}

function DetailProjects({
  projects,
  emptyLabel,
}: {
  projects: DetailProject[]
  emptyLabel: string
}) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/proyek/${project.id}`}
          className="block rounded-2xl border border-border bg-background px-4 py-3 transition-colors hover:border-brand/30 hover:bg-muted/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{project.nama_proyek}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {project.dinas} • {project.tahun_anggaran}
              </p>
            </div>
            <BadgeJenis jenis={project.jenis_pekerjaan} />
          </div>
          <div className="mt-3 text-sm font-mono font-semibold text-foreground">
            {project.nilai_penawaran ? formatRupiah(project.nilai_penawaran) : '—'}
          </div>
        </Link>
      ))}
    </div>
  )
}

export function DinasSlideover({
  row,
  projects,
  tahunDinas,
  onClose,
  onEdit,
  onDelete,
}: {
  row: ManagedDinasRow | null
  projects: DetailProject[]
  tahunDinas: YearFilter
  onClose: () => void
  onEdit: (row: ManagedDinasRow) => void
  onDelete: (row: ManagedDinasRow) => void
}) {
  const open = Boolean(row)

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="p-0">
        <SheetHeader className="bg-surface/80 backdrop-blur-md">
          <SheetTitle>Detail Dinas / SKPD</SheetTitle>
          <SheetDescription className="sr-only">
            Ringkasan dinas, statistik proyek terkait, dan daftar proyek pada filter tahun aktif.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {row ? (
            <div className="space-y-4">
              <div className="section-card">
                <div className="section-body space-y-5">
                  <div>
                    <p className="text-xl font-bold leading-tight text-foreground">{row.dinas}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Proyek terkait untuk {tahunDinas === 'semua' ? 'semua tahun' : `tahun ${tahunDinas}`}.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Total Proyek" value={row.total} />
                    <StatCard label="Total Kontrak" value={row.nilai ? formatRupiah(row.nilai) : '—'} compact />
                    <StatCard label="Sedang Berjalan" value={row.berjalan} tone="text-teal" />
                    <StatCard label="Selesai" value={row.selesai} tone="text-violet" />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(row)}
                      disabled={!row.id}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(row)}
                      disabled={!row.id}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>

              <SectionCardSimple title="Proyek Terkait">
                <DetailProjects
                  projects={projects}
                  emptyLabel="Belum ada proyek untuk dinas ini pada filter tahun yang dipilih."
                />
              </SectionCardSimple>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
