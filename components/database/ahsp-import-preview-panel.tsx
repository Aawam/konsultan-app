'use client'

import { useState, type ChangeEvent } from 'react'
import { FileUpIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AhspImportPreview } from '@/lib/ahsp-import'

type ApiResponse = {
  data?: AhspImportPreview
  error?: string
}

export function AhspImportPreviewPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<AhspImportPreview | null>(null)
  const [loading, setLoading] = useState(false)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
    setPreview(null)
  }

  async function previewImport() {
    if (!file) {
      toast.error('Pilih file XLSX terlebih dahulu.')
      return
    }

    setLoading(true)
    const form = new FormData()
    form.append('file', file)

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
      return
    }

    setPreview(result.data)
    toast.success('Preview import AHSP selesai.')
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
          {preview.warnings.length > 0 && (
            <ImportMessage title="Catatan" tone="amber" items={preview.warnings} />
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
  tone: 'amber' | 'rose'
  items: string[]
}) {
  const toneClass = tone === 'rose'
    ? 'border-rose/25 bg-rose/10 text-rose'
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
