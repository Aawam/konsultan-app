// Color-coded badges for Jenis and Tahap

export function BadgeJenis({ jenis }: { jenis: string }) {
  const isPerencanaan = jenis === 'Perencanaan'
  return (
    <span className={[
      'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap',
      isPerencanaan
        ? 'bg-violet/15 text-violet border border-violet/20'
        : 'bg-teal/15 text-teal border border-teal/20',
    ].join(' ')}>
      {jenis}
    </span>
  )
}

const TAHAP_STYLE: Record<string, string> = {
  'Persiapan & SPMK':              'bg-brand/10 text-brand border-brand/20',
  'Survey Lapangan':                'bg-brand/10 text-brand border-brand/20',
  'Konsep Desain':                  'bg-amber/10 text-amber border-amber/20',
  'Penyusunan Laporan Antara':      'bg-amber/10 text-amber border-amber/20',
  'Penyusunan Laporan Akhir & RAB': 'bg-violet/10 text-violet border-violet/20',
  'Penyerahan & Revisi':            'bg-violet/10 text-violet border-violet/20',
  'Selesai (BAST)':                 'bg-emerald/10 text-emerald border-emerald/20',
  'Persiapan':                      'bg-brand/10 text-brand border-brand/20',
  'Pengawasan Tahap 1':             'bg-amber/10 text-amber border-amber/20',
  'Pengawasan Tahap 2':             'bg-amber/10 text-amber border-amber/20',
  'Pengawasan Tahap 3':             'bg-violet/10 text-violet border-violet/20',
}

export function BadgeTahap({ tahap }: { tahap: string | null }) {
  if (!tahap) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium text-muted-foreground border border-border whitespace-nowrap">
        Belum mulai
      </span>
    )
  }
  const style = TAHAP_STYLE[tahap] ?? 'bg-muted text-muted-foreground border-border'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap ${style}`}>
      {tahap}
    </span>
  )
}

export function BadgeOverride() {
  return (
    <span
      title="Pernah dioverride"
      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber/15 text-amber border border-amber/25 text-[10px] font-bold shrink-0"
    >
      !
    </span>
  )
}
