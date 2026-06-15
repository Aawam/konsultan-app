const TAHAP_COLOR: Record<string, { bar: string; text: string }> = {
  'Persiapan & SPMK':              { bar: 'bg-brand',   text: 'text-brand' },
  'Survey Lapangan':                { bar: 'bg-brand',   text: 'text-brand' },
  'Konsep Desain':                  { bar: 'bg-amber',   text: 'text-amber' },
  'Penyusunan Laporan Antara':      { bar: 'bg-amber',   text: 'text-amber' },
  'Penyusunan Laporan Akhir & RAB': { bar: 'bg-violet',  text: 'text-violet' },
  'Penyerahan & Revisi':            { bar: 'bg-violet',  text: 'text-violet' },
  'Selesai (BAST)':                 { bar: 'bg-emerald', text: 'text-emerald' },
  'Persiapan':                      { bar: 'bg-brand',   text: 'text-brand' },
  'Pengawasan Tahap 1':             { bar: 'bg-amber',   text: 'text-amber' },
  'Pengawasan Tahap 2':             { bar: 'bg-amber',   text: 'text-amber' },
  'Pengawasan Tahap 3':             { bar: 'bg-violet',  text: 'text-violet' },
}

export function ProgressCell({ tahap, persen }: { tahap: string | null; persen: number | null }) {
  if (!tahap) {
    return <span className="text-xs text-muted-foreground">Belum mulai</span>
  }

  const value = persen ?? 0
  const color = TAHAP_COLOR[tahap] ?? { bar: 'bg-muted-foreground', text: 'text-muted-foreground' }

  return (
    <div className="flex flex-col gap-1.5 min-w-[130px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={tahap}>
          {tahap}
        </span>
        <span className={`text-xs font-mono font-semibold shrink-0 ${color.text}`}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color.bar}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
