"use client"

import { useEffect, useMemo, useState } from 'react'
import { Loader2Icon, PlusIcon, SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  AhspItemRow,
  AvailableAhspForRabResult,
  KategoriPekerjaanMasterRow,
} from '@/lib/types/ahsp'

type RabAhspPickerProps = {
  projectId: string
  initialOptions: AhspItemRow[]
  initialTotal: number
  kategoriOptions: KategoriPekerjaanMasterRow[]
  canManage: boolean
  busy: boolean
  onAdd: (ahspItemId: string) => void
}

type ApiResult = {
  error?: string
  data?: AvailableAhspForRabResult
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(value)
}

async function parseApiResponse(response: Response): Promise<ApiResult> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { error: typeof payload.error === 'string' ? payload.error : 'Request gagal.' }
  }
  return payload
}

export function RabAhspPicker({
  projectId,
  initialOptions,
  initialTotal,
  kategoriOptions,
  canManage,
  busy,
  onAdd,
}: RabAhspPickerProps) {
  const [ahspOptions, setAhspOptions] = useState(initialOptions)
  const [total, setTotal] = useState(initialTotal)
  const [selectedAhspId, setSelectedAhspId] = useState(initialOptions[0]?.id ?? '')
  const [searchQuery, setSearchQuery] = useState('')
  const [bidangFilter, setBidangFilter] = useState<'all' | 'CK' | 'SDA'>('all')
  const [kategoriFilter, setKategoriFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canManage) return

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (bidangFilter !== 'all') params.set('bidang', bidangFilter)
      if (kategoriFilter !== 'all') params.set('kategori', kategoriFilter)
      params.set('limit', '25')

      const response = await fetch(`/api/proyek/${projectId}/rab/ahsp-options?${params.toString()}`, {
        signal: controller.signal,
      }).catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return null
        throw fetchError
      })

      if (!response) return

      const result = await parseApiResponse(response)
      if (result.error || !result.data) {
        setError(result.error ?? 'Gagal memuat AHSP.')
      } else {
        const data = result.data
        setAhspOptions(data.rows)
        setTotal(data.total)
        setSelectedAhspId((current) => (
          data.rows.some((item) => item.id === current) ? current : (data.rows[0]?.id ?? '')
        ))
      }
      setLoading(false)
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [bidangFilter, canManage, kategoriFilter, projectId, searchQuery])

  const selectedAhsp = useMemo(
    () => ahspOptions.find((item) => item.id === selectedAhspId) ?? null,
    [ahspOptions, selectedAhspId]
  )
  const isBusy = busy || loading

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Struktur Dokumen RAB</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Hubungkan uraian pekerjaan dengan analisa AHSP</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Susun item sebagai dokumen RAB proyek. AHSP hanya menjadi referensi analisa yang disalin ke snapshot.
          </p>
        </div>

        <div className="grid gap-2 lg:grid-cols-[150px_220px_1fr_auto]">
          <Select value={bidangFilter} onValueChange={(value) => setBidangFilter(value as 'all' | 'CK' | 'SDA')} disabled={!canManage}>
            <SelectTrigger className="h-9 bg-muted/40">
              <SelectValue placeholder="Bidang" />
            </SelectTrigger>
            <SelectContent className="select-content">
              <SelectItem value="all" className="select-item">Semua Bidang</SelectItem>
              <SelectItem value="CK" className="select-item">CK</SelectItem>
              <SelectItem value="SDA" className="select-item">SDA</SelectItem>
            </SelectContent>
          </Select>

          <Select value={kategoriFilter} onValueChange={setKategoriFilter} disabled={!canManage || kategoriOptions.length === 0}>
            <SelectTrigger className="h-9 bg-muted/40">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent className="select-content">
              <SelectItem value="all" className="select-item">Semua Kategori</SelectItem>
              {kategoriOptions.map((kategori) => (
                <SelectItem key={kategori.id} value={kategori.id} className="select-item">
                  {kategori.nama_kategori}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              disabled={!canManage}
              className="h-9 bg-muted/40 pl-8"
              placeholder="Cari kode atau uraian AHSP"
            />
          </div>

          <Button onClick={() => selectedAhspId && onAdd(selectedAhspId)} disabled={!canManage || !selectedAhspId || isBusy}>
            {isBusy ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
            Hubungkan
          </Button>
        </div>

        <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
          <Select value={selectedAhspId} onValueChange={setSelectedAhspId} disabled={!canManage || ahspOptions.length === 0}>
            <SelectTrigger className="h-9 bg-muted/40">
              <SelectValue placeholder={ahspOptions.length > 0 ? 'Pilih analisa AHSP untuk uraian RAB' : 'Tidak ada AHSP sesuai filter'} />
            </SelectTrigger>
            <SelectContent className="select-content">
              {ahspOptions.map((item) => (
                <SelectItem key={item.id} value={item.id} className="select-item">
                  {item.bidang} / {item.kode_analisa} - {item.uraian_pekerjaan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="self-center text-right text-xs text-muted-foreground">
            {ahspOptions.length} ditampilkan dari {total} analisa tersedia
          </span>
        </div>

        {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
      </div>

      {selectedAhsp && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{selectedAhsp.bidang}</span>
          <span className="mx-2">/</span>
          <span className="font-mono text-foreground">{selectedAhsp.kode_analisa}</span>
          <span className="mx-2">/</span>
          {selectedAhsp.kategori}
          {selectedAhsp.sub_bidang && (
            <>
              <span className="mx-2">/</span>
              {selectedAhsp.sub_bidang}
            </>
          )}
          <span className="mx-2">/</span>
          Output: {selectedAhsp.satuan}
          <span className="mx-2">/</span>
          Profit default: {formatNumber(selectedAhsp.profit_persen_default)}%
        </div>
      )}
    </section>
  )
}
