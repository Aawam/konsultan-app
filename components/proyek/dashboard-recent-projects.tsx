import Link from 'next/link'

import { BadgeJenis, BadgeTahap } from '@/components/proyek/badges'
import { formatRupiah } from '@/lib/utils'
import { getNamaPerusahaan, type ProyekDisplay } from '@/lib/types/proyek'

export function DashboardRecentProjects({
  projects,
  canViewCommercial,
}: {
  projects: ProyekDisplay[]
  canViewCommercial: boolean
}) {
  return (
    <section className="section-card" aria-labelledby="recent-projects-title">
      <div className="section-header flex items-center justify-between gap-3">
        <h2 id="recent-projects-title" className="section-title">Proyek Terbaru</h2>
        <Link href="/proyek" className="inline-flex min-h-10 shrink-0 items-center text-xs font-medium text-brand hover:underline md:min-h-8">
          Lihat semua →
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">Tidak ada proyek</p>
      ) : (
        <>
          <div className="grid gap-3 p-3 sm:grid-cols-2 md:hidden">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/proyek/${project.id}`}
                className="min-w-0 rounded-xl border border-border-subtle bg-background p-3 transition-colors hover:border-brand/45 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
                  {project.nama_proyek}
                </p>
                <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
                  {getNamaPerusahaan(project.perusahaan)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <BadgeJenis jenis={project.jenis_pekerjaan} />
                  <BadgeTahap tahap={project.tahap_progress} />
                </div>
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-border-subtle pt-3">
                  <p className="line-clamp-2 min-w-0 text-xs leading-5 text-muted-foreground">{project.dinas}</p>
                  {canViewCommercial && (
                    <p className="shrink-0 font-mono text-xs font-semibold text-foreground">
                      {project.nilai_penawaran ? formatRupiah(project.nilai_penawaran) : '—'}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="border-b border-border bg-muted/45">
                <tr>
                  <th scope="col" className="table-head px-5 py-3 text-left normal-case tracking-normal">Proyek</th>
                  <th scope="col" className="table-head px-4 py-3 text-left normal-case tracking-normal">Jenis</th>
                  <th scope="col" className="table-head px-4 py-3 text-left normal-case tracking-normal">Tahap</th>
                  <th scope="col" className="table-head px-4 py-3 text-left normal-case tracking-normal">Dinas</th>
                  {canViewCommercial && <th scope="col" className="table-head px-4 py-3 text-right normal-case tracking-normal">Nilai</th>}
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <tr
                    key={project.id}
                    className={`border-b border-border transition-colors last:border-0 hover:bg-muted/40 ${index % 2 === 0 ? '' : 'bg-muted/20'}`}
                  >
                    <td className="max-w-[260px] px-5 py-3">
                      <Link href={`/proyek/${project.id}`} className="inline-flex min-h-8 max-w-full items-center truncate font-medium text-foreground transition-colors hover:text-brand">
                        {project.nama_proyek}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {getNamaPerusahaan(project.perusahaan)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3"><BadgeJenis jenis={project.jenis_pekerjaan} /></td>
                    <td className="whitespace-nowrap px-4 py-3"><BadgeTahap tahap={project.tahap_progress} /></td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-xs text-muted-foreground">{project.dinas}</td>
                    {canViewCommercial && (
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-semibold">
                        {project.nilai_penawaran ? formatRupiah(project.nilai_penawaran) : <span className="text-muted-foreground">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
