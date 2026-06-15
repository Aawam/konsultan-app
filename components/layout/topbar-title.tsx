'use client'

import { usePathname } from 'next/navigation'

const TITLES: Record<string, { crumb: string; title: string }> = {
  '/proyek':           { crumb: 'Monitoring', title: 'Daftar Proyek' },
  '/proyek/dashboard': { crumb: 'Monitoring', title: 'Dashboard' },
  '/proyek/baru':      { crumb: 'Daftar Proyek', title: 'Tambah Proyek Baru' },
  '/penawaran/baru':   { crumb: 'Dokumen', title: 'Generator Penawaran' },
  '/bap/baru':         { crumb: 'Dokumen', title: 'Generator BAP' },
  '/database':         { crumb: 'Referensi', title: 'Database Perusahaan' },
}

export function TopbarTitle() {
  const pathname = usePathname()

  const match =
    TITLES[pathname] ??
    (pathname.includes('/edit')
      ? { crumb: 'Daftar Proyek', title: 'Edit Proyek' }
      : pathname.startsWith('/proyek/')
      ? { crumb: 'Daftar Proyek', title: 'Detail Proyek' }
      : { crumb: 'Konsulindo', title: 'Project Suite' })

  return (
    <div>
      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.12em]">
        {match.crumb}
      </p>
      <p className="text-[14px] font-semibold text-foreground leading-tight">{match.title}</p>
    </div>
  )
}
