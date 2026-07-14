'use client'

import { useState, type ChangeEvent } from 'react'
import { DatabaseZapIcon, FileUpIcon, Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AhspImportPreview, AhspImportResult } from '@/lib/ahsp-import'

type ApiResponse = {
  data?: AhspImportPreview
  error?: string
  details?: AhspImportPreview
}

type ImportApiResponse = {
  data?: {
    result: AhspImportResult | null
    preview: AhspImportPreview
  }
  error?: string
  details?: AhspImportPreview
}

export function AhspImportPreviewPanel() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<AhspImportPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
    setPreview(null)
  }

  function buildForm() {
    if (!file) {
      toast.error('Pilih file XLSX terlebih dahulu.')
      return null
    }

    const form = new FormData()
    form.append('file', file)
    return form
  }

  async function previewImport() {
    const form = buildForm()
    if (!form) return

    setLoading(true)

    let result: ApiResponse = {}
    try {
      const response = await fetch('/api/master/ahsp/import/preview', {
        method: 'POST',
        body: form,
      })
      result = await response.json().catch(() => ({})) as ApiResponse
      if (!response.ok && !result.error) result.error = 'Preview import gagal.'
    } catch (error) {
      result = { error: error instanceof Error ? error.message : 'Terjadi kesalahan koneksi.' }
    } finally {
      setLoading(false)
    }

    if (result.error || !result.data) {
      toast.error(result.error ?? 'Preview import gagal.')
      if (result.details) setPreview(result.details)
      return
    }

    setPreview(result.data)
    toast.success('Preview import AHSP selesai.')
  }

  async function runImport() {
    const form = buildForm()
    if (!form || !preview?.canImport) return
    if (!window.confirm('Import AHSP akan menulis master data dan mengganti detail AHSP untuk kode yang diimpor. Lanjutkan?')) return

    setImporting(true)

    let result: ImportApiResponse = {}
    try {
      const response = await fetch('/api/master/ahsp/import', {
        method: 'POST',
        body: form,
      })
      result = await response.json().catch(() => ({})) as ImportApiResponse
      if (!response.ok && !result.error) result.error = 'Import AHSP gagal.'
    } catch (error) {
      result = { error: error instanceof Error ? error.message : 'Terjadi kesalahan koneksi.' }
    } finally {
      setImporting(false)
    }

    if (result.error || !result.data) {
      toast.error(result.error ?? 'Import AHSP gagal.')
      if (result.details) setPreview(result.details)
      return
    }

    setPreview(result.data.preview)
    router.refresh()
    toast.success('Import AHSP berhasil.')
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Import AHSP XLSX</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Preview dulu sebelum data master ditulis ke database.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="h-9 max-w-sm bg-muted/40 text-sm"
          />
          <Button type="button" onClick={previewImport} disabled={loading}>
            {loading ? <Loader2Icon className="animate-spin" /> : <FileUpIcon />}
            Preview
          </Button>
          <Button type="button" onClick={runImport} disabled={!preview?.canImport || importing}>
            {importing ? <Loader2Icon className="animate-spin" /> : <DatabaseZapIcon />}
            Import
          </Button>
        </div>
      </div>

      {preview && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <MiniStat label="Upah" value={preview.totals.masterUpah} />
            <MiniStat label="Bahan" value={preview.totals.masterBahan} />
            <MiniStat label="Alat" value={preview.totals.masterAlat} />
            <MiniStat label="AHSP" value={preview.totals.ahspItems} />
            <MiniStat label="Detail" value={preview.totals.ahspDetails} />
          </div>

          {preview.blockers.length > 0 && (
            <ImportMessage title="Blocker" tone="rose" items={preview.blockers} />
          )}
          {preview.conflicts.length > 0 && (
            <ImportMessage title="Konflik Database" tone="rose" items={preview.conflicts} />
          )}
          {preview.warnings.length > 0 && (
            <ImportMessage title="Catatan" tone="amber" items={preview.warnings} />
          )}
          <ChangeSummary preview={preview} />
          {preview.canImport && (
            <ImportMessage title="Siap Import" tone="emerald" items={['Tidak ada blocker atau konflik database.']} />
          )}
          {preview.duplicateAhspCodes.length > 0 && (
            <ImportMessage title="Kode Duplikat" tone="rose" items={preview.duplicateAhspCodes.slice(0, 12)} />
          )}
          {preview.itemsWithoutDetails.length > 0 && (
            <ImportMessage title="AHSP Tanpa Detail" tone="amber" items={preview.itemsWithoutDetails.slice(0, 12)} />
          )}
          {preview.missingComponentReferences.length > 0 && (
            <ImportMessage
              title="Komponen Tidak Ditemukan"
              tone="rose"
              items={preview.missingComponentReferences.slice(0, 12).map((item) =>
                `${item.kodeAhsp} - ${item.jenis} - ${item.komponen}`
              )}
            />
          )}
        </div>
      )}
    </section>
  )
}

function ChangeSummary({ preview }: { preview: AhspImportPreview }) {
  const { changeSummary } = preview

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rencana Perubahan</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Satuan Baru" value={changeSummary.newSatuan} />
        <MiniStat label="Kategori Baru" value={changeSummary.newKategori} />
        <MiniStat label="Master Baru" value={changeSummary.newMasterUpah + changeSummary.newMasterBahan + changeSummary.newMasterAlat} />
        <MiniStat label="Master Update" value={changeSummary.updateMasterUpah + changeSummary.updateMasterBahan + changeSummary.updateMasterAlat} />
        <MiniStat label="AHSP Baru" value={changeSummary.newAhspItems} />
        <MiniStat label="AHSP Update" value={changeSummary.updateAhspItems} />
        <MiniStat label="Satuan Dipakai" value={changeSummary.reusedSatuan} />
        <MiniStat label="Kategori Dipakai" value={changeSummary.reusedKategori} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-foreground">{value}</p>
    </div>
  )
}

function ImportMessage({
  title,
  tone,
  items,
}: {
  title: string
  tone: 'amber' | 'emerald' | 'rose'
  items: string[]
}) {
  const toneClass = tone === 'rose'
    ? 'border-rose/25 bg-rose/10 text-rose'
    : tone === 'emerald'
      ? 'border-emerald/25 bg-emerald/10 text-emerald'
      : 'border-amber/25 bg-amber/10 text-amber'

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-wider">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-current/25 px-2 py-0.5 text-[11px] font-semibold">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
