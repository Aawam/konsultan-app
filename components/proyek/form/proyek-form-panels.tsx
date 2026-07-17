import { STEPS } from '@/components/proyek/form/proyek-form-schema'
import { parseNumberInput } from '@/lib/utils'

type ChecklistItem = {
  label: string
  done: boolean
}

export function ProyekFormProgressPanel({
  step,
  stepCompletion,
  checklist,
  onStepChange,
  variant = 'full',
  className = '',
}: {
  step: number
  stepCompletion: boolean[]
  checklist: ChecklistItem[]
  onStepChange: (step: number) => void
  variant?: 'compact' | 'full'
  className?: string
}) {
  if (variant === 'compact') {
    return (
      <aside className={`rounded-xl border border-border bg-card p-3 ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">Langkah {step} dari {STEPS.length}</p>
            <p className="text-xs text-muted-foreground">{STEPS[step - 1]}</p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{stepCompletion.filter(Boolean).length}/{STEPS.length} siap</span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2" aria-label="Pilih langkah pengisian">
          {STEPS.map((label, index) => {
            const num = index + 1
            const active = step === num
            const done = stepCompletion[index]
            return (
              <button
                key={label}
                type="button"
                onClick={() => onStepChange(num)}
                aria-current={active ? 'step' : undefined}
                aria-label={`Langkah ${num}: ${label}${done ? ', siap' : ''}`}
                className={[
                  'flex h-9 items-center justify-center rounded-lg border text-xs font-bold transition-colors',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary',
                ].join(' ')}
              >
                {done ? '✓' : num}
              </button>
            )
          })}
        </div>
      </aside>
    )
  }

  return (
    <aside className={`rounded-2xl border border-border bg-card p-5 xl:sticky xl:top-20 xl:self-start ${className}`}>
      <h2 className="text-base font-bold text-foreground">Progress Pengisian</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Isi data berurutan. Field bertanda * wajib diisi.
      </p>

      <div className="mt-6 space-y-5">
        {STEPS.map((label, index) => {
          const num = index + 1
          const active = step === num
          const done = stepCompletion[index]
          return (
            <button
              key={label}
              type="button"
              onClick={() => onStepChange(num)}
              aria-current={active ? 'step' : undefined}
              className="flex w-full items-center gap-3 rounded-xl text-left transition-colors hover:text-primary"
            >
              <span
                className={[
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground',
                ].join(' ')}
              >
                {done ? '✓' : num}
              </span>
              <span className={active ? 'text-sm font-bold text-foreground' : 'text-sm font-medium text-muted-foreground'}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="my-6 h-px bg-border" />

      <h3 className="text-sm font-bold text-foreground">Checklist minimal</h3>
      <div className="mt-4 space-y-3">
        {checklist.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className={[
                'flex size-4 items-center justify-center rounded border text-[10px]',
                item.done
                  ? 'border-teal bg-teal/10 text-teal'
                  : 'border-border text-transparent',
              ].join(' ')}
            >
              ✓
            </span>
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-primary/30 bg-primary/10 p-4">
        <p className="text-sm font-bold text-primary">Tips</p>
        <p className="mt-2 text-xs leading-relaxed text-primary">
          Nomor kontrak, HPS, dan tanggal bisa dikosongkan dulu jika belum tersedia.
        </p>
      </div>
    </aside>
  )
}

export function ProyekFormSummaryPanel({
  namaProyek,
  jenisPekerjaan,
  kategoriPekerjaan,
  nilaiPenawaran,
  paguDana,
  selectedDinas,
  checklist,
  className = '',
}: {
  namaProyek: string
  jenisPekerjaan: string
  kategoriPekerjaan: string
  nilaiPenawaran: string
  paguDana: string
  selectedDinas: string
  checklist: ChecklistItem[]
  className?: string
}) {
  return (
    <aside className={`rounded-2xl border border-border bg-card p-5 xl:sticky xl:top-20 xl:self-start ${className}`}>
      <h2 className="text-base font-bold text-foreground">Ringkasan Draft</h2>
      <p className="mt-1 text-xs text-muted-foreground">Akan berubah otomatis saat field diisi.</p>
      <div className="mt-5 inline-flex rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] font-semibold text-amber">
        Draft baru
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <p className="text-xs font-bold text-muted-foreground">Nama Proyek</p>
          <p className="mt-1 text-sm font-bold text-foreground">{namaProyek || 'Belum diisi'}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground">Jenis / Kategori</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {jenisPekerjaan && kategoriPekerjaan ? `${jenisPekerjaan} / ${kategoriPekerjaan}` : 'Belum dipilih'}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground">Nilai Kontrak</p>
          <p className="mt-1 text-xl font-black text-foreground">
            Rp {parseNumberInput(nilaiPenawaran).toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pagu: Rp {parseNumberInput(paguDana).toLocaleString('id-ID')}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground">Pemberi Kerja</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{selectedDinas || 'Belum diisi'}</p>
        </div>
      </div>

      <div className="my-6 h-px bg-border" />

      <h3 className="text-sm font-bold text-foreground">Validasi</h3>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="size-4 rounded border border-border" />
          <span className="text-xs text-muted-foreground">
            {checklist.filter((item) => !item.done).length} field wajib belum diisi
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex size-4 items-center justify-center rounded border border-teal bg-teal/10 text-[10px] text-teal">
            ✓
          </span>
          <span className="text-xs text-muted-foreground">Data bisa disimpan setelah langkah terakhir valid</span>
        </div>
      </div>
    </aside>
  )
}
