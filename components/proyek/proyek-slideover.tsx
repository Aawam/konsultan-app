'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { BadgeJenis, BadgeTahap, BadgeOverride, BadgeWorkflow } from '@/components/proyek/badges'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatCompactRupiah } from '@/lib/utils'
import { TAHAP_BAR_COLOR } from '@/lib/constants/proyek'
import { evaluateProjectCompleteness, getProjectWorkflowGate } from '@/lib/project-completeness'
import type { ProyekDetail } from '@/lib/types/proyek'

type OverrideLog = { id: string; field_dioverride: string; alasan: string; dilakukan_pada: string }

export function ProyekSlideover({
  id,
  onClose,
  canViewCommercial = true,
  canManageProjects = true,
}: {
  id: string | null
  onClose: () => void
  canViewCommercial?: boolean
  canManageProjects?: boolean
}) {
  const router = useRouter()
  const [proyek, setProyek] = useState<ProyekDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // I2: error state so the panel doesn't silently stay blank on fetch failure
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchData = useCallback(async (proyekId: string) => {
    setLoading(true)
    setProyek(null)
    setFetchError(null)
    try {
      const res = await fetch(`/api/proyek/${proyekId}`)
      const json = await res.json() as {
        data?: {
          proyek?: ProyekDetail
          overrideLogs?: OverrideLog[]
        }
        error?: string
      }
      if (!res.ok || !json.data?.proyek) {
        setFetchError(json.error ?? 'Gagal memuat data proyek.')
        return
      }
      setProyek(json.data.proyek)
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Gagal memuat data proyek.')
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
    let json: { error?: string } = {}
    let ok = false

    try {
      const res = await fetch(`/api/proyek/${id}`, { method: 'DELETE' })
      json = await res.json() as { error?: string }
      ok = res.ok
    } catch (error) {
      json = { error: error instanceof Error ? error.message : 'Terjadi kesalahan koneksi' }
    } finally {
      setDeleting(false)
    }

    if (!ok || json.error) {
      toast.error(`Gagal menghapus: ${json.error ?? 'Terjadi kesalahan'}`)
      return
    }

    toast.success('Proyek berhasil dihapus')
    onClose()
    router.refresh()
  }

  const handleOpenDetail = () => {
    if (!id) return
    onClose()
    router.push(`/proyek/${id}`)
  }

  const open = !!id
  const perusahaan = proyek?.perusahaan ?? null
  const persen     = proyek?.persentase_progress ?? 0
  const isSelesai  = persen === 100
  const barColor   = isSelesai
    ? 'bg-emerald'
    : TAHAP_BAR_COLOR[proyek?.tahap_progress ?? ''] ?? 'bg-brand'
  const completeness = proyek
    ? evaluateProjectCompleteness(proyek, { includeCommercial: canViewCommercial })
    : null
  const workflowGate = completeness ? getProjectWorkflowGate(completeness) : null

  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <SheetContent side="right" className="!w-[400px] max-w-[96vw] border-l border-border bg-card p-0 shadow-xl">
          <SheetHeader className="shrink-0 px-4 py-3 sm:px-5 sm:py-4">
            <div>
              <SheetTitle>Ringkasan Proyek</SheetTitle>
              <SheetDescription className="sr-only">Ringkasan cepat status proyek dan aksi kerja berikutnya.</SheetDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Tutup ringkasan proyek"
              title="Tutup ringkasan proyek"
              className="size-10 sm:size-8"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              <div className="skeleton h-7 w-36" />
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-2 w-full rounded-full" />
              <div className="grid grid-cols-2 gap-3 pt-8">
                <div className="skeleton h-20 rounded-xl" />
                <div className="skeleton h-20 rounded-xl" />
              </div>
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
                <p className="text-xs text-muted-foreground mt-0.5">{fetchError}</p>
              </div>
              <button onClick={() => id && fetchData(id)}
                className="text-xs text-brand hover:underline transition-colors">
                Coba lagi →
              </button>
            </div>
          )}

          {/* Content fades in after load */}
          {!loading && !fetchError && proyek && (
            <div className="min-h-[calc(100vh-2.5rem)] space-y-5 animate-in fade-in-0 duration-200 supports-[height:100dvh]:min-h-[calc(100dvh-2.5rem)]">
              <div className="flex flex-wrap items-center gap-2">
                <BadgeJenis jenis={proyek.jenis_pekerjaan as string} />
                <BadgeTahap tahap={proyek.tahap_progress} />
                {!!proyek.pernah_dioverride && <BadgeOverride />}
              </div>

              <div>
                <h2 className="text-lg font-bold leading-tight text-foreground sm:text-xl">
                  {proyek.nama_proyek}
                </h2>
                <p className="mt-3 text-xs text-muted-foreground">{proyek.dinas}</p>
                <p className="mt-2 text-sm text-foreground">
                  {perusahaan?.nama_perusahaan ?? '-'}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Progress keseluruhan</span>
                  <span className={`text-xl font-mono font-bold ${isSelesai ? 'text-emerald' : 'text-brand'}`}>{persen}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${persen}%` }} />
                </div>
              </div>

              <section aria-label="Status dan aksi kerja" className="rounded-xl border border-border bg-muted/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="detail-label">Status kerja</p>
                  {workflowGate && <BadgeWorkflow status={completeness?.status ?? 'incomplete'} gate={workflowGate} />}
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{completeness?.nextAction}</p>
                <Button
                  type="button"
                  size="lg"
                  onClick={handleOpenDetail}
                  className="mt-4 h-10 w-full bg-brand text-primary-foreground hover:bg-brand/90"
                >
                  Buka Detail Proyek
                  <ArrowRightIcon />
                </Button>
              </section>

              <div>
                <p className="detail-label">Informasi pendukung</p>
                <p className="mt-2 text-base font-semibold text-foreground">{proyek.nomor_kontrak ?? 'Nomor kontrak belum diisi'}</p>
              </div>

              <div className={`grid gap-3 ${canViewCommercial ? 'grid-cols-1 min-[360px]:grid-cols-2' : 'grid-cols-1'}`}>
                {canViewCommercial && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground">Nilai Kontrak</p>
                    <p className="mt-2 break-words text-xl font-bold leading-tight text-foreground sm:text-2xl">{formatCompactRupiah(proyek.nilai_penawaran ?? null)}</p>
                  </div>
                )}
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground">Tahun</p>
                  <p className="mt-2 text-2xl font-bold font-mono text-foreground">{proyek.tahun_anggaran}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{proyek.sumber_dana}</p>
                </div>
              </div>

              {canManageProjects && (
                <div className="border-t border-border-subtle pt-4">
                  <p className="detail-label">Tindakan berisiko</p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    onClick={() => setDeleteOpen(true)}
                    disabled={deleting}
                    className="mt-2 h-10 w-full justify-start"
                  >
                    <Trash2Icon />
                    {deleting ? 'Menghapus proyek...' : 'Hapus proyek'}
                  </Button>
                </div>
              )}
            </div>
          )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleting(false) }}
        title="Hapus proyek ini?"
        description="Data proyek akan disembunyikan dari daftar proyek dan export."
        confirmLabel="Ya, Hapus"
        confirmClassName="bg-rose/15 text-rose border border-rose/20 hover:bg-rose/25"
        onConfirm={handleDelete}
      />

    </>
  )
}
