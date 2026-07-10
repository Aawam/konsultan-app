'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, useCallback, useTransition } from 'react'
import { SearchIcon } from 'lucide-react'

import { BadgeJenis, BadgeTahap } from '@/components/proyek/badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { RabProjectListPage } from '@/lib/types/ahsp'
import type { RabProjectListFilters } from '@/lib/actions/rab'

export function RabProjectListClient({
  projectsPage,
  filters,
}: {
  projectsPage: RabProjectListPage
  filters: RabProjectListFilters
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const replaceQuery = useCallback((patch: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    }

    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }, [pathname, router, searchParams])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    replaceQuery({ q: String(formData.get('q') ?? '').trim(), page: null })
  }

  function updatePage(page: number) {
    replaceQuery({ page: Math.min(Math.max(page, 1), projectsPage.pageCount) })
  }

  function updatePageSize(pageSize: string) {
    replaceQuery({ pageSize, page: null })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Estimasi</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Pembuatan RAB</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Daftar proyek Perencanaan yang dapat dipakai untuk menyusun RAB/EE. Tenaga Ahli melihat proyek non-sensitif tanpa nilai pagu, HPS, atau kontrak.
          </p>
        </div>

        <form onSubmit={submitSearch} className="flex w-full gap-2 lg:w-[380px]">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              key={filters.search}
              name="q"
              defaultValue={filters.search}
              className="h-9 bg-card pl-8"
              placeholder="Cari proyek, dinas, lokasi"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isPending}>
            Cari
          </Button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <p className="stat-label">Proyek Perencanaan</p>
          <p className="stat-value">{projectsPage.total}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-border bg-muted/40 hover:bg-transparent">
              <TableHead className="table-head">Proyek</TableHead>
              <TableHead className="table-head w-36">Tahun</TableHead>
              <TableHead className="table-head w-56">Dinas</TableHead>
              <TableHead className="table-head w-44">Progress</TableHead>
              <TableHead className="table-head w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectsPage.rows.length > 0 ? (
              projectsPage.rows.map((project) => (
                <TableRow key={project.id} className="border-border hover:bg-muted/40">
                  <TableCell>
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <BadgeJenis jenis={project.jenis_pekerjaan} />
                        <BadgeTahap tahap={project.tahap_progress} />
                      </div>
                      <p className="truncate font-semibold text-foreground">{project.nama_proyek}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{project.kategori_pekerjaan}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{project.tahun_anggaran}</TableCell>
                  <TableCell>
                    <p className="truncate text-sm text-foreground">{project.dinas}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{project.lokasi_kecamatan ?? '-'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-violet" style={{ width: `${project.persentase_progress ?? 0}%` }} />
                      </div>
                      <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                        {project.persentase_progress ?? 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/proyek/${project.id}/rab`}>Buka</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-sm text-muted-foreground">
                  Belum ada proyek Perencanaan yang sesuai filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
        <div className="text-muted-foreground">
          Halaman <span className="font-semibold text-foreground">{projectsPage.page}</span> dari{' '}
          <span className="font-semibold text-foreground">{projectsPage.pageCount}</span>
          {' · '}
          {projectsPage.rows.length} ditampilkan dari {projectsPage.total} proyek
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(projectsPage.pageSize)} onValueChange={updatePageSize}>
            <SelectTrigger className="h-9 w-[130px] rounded-lg border-border bg-card px-3 text-sm font-semibold text-foreground">
              <SelectValue placeholder="Per halaman" />
            </SelectTrigger>
            <SelectContent className="select-content">
              {['10', '25', '50'].map((size) => (
                <SelectItem key={size} value={size} className="select-item">
                  {size} / halaman
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => updatePage(projectsPage.page - 1)}
            disabled={projectsPage.page <= 1 || isPending}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => updatePage(projectsPage.page + 1)}
            disabled={projectsPage.page >= projectsPage.pageCount || isPending}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  )
}
