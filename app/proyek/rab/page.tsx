import Link from 'next/link'

import { BadgeJenis, BadgeTahap } from '@/components/proyek/badges'
import { Button } from '@/components/ui/button'
import { PageError } from '@/components/ui/page-error'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getCurrentUserProfile } from '@/lib/auth'
import { getRabProjectList } from '@/lib/actions/rab'

export default async function RabProjectListPage() {
  const { profile } = await getCurrentUserProfile()
  const { data: projects, error } = await getRabProjectList(profile)
  if (error) return <PageError error={error} />

  return (
    <div className="pb-10">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Estimasi</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Pembuatan RAB</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Daftar proyek Perencanaan yang dapat dipakai untuk menyusun RAB/EE. Tenaga Ahli melihat proyek non-sensitif tanpa nilai pagu, HPS, atau kontrak.
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <p className="stat-label">Proyek Perencanaan</p>
          <p className="stat-value">{projects.length}</p>
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
            {projects.length > 0 ? (
              projects.map((project) => (
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
                  Belum ada proyek Perencanaan yang bisa diakses untuk RAB.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
