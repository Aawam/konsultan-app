'use client'

import { usePathname } from 'next/navigation'

const TITLES: Record<string, { crumb: string; title: string }> = {
  '/proyek':           { crumb: 'Monitoring', title: 'Daftar Proyek' },
  '/proyek/dashboard': { crumb: 'Monitoring', title: 'Dashboard' },
  '/proyek/baru':      { crumb: 'Daftar Proyek', title: 'Tambah Proyek Baru' },
  '/database':         { crumb: 'Referensi', title: 'Database' },
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
      <p className="hidden text-[9px] font-mono uppercase tracking-[0.12em] text-muted-foreground sm:block">
        {match.crumb}
      </p>
      <p className="text-[13px] font-semibold leading-tight text-foreground lg:text-[14px]">{match.title}</p>
    </div>
  )
}
