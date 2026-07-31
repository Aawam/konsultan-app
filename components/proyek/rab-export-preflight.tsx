'use client'

import { useState } from 'react'
import { AlertTriangleIcon, CheckCircle2Icon, DownloadIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { parseRabExportPreview, type RabExportPreview } from '@/lib/rab-export-preview'

type RabExportPreflightProps = {
  projectId: string
}

type PreflightState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; preview: RabExportPreview }
  | { status: 'error'; message: string }

function PreviewSummary({ preview }: { preview: RabExportPreview }) {
  const isReady = preview.canExport

  return (
    <div className="space-y-4 px-5 py-4">
      <div className={`flex items-start gap-3 rounded-lg border px-3 py-3 ${isReady ? 'border-emerald/30 bg-emerald/10' : 'border-destructive/30 bg-destructive/10'}`}>
        {isReady ? (
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald" aria-hidden="true" />
        ) : (
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        )}
        <div>
          <p className={`text-sm font-semibold ${isReady ? 'text-emerald' : 'text-destructive'}`}>
            {isReady ? 'RAB siap diexport.' : 'Export diblokir sampai data diperbaiki.'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {isReady
              ? 'Formula RAB, AHSP, dan total snapshot telah konsisten.'
              : 'Perbaiki masalah berikut pada item RAB atau detail AHSP, kemudian cek kembali.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/25 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Item RAB</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{preview.itemCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/25 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kategori AHSP</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{preview.categoryCount}</p>
        </div>
      </div>

      {preview.issues.length > 0 && (
        <div className="rounded-lg border border-destructive/25">
          <p className="border-b border-destructive/20 px-3 py-2 text-xs font-semibold text-destructive">Masalah yang perlu diperbaiki</p>
          <ul className="divide-y divide-border">
            {preview.issues.map((issue, index) => (
              <li key={`${issue.code}:${issue.itemId ?? index}`} className="px-3 py-2.5 text-sm leading-snug text-foreground">
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sheet yang akan dibuat</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {preview.sheetNames.map((sheetName) => (
            <span key={sheetName} className="rounded-md border border-border bg-muted/25 px-2 py-1 text-xs font-medium text-foreground">
              {sheetName}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RabExportPreflight({ projectId }: RabExportPreflightProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<PreflightState>({ status: 'idle' })

  async function loadPreview() {
    setState({ status: 'loading' })
    const response = await fetch(`/api/proyek/${projectId}/rab/export/preview`, { cache: 'no-store' })
    const payload = await response.json().catch(() => null)
    const preview = response.ok && payload && typeof payload === 'object'
      ? parseRabExportPreview((payload as { data?: unknown }).data)
      : null

    if (!preview) {
      const message = payload && typeof payload === 'object' && typeof (payload as { error?: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : 'Preview export tidak dapat dimuat.'
      setState({ status: 'error', message })
      return
    }

    setState({ status: 'ready', preview })
  }

  function openPreflight() {
    setOpen(true)
    void loadPreview()
  }

  function downloadXlsx() {
    window.location.assign(`/api/proyek/${projectId}/rab/export`)
  }

  return (
    <>
      <Button type="button" onClick={openPreflight}>
        <DownloadIcon />
        Export XLSX
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Periksa Export RAB</DialogTitle>
            <DialogDescription>
              Export Excel hanya dapat dilanjutkan setelah snapshot RAB dan detail AHSP konsisten.
            </DialogDescription>
          </DialogHeader>

          {state.status === 'idle' || state.status === 'loading' ? (
            <div className="flex min-h-44 items-center justify-center gap-2 px-5 py-8 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
              Memeriksa data RAB...
            </div>
          ) : null}

          {state.status === 'error' ? (
            <div className="space-y-4 px-5 py-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
                {state.message}
              </div>
              <Button type="button" variant="outline" onClick={() => void loadPreview()}>
                <RefreshCwIcon />
                Coba Lagi
              </Button>
            </div>
          ) : null}

          {state.status === 'ready' ? <PreviewSummary preview={state.preview} /> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Tutup
            </Button>
            <Button
              type="button"
              onClick={downloadXlsx}
              disabled={state.status !== 'ready' || !state.preview.canExport}
            >
              <DownloadIcon />
              Download XLSX
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
