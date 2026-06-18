'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { TabGroup } from '@/components/ui/tab-group'
import { Textarea } from '@/components/ui/textarea'
import { BadgeJenis } from '@/components/proyek/badges'
import { formatRupiah } from '@/lib/utils'
import type { PerusahaanDetail, PerusahaanFormData } from '@/lib/types/perusahaan'
import type { DinasOption, ProyekDisplay } from '@/lib/types/proyek'
import { getNamaPerusahaan } from '@/lib/types/proyek'

type Tab = 'proyek' | 'dinas' | 'perusahaan'
type YearFilter = number | 'semua'
type DinasSort = 'nama' | 'total'

type ManagedDinasRow = {
  id?: string
  dinas: string
  total: number
  berjalan: number
  selesai: number
  nilai: number
}

type DetailProject = {
  id: string
  nama_proyek: string
  jenis_pekerjaan: string
  tahun_anggaran: number
  nilai_penawaran: number | null
  dinas: string
}

const EMPTY_PERUSAHAAN_FORM: PerusahaanFormData = {
  nama_perusahaan: '',
  adalah_perusahaan_sendiri: false,
  inisial_perusahaan: '',
  kota: '',
  telepon: '',
  email: '',
  nama_direktur: '',
  alamat: '',
}

const EMPTY_DINAS_FORM = { dinas: '' }

