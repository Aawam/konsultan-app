'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { BadgeJenis, BadgeTahap, BadgeOverride } from '@/components/proyek/badges'
import { KvField } from '@/components/ui/kv-field'
import { SectionCard } from '@/components/ui/section-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { formatRupiah, formatTanggal } from '@/lib/utils'
import { TAHAP_BAR_COLOR } from '@/lib/constants/proyek'
import type { ProyekDetail } from '@/lib/types/proyek'

type OverrideLog = { id: string; field_dioverride: string; alasan: string; dilakukan_pada: string }

export function ProyekSlideover({ id, onClose }: { id: string | null; onClose: () => void }) {
  const router = useRouter()
  const [proyek, setProyek] = useState<ProyekDetail | null>(null)
  const [overrideLogs, setOverrideLogs] = useState<OverrideLog[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // I2: error state so the panel doesn't silently stay blank on fetch failure
  const [fetchError, setFetchError] = useState(false)

  const fetchData = useCallback(async (proyekId: string) => {
    setLoading(true)
    setProyek(null)
    setFetchError(false)
    try {
      const res = await fetch(`/api/proyek/${proyekId}`)
      if (!res.ok) { setFetchError(true); return }
      const json = await res.json() as { proyek: ProyekDetail; overrideLogs?: OverrideLog[] }
      setProyek(json.proyek)
      setOverrideLogs(json.overrideLogs ?? [])
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (id) fetchData(id)
  }, [id, fetchData])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDelete = async () => {
    if (!id) return
    setDeleteOpen(false)
    setDeleting(true)
    const res = await fetch(`/api/proyek/${id}`, { method: 'DELETE' })
    const json = await res.json() as { error?: string }
    setDeleting(false)
    if (!res.ok || json.error) { toast.error(`Gagal menghapus: ${json.error ?? 'Terjadi kesalahan'}`); return }
    toast.success('Proyek berhasil dihapus')
    onClose()
    router.refresh()
  }

  const open = !!id
  const perusahaan = proyek?.perusahaan ?? null
  const persen     = proyek?.persentase_progress ?? 0
  const isSelesai  = persen === 100
  const barColor   = isSelesai
    ? 'bg-emerald'
    : TAHAP_BAR_COLOR[proyek?.tahap_progress ?? ''] ?? 'bg-brand'

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={[
          'fixed top-0 right-0 z-40 h-screen w-[560px] max-w-[95vw] bg-background border-l border-border shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Panel header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-border shrink-0 bg-surface/80 backdrop-blur-md">
          <p className="text-sm font-semibold text-foreground">Detail Proyek</p>
          <div className="flex items-center gap-2">
            {proyek && (
              <Link href={`/proyek/${id}`} className="text-xs text-brand hover:underline" onClick={onClose}>
                Buka halaman penuh →
              </Link>
            )}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              <div className="section-card p-5 space-y-3">
                <div className="flex gap-2"><div className="skeleton h-5 w-20 rounded-md" /><div className="skeleton h-5 w-24 rounded-md" /></div>
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-2 w-full rounded-full mt-2" />
              </div>
              {[3, 3, 2, 2].map((rows, si) => (
                <div key={si} className="section-card">
                  <div className="section-header"><div className="skeleton h-3 w-28" /></div>
                  <div className="section-body grid grid-cols-2 gap-x-6 gap-y-4">
                    {[...Array(rows)].map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="skeleton h-2.5 w-16" />
                        <div className="skeleton h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state with retry */}
          {!loading && fetchError && (
            <div className="flex flex-col items-center justify-center h-52 gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-rose/10 border border-rose/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Gagal memuat data</p>
                <p className="text-xs text-muted-foreground mt-0.5">Periksa koneksi dan coba lagi</p>
              </div>
              <button onClick={() => id && fetchData(id)}
                className="text-xs text-brand hover:underline transition-colors">
                Coba lagi →
              </button>
            </div>
          )}

          {/* Content fades in after load */}
          {!loading && !fetchError && proyek && (
            <div className="space-y-4 animate-in fade-in-0 duration-200">

              {/* Header card */}
              <div className="section-card">
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <BadgeJenis jenis={proyek.jenis_pekerjaan as string} />
                      <BadgeTahap tahap={proyek.tahap_progress} />
                      {!!proyek.pernah_dioverride && <BadgeOverride />}
                    </div>
                    <h2 className="text-base font-bold text-foreground leading-snug">
                      {proyek.nama_proyek}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Paket: {proyek.paket_pekerjaan_induk ?? '—'}
                      {perusahaan && (
                        <> &nbsp;·&nbsp; {perusahaan.nama_perusahaan}{perusahaan.adalah_perusahaan_sendiri ? ' ⭐' : ''}</>
                      )}
                    </p>
                  </div>
                  {/* I2: delete button now wired in the slideover */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/proyek/${id}/edit`} onClick={onClose}
                      className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors">
                      Edit
                    </Link>
                    <button onClick={() => setDeleteOpen(true)} disabled={deleting}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-rose/10 text-rose border-rose/20 hover:bg-rose/20 transition-colors disabled:opacity-50">
                      {deleting ? '…' : 'Hapus'}
                    </button>
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Progress keseluruhan</span>
                    <span className={`text-sm font-mono font-bold ${isSelesai ? 'text-emerald' : 'text-brand'}`}>{persen}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${persen}%` }} />
                  </div>
                </div>
              </div>

              <SectionCard title="Identitas Proyek">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <KvField label="Jenis Pekerjaan" value={proyek.jenis_pekerjaan as string} />
                  <KvField label="Kategori"         value={proyek.kategori_pekerjaan} />
                  <KvField label="Tahun Anggaran"   value={String(proyek.tahun_anggaran)} mono />
                  <KvField label="Sumber Dana"      value={proyek.sumber_dana} />
                  <KvField label="Perusahaan"
                    value={perusahaan ? `${perusahaan.nama_perusahaan}${perusahaan.adalah_perusahaan_sendiri ? ' ⭐' : ''}` : undefined}
                    span2 />
                </div>
              </SectionCard>

              <SectionCard title="Anggaran">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <KvField label="Pagu Dana"     value={formatRupiah(proyek.pagu_dana)} mono accent />
                  <KvField label="HPS"           value={formatRupiah(proyek.hps)} mono />
                  <KvField label="Nilai Kontrak" value={formatRupiah(proyek.nilai_penawaran)} mono />
                </div>
              </SectionCard>

              <SectionCard title="Pemberi Kerja">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <KvField label="Dinas / SKPD" value={proyek.dinas} span2 />
                  <KvField label="Lokasi"        value={proyek.lokasi_kecamatan ?? undefined} />
                  <KvField label="Nama PPK"      value={proyek.nama_ppk ?? undefined} />
                </div>
              </SectionCard>

              <SectionCard title="Pelaksanaan">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <KvField label="Tanggal Mulai"   value={formatTanggal(proyek.tanggal_mulai)} />
                  <KvField label="Tanggal Selesai" value={formatTanggal(proyek.tanggal_selesai)} />
                  <KvField label="Status Bendera"  value={proyek.status_proyek ?? undefined} />
                  <KvField label="Jalur Masuk"     value={proyek.jalur_masuk ?? undefined} />
                </div>
              </SectionCard>

              {proyek.catatan && (
                <SectionCard title="Catatan">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {proyek.catatan}
                  </p>
                </SectionCard>
              )}

              {overrideLogs.length > 0 && (
                <SectionCard title="Riwayat Override">
                  <div className="space-y-3">
                    {overrideLogs.map((log) => (
                      <div key={log.id} className="flex gap-4 items-start border-l-2 border-amber/30 pl-4">
                        <div className="flex-1 space-y-0.5">
                          <p className="text-sm font-medium text-foreground">{log.field_dioverride}</p>
                          <p className="text-xs text-muted-foreground">{log.alasan}</p>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {new Date(log.dilakukan_pada).toLocaleString('id-ID')}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              <SectionCard title="Metadata">
                <div className="grid grid-cols-2 gap-4">
                  <KvField label="Dibuat pada"       value={new Date(proyek.created_at).toLocaleString('id-ID')} mono />
                  <KvField label="Terakhir diupdate" value={new Date(proyek.updated_at).toLocaleString('id-ID')} mono />
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </aside>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleting(false) }}
        title="Hapus proyek ini?"
        description="Data proyek akan disembunyikan dari daftar proyek dan export."
        confirmLabel="Ya, Hapus"
        confirmClassName="bg-rose/15 text-rose border border-rose/20 hover:bg-rose/25"
        onConfirm={handleDelete}
      />
    </>
  )
}