function SectionHeading({
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

function SearchBox({
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

function DinasSlideover({
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

function DinasFormPanel({
  dinas,
  editing,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: {
  dinas: string
  editing: boolean
  saving: boolean
  onChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div className="section-card">
      <div className="section-header">
        <p className="section-title">{editing ? 'Edit Dinas / SKPD' : 'Tambah Dinas / SKPD'}</p>
      </div>
      <div className="section-body space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Nama Dinas / SKPD</label>
          <Input value={dinas} onChange={(e) => onChange(e.target.value)} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Batal</Button>
          <Button type="button" onClick={onSubmit} disabled={saving}>
            {saving ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Tambah Dinas'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PerusahaanFormPanel({
  form,
  editing,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: PerusahaanFormData
  editing: boolean
  saving: boolean
  onChange: (patch: Partial<PerusahaanFormData>) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div className="section-card">
      <div className="section-header">
        <p className="section-title">{editing ? 'Edit Perusahaan' : 'Tambah Perusahaan'}</p>
      </div>
      <div className="section-body space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Nama Perusahaan</label>
            <Input value={form.nama_perusahaan} onChange={(e) => onChange({ nama_perusahaan: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Inisial</label>
            <Input value={form.inisial_perusahaan ?? ''} onChange={(e) => onChange({ inisial_perusahaan: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Kota</label>
            <Input value={form.kota ?? ''} onChange={(e) => onChange({ kota: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Telepon</label>
            <Input value={form.telepon ?? ''} onChange={(e) => onChange({ telepon: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Email</label>
            <Input value={form.email ?? ''} onChange={(e) => onChange({ email: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Nama Direktur</label>
            <Input value={form.nama_direktur ?? ''} onChange={(e) => onChange({ nama_direktur: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">Alamat</label>
            <Textarea rows={3} value={form.alamat ?? ''} onChange={(e) => onChange({ alamat: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.adalah_perusahaan_sendiri}
            onChange={(e) => onChange({ adalah_perusahaan_sendiri: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          Jadikan perusahaan utama
        </label>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Batal</Button>
          <Button type="button" onClick={onSubmit} disabled={saving}>
            {saving ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Tambah Perusahaan'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ResponsiveFormShell({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="p-0">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="max-h-[85vh] overflow-y-auto p-5">{children}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="max-h-[80vh] overflow-y-auto px-5 pb-5">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}

export function DatabaseClient({
  perusahaanList,
  proyekList,
  dinasList,
}: {
  perusahaanList: PerusahaanDetail[]
  proyekList: ProyekDisplay[]
  dinasList: DinasOption[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('proyek')
  const [search, setSearch] = useState('')
  const [tahunProyek, setTahunProyek] = useState<YearFilter>('semua')
  const [tahunDinas, setTahunDinas] = useState<YearFilter>('semua')
  const [dinasSort, setDinasSort] = useState<DinasSort>('nama')

  const [dinasForm, setDinasForm] = useState(EMPTY_DINAS_FORM)
  const [showDinasForm, setShowDinasForm] = useState(false)
  const [editingDinasId, setEditingDinasId] = useState<string | null>(null)
  const [savingDinas, setSavingDinas] = useState(false)
  const [deletingDinas, setDeletingDinas] = useState<ManagedDinasRow | null>(null)

  const [perusahaanForm, setPerusahaanForm] = useState<PerusahaanFormData>(EMPTY_PERUSAHAAN_FORM)
  const [showPerusahaanForm, setShowPerusahaanForm] = useState(false)
  const [editingPerusahaanId, setEditingPerusahaanId] = useState<string | null>(null)
  const [savingPerusahaan, setSavingPerusahaan] = useState(false)
  const [deletingPerusahaan, setDeletingPerusahaan] = useState<PerusahaanDetail | null>(null)

  const [selectedDinasName, setSelectedDinasName] = useState<string | null>(null)

  const yearTabs = useMemo(
    () => [
      { label: 'Semua', value: 'semua' as const },
      ...[...new Set(proyekList.map((p) => p.tahun_anggaran))]
        .sort((a, b) => b - a)
        .map((year) => ({ label: String(year), value: year })),
    ],
    [proyekList]
  )

  const filteredProyek = useMemo(() => {
    let rows = proyekList
    if (tahunProyek !== 'semua') rows = rows.filter((project) => project.tahun_anggaran === tahunProyek)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((project) =>
        project.nama_proyek.toLowerCase().includes(q) ||
        project.dinas.toLowerCase().includes(q) ||
        getNamaPerusahaan(project.perusahaan).toLowerCase().includes(q)
      )
    }
    return rows
  }, [proyekList, tahunProyek, search])

  const dinasProjectsSource = useMemo(
    () => (tahunDinas === 'semua' ? proyekList : proyekList.filter((project) => project.tahun_anggaran === tahunDinas)),
    [proyekList, tahunDinas]
  )

  const dinasRows = useMemo<ManagedDinasRow[]>(() => {
    const rows = new Map<string, ManagedDinasRow>()

    dinasList.forEach((item) => {
      rows.set(item.dinas.trim(), {
        id: item.id,
        dinas: item.dinas.trim(),
        total: 0,
        berjalan: 0,
        selesai: 0,
        nilai: 0,
      })
    })

    dinasProjectsSource.forEach((project) => {
      const key = project.dinas.trim()
      const current = rows.get(key) ?? {
        dinas: key,
        total: 0,
        berjalan: 0,
        selesai: 0,
        nilai: 0,
      }
      const selesai = project.persentase_progress === 100
      rows.set(key, {
        ...current,
        total: current.total + 1,
        berjalan: current.berjalan + (selesai ? 0 : 1),
        selesai: current.selesai + (selesai ? 1 : 0),
        nilai: current.nilai + (project.nilai_penawaran ?? 0),
      })
    })

    return [...rows.values()]
      .filter((row) => !search || row.dinas.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (dinasSort === 'total') {
          return b.total - a.total || a.dinas.localeCompare(b.dinas)
        }
        return a.dinas.localeCompare(b.dinas) || b.total - a.total
      })
  }, [dinasList, dinasProjectsSource, search, dinasSort])

  const companyRows = useMemo(() => {
    return perusahaanList
      .filter((company) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          company.nama_perusahaan.toLowerCase().includes(q) ||
          (company.nama_direktur ?? '').toLowerCase().includes(q) ||
          (company.kota ?? '').toLowerCase().includes(q)
        )
      })
      .map((company) => {
        const projects = proyekList.filter((project) => project.perusahaan_id === company.id)
        return {
          company,
          total: projects.length,
          perencanaan: projects.filter((project) => project.jenis_pekerjaan === 'Perencanaan').length,
          pengawasan: projects.filter((project) => project.jenis_pekerjaan === 'Pengawasan').length,
          nilai: projects.reduce((sum, project) => sum + (project.nilai_penawaran ?? 0), 0),
        }
      })
      .sort((a, b) => b.total - a.total || a.company.nama_perusahaan.localeCompare(b.company.nama_perusahaan))
  }, [perusahaanList, proyekList, search])

  const selectedDinas = dinasRows.find((row) => row.dinas === selectedDinasName) ?? null

  const selectedDinasProjects = useMemo<DetailProject[]>(
    () =>
      dinasProjectsSource
        .filter((project) => project.dinas === selectedDinas?.dinas)
        .sort((a, b) => b.tahun_anggaran - a.tahun_anggaran || a.nama_proyek.localeCompare(b.nama_proyek))
        .map((project) => ({
          id: project.id,
          nama_proyek: project.nama_proyek,
          jenis_pekerjaan: project.jenis_pekerjaan,
          tahun_anggaran: project.tahun_anggaran,
          nilai_penawaran: project.nilai_penawaran,
          dinas: project.dinas,
        })),
    [dinasProjectsSource, selectedDinas]
  )

  const resetDinasForm = () => {
    setDinasForm(EMPTY_DINAS_FORM)
    setShowDinasForm(false)
    setEditingDinasId(null)
  }

  const resetPerusahaanForm = () => {
    setPerusahaanForm(EMPTY_PERUSAHAAN_FORM)
    setShowPerusahaanForm(false)
    setEditingPerusahaanId(null)
  }

  const submitDinas = async () => {
    if (!dinasForm.dinas.trim()) {
      toast.error('Nama dinas wajib diisi')
      return
    }

    setSavingDinas(true)
    const endpoint = editingDinasId ? `/api/dinas/${editingDinasId}` : '/api/dinas'
    const method = editingDinasId ? 'PATCH' : 'POST'
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dinasForm),
    })
    const json = await res.json() as { error?: string }
    setSavingDinas(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Gagal menyimpan dinas')
      return
    }

    toast.success(editingDinasId ? 'Dinas berhasil diperbarui' : 'Dinas berhasil ditambahkan')
    resetDinasForm()
    router.refresh()
  }

  const submitPerusahaan = async () => {
    if (!perusahaanForm.nama_perusahaan.trim()) {
      toast.error('Nama perusahaan wajib diisi')
      return
    }

    setSavingPerusahaan(true)
    const endpoint = editingPerusahaanId ? `/api/perusahaan/${editingPerusahaanId}` : '/api/perusahaan'
    const method = editingPerusahaanId ? 'PATCH' : 'POST'
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perusahaanForm),
    })
    const json = await res.json() as { error?: string }
    setSavingPerusahaan(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Gagal menyimpan perusahaan')
      return
    }

    toast.success(editingPerusahaanId ? 'Perusahaan berhasil diperbarui' : 'Perusahaan berhasil ditambahkan')
    resetPerusahaanForm()
    router.refresh()
  }

  const searchPlaceholder =
    tab === 'proyek'
      ? 'Cari proyek / dinas / perusahaan…'
      : tab === 'dinas'
      ? 'Cari dinas / SKPD…'
      : 'Cari perusahaan / direktur / kota…'

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Database"
        description="Kelola proyek, dinas/SKPD, dan perusahaan dalam satu halaman dengan layout yang lebih ringkas dan fokus."
        action={
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
            <SearchBox value={search} onChange={setSearch} placeholder={searchPlaceholder} />
            {tab === 'dinas' && (
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  resetDinasForm()
                  setShowDinasForm(true)
                }}
              >
                + Tambah Dinas
              </Button>
            )}
            {tab === 'perusahaan' && (
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  resetPerusahaanForm()
                  setShowPerusahaanForm(true)
                }}
              >
                + Tambah Perusahaan
              </Button>
            )}
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-muted/15 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabGroup
            value={tab}
            onChange={(value) => setTab(value)}
            tabs={[
              { label: 'Semua Proyek', value: 'proyek' },
              { label: 'Dinas / SKPD', value: 'dinas' },
              { label: 'Perusahaan', value: 'perusahaan' },
            ]}
            className="rounded-2xl bg-background p-1.5"
            buttonClassName="px-5 py-2.5 text-sm"
          />

          {tab === 'proyek' && (
            <TabGroup
              tabs={yearTabs}
              value={tahunProyek}
              onChange={setTahunProyek}
              className="rounded-2xl bg-background p-1.5"
              buttonClassName="px-4 py-2 text-sm"
            />
          )}
          {tab === 'dinas' && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <TabGroup
                tabs={yearTabs}
                value={tahunDinas}
                onChange={setTahunDinas}
                className="rounded-2xl bg-background p-1.5"
                buttonClassName="px-4 py-2 text-sm"
              />
              <TabGroup
                tabs={[
                  { label: 'Nama Dinas', value: 'nama' },
                  { label: 'Total Proyek', value: 'total' },
                ]}
                value={dinasSort}
                onChange={(value) => setDinasSort(value as DinasSort)}
                className="rounded-2xl bg-background p-1.5"
                buttonClassName="px-4 py-2 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {tab === 'proyek' && (
        <div className="section-card overflow-hidden">
          <div className="section-header">
            <p className="section-title">Semua Proyek</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {['Nama Proyek', 'Perusahaan', 'Dinas / SKPD', 'Jenis', 'Tahun', 'Kontrak'].map((heading, index) => (
                    <th
                      key={heading}
                      className={`px-4 py-3 text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground ${index === 5 ? 'text-right' : 'text-left'}`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProyek.length > 0 ? filteredProyek.map((project, index) => (
                  <tr key={project.id} className={`border-b border-border last:border-0 transition-colors hover:bg-muted/40 ${index % 2 === 1 ? 'bg-muted/20' : ''}`}>
                    <td className="max-w-[280px] px-4 py-3">
                      <Link href={`/proyek/${project.id}`} className="block truncate font-medium text-foreground transition-colors hover:text-brand">
                        {project.nama_proyek}
                      </Link>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-muted-foreground">{getNamaPerusahaan(project.perusahaan)}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-muted-foreground">{project.dinas}</td>
                    <td className="px-4 py-3"><BadgeJenis jenis={project.jenis_pekerjaan} /></td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{project.tahun_anggaran}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {project.nilai_penawaran ? formatRupiah(project.nilai_penawaran) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Tidak ada proyek yang cocok dengan filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'dinas' && (
        <div className="space-y-4">
          <div className="section-card overflow-hidden">
            <div className="section-header">
              <p className="section-title">Data Dinas / SKPD</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/35">
                    {['Daftar Dinas / SKPD', 'Proyek Sedang Berjalan', 'Proyek Selesai', 'Total Proyek'].map((heading, index) => (
                      <th
                        key={heading}
                        className={`px-4 py-3 text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground ${index === 0 ? 'text-left' : 'text-center'}`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dinasRows.length > 0 ? dinasRows.map((row, index) => {
                    const selected = row.dinas === selectedDinas?.dinas
                    return (
                      <tr
                        key={`${row.id ?? 'legacy'}-${row.dinas}`}
                        onClick={() => {
                          setSelectedDinasName(row.dinas)
                        }}
                        className={`cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/35 ${selected ? 'bg-brand/6' : index % 2 === 1 ? 'bg-muted/15' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{row.dinas}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-foreground">{row.berjalan}</td>
                        <td className="px-4 py-3 text-center font-mono text-foreground">{row.selesai}</td>
                        <td className="px-4 py-3 text-center font-mono font-semibold text-foreground">{row.total}</td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">Belum ada dinas yang cocok dengan filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'perusahaan' && (
        <div className="space-y-4">
          <div className="section-card overflow-hidden">
            <div className="section-header">
              <p className="section-title">Data Perusahaan</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/35">
                    {['Daftar Perusahaan', 'Total Proyek', 'Perencanaan', 'Pengawasan', 'Nama Direktur', 'Aksi'].map((heading, index) => (
                      <th
                        key={heading}
                        className={`px-4 py-3 text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground ${index === 0 || index === 4 || index === 5 ? 'text-left' : 'text-center'}`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {companyRows.length > 0 ? companyRows.map((row, index) => (
                    <tr key={row.company.id} className={`border-b border-border last:border-0 transition-colors hover:bg-muted/35 ${index % 2 === 1 ? 'bg-muted/15' : ''}`}>
                      <td className="px-4 py-3">
                        <Link href={`/database/perusahaan/${row.company.id}`} className="block">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand/25 bg-brand/8">
                              <span className="text-sm font-black text-brand">
                                {row.company.inisial_perusahaan ?? row.company.nama_perusahaan.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-foreground">{row.company.nama_perusahaan}</p>
                                {row.company.adalah_perusahaan_sendiri && (
                                  <span className="rounded-full border border-brand/25 bg-brand/8 px-2 py-0.5 text-[11px] font-medium text-brand">
                                    Utama
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {(row.company.kota ?? 'Kota belum diisi')} • {row.nilai ? formatRupiah(row.nilai) : 'Belum ada kontrak'}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-semibold text-foreground">{row.total}</td>
                      <td className="px-4 py-3 text-center font-mono text-foreground">{row.perencanaan}</td>
                      <td className="px-4 py-3 text-center font-mono text-foreground">{row.pengawasan}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-foreground">{row.company.nama_direktur || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPerusahaanId(row.company.id)
                              setPerusahaanForm({
                                nama_perusahaan: row.company.nama_perusahaan,
                                adalah_perusahaan_sendiri: row.company.adalah_perusahaan_sendiri,
                                inisial_perusahaan: row.company.inisial_perusahaan ?? '',
                                kota: row.company.kota ?? '',
                                telepon: row.company.telepon ?? '',
                                email: row.company.email ?? '',
                                nama_direktur: row.company.nama_direktur ?? '',
                                alamat: row.company.alamat ?? '',
                              })
                              setShowPerusahaanForm(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => setDeletingPerusahaan(row.company)}>
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Belum ada perusahaan yang cocok dengan filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingPerusahaan)}
        onOpenChange={(open) => !open && setDeletingPerusahaan(null)}
        title="Hapus perusahaan?"
        description={deletingPerusahaan ? `Perusahaan "${deletingPerusahaan.nama_perusahaan}" akan dihapus permanen jika tidak sedang dipakai proyek.` : undefined}
        confirmLabel="Hapus"
        confirmClassName="bg-destructive/15 text-destructive border border-destructive/20 hover:bg-destructive/25"
        onConfirm={async () => {
          if (!deletingPerusahaan) return
          const res = await fetch(`/api/perusahaan/${deletingPerusahaan.id}`, { method: 'DELETE' })
          const json = await res.json() as { error?: string }
          if (!res.ok) {
            toast.error(json.error ?? 'Gagal menghapus perusahaan')
            return
          }
          toast.success('Perusahaan berhasil dihapus')
          setDeletingPerusahaan(null)
          router.refresh()
        }}
      />

      <ResponsiveFormShell
        open={showPerusahaanForm}
        title={editingPerusahaanId ? 'Edit Perusahaan' : 'Tambah Perusahaan'}
        description="Kelola data perusahaan tanpa meninggalkan halaman database."
        onClose={resetPerusahaanForm}
      >
        <PerusahaanFormPanel
          form={perusahaanForm}
          editing={Boolean(editingPerusahaanId)}
          saving={savingPerusahaan}
          onChange={(patch) => setPerusahaanForm((prev) => ({ ...prev, ...patch }))}
          onCancel={resetPerusahaanForm}
          onSubmit={submitPerusahaan}
        />
      </ResponsiveFormShell>

      <ConfirmDialog
        open={Boolean(deletingDinas)}
        onOpenChange={(open) => !open && setDeletingDinas(null)}
        title="Hapus dinas?"
        description={deletingDinas ? `Dinas "${deletingDinas.dinas}" akan dihapus jika tidak sedang dipakai proyek aktif.` : undefined}
        confirmLabel="Hapus"
        confirmClassName="bg-destructive/15 text-destructive border border-destructive/20 hover:bg-destructive/25"
        onConfirm={async () => {
          if (!deletingDinas?.id) return
          const res = await fetch(`/api/dinas/${deletingDinas.id}`, { method: 'DELETE' })
          const json = await res.json() as { error?: string }
          if (!res.ok) {
            toast.error(json.error ?? 'Gagal menghapus dinas')
            return
          }
          toast.success('Dinas berhasil dihapus')
          setDeletingDinas(null)
          router.refresh()
        }}
      />

      <ResponsiveFormShell
        open={showDinasForm}
        title={editingDinasId ? 'Edit Dinas / SKPD' : 'Tambah Dinas / SKPD'}
        description="Tambahkan atau perbarui referensi dinas/SKPD."
        onClose={resetDinasForm}
      >
        <DinasFormPanel
          dinas={dinasForm.dinas}
          editing={Boolean(editingDinasId)}
          saving={savingDinas}
          onChange={(value) => setDinasForm({ dinas: value })}
          onCancel={resetDinasForm}
          onSubmit={submitDinas}
        />
      </ResponsiveFormShell>

      <DinasSlideover
        row={selectedDinas}
        projects={selectedDinasProjects}
        tahunDinas={tahunDinas}
        onClose={() => setSelectedDinasName(null)}
        onEdit={(row) => {
          if (!row.id) return
          setSelectedDinasName(null)
          setEditingDinasId(row.id)
          setDinasForm({ dinas: row.dinas })
          setShowDinasForm(true)
        }}
        onDelete={(row) => {
          setDeletingDinas(row)
        }}
      />
    </div>
  )
}
