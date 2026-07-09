"use client"

import { Fragment, type KeyboardEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckIcon, Loader2Icon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import type { AhspItemRow, RabMakerSnapshot } from '@/lib/types/ahsp'
import { formatRupiah } from '@/lib/utils'

type RabMakerClientProps = {
  projectId: string
  ahspOptions: AhspItemRow[]
  snapshot: RabMakerSnapshot
  canManage: boolean
}

type ApiResult = {
  error?: string
  data?: unknown
}

type ProfitOverrideDraft = {
  itemId: string
  value: string
  reason: string
}

type HargaOverrideDraft = {
  itemId: string
  detailId: string
  value: string
  reason: string
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

export function RabMakerClient({ projectId, ahspOptions, snapshot, canManage }: RabMakerClientProps) {
  const router = useRouter()
  const [selectedAhspId, setSelectedAhspId] = useState(ahspOptions[0]?.id ?? '')
  const [searchQuery, setSearchQuery] = useState('')
  const [bidangFilter, setBidangFilter] = useState<'all' | 'CK' | 'SDA'>('all')
  const [kategoriFilter, setKategoriFilter] = useState('all')
  const [volumeDrafts, setVolumeDrafts] = useState<Record<string, string>>({})
  const [profitDraft, setProfitDraft] = useState<ProfitOverrideDraft | null>(null)
  const [hargaDraft, setHargaDraft] = useState<HargaOverrideDraft | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const kategoriOptions = useMemo(
    () => Array.from(new Set(ahspOptions.map((item) => item.kategori))).sort((a, b) => a.localeCompare(b)),
    [ahspOptions]
  )

  const filteredAhspOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return ahspOptions.filter((item) => {
      const matchesBidang = bidangFilter === 'all' || item.bidang === bidangFilter
      const matchesKategori = kategoriFilter === 'all' || item.kategori === kategoriFilter
      const matchesSearch =
        !query ||
        item.kode_analisa.toLowerCase().includes(query) ||
        item.uraian_pekerjaan.toLowerCase().includes(query)

      return matchesBidang && matchesKategori && matchesSearch
    })
  }, [ahspOptions, bidangFilter, kategoriFilter, searchQuery])

  const effectiveSelectedAhspId = filteredAhspOptions.some((item) => item.id === selectedAhspId)
    ? selectedAhspId
    : (filteredAhspOptions[0]?.id ?? '')

  const selectedAhsp = useMemo(
    () => filteredAhspOptions.find((item) => item.id === effectiveSelectedAhspId) ?? null,
    [filteredAhspOptions, effectiveSelectedAhspId]
  )

  function toggleDetails(itemId: string) {
    setExpandedItemId((current) => current === itemId ? null : itemId)
  }

  function handleDetailRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, itemId: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    toggleDetails(itemId)
  }

  async function addSelectedAhsp() {
    if (!effectiveSelectedAhspId) return
    setBusyAction('add')
    const response = await fetch(`/api/proyek/${projectId}/rab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ahsp_item_id: effectiveSelectedAhspId }),
    })
    const result = await parseApiResponse(response)
    setBusyAction(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Item AHSP disalin ke RAB Maker.')
    router.refresh()
  }

  async function saveVolume(itemId: string) {
    setBusyAction(`volume:${itemId}`)
    const response = await fetch(`/api/proyek/${projectId}/rab/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: volumeDrafts[itemId] ?? '0' }),
    })
    const result = await parseApiResponse(response)
    setBusyAction(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Volume RAB disimpan.')
    router.refresh()
  }

  async function saveProfitOverride() {
    if (!profitDraft) return

    setBusyAction(`profit:${profitDraft.itemId}`)
    const response = await fetch(`/api/proyek/${projectId}/rab/${profitDraft.itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profit_persen_final: profitDraft.value,
        override_reason: profitDraft.reason,
      }),
    })
    const result = await parseApiResponse(response)
    setBusyAction(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Profit RAB disimpan.')
    setProfitDraft(null)
    router.refresh()
  }

  async function saveHargaOverride() {
    if (!hargaDraft) return

    setBusyAction(`harga:${hargaDraft.detailId}`)
    const response = await fetch(`/api/proyek/${projectId}/rab/${hargaDraft.itemId}/detail/${hargaDraft.detailId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        harga_dasar_final: hargaDraft.value,
        override_reason: hargaDraft.reason,
      }),
    })
    const result = await parseApiResponse(response)
    setBusyAction(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Harga dasar komponen disimpan.')
    setHargaDraft(null)
    router.refresh()
  }

  async function deleteItem(itemId: string) {
    const confirmed = window.confirm('Hapus item ini dari RAB Maker? Snapshot AHSP di item ini akan hilang dari RAB proyek.')
    if (!confirmed) return

    setBusyAction(`delete:${itemId}`)
    const response = await fetch(`/api/proyek/${projectId}/rab/${itemId}`, { method: 'DELETE' })
    const result = await parseApiResponse(response)
    setBusyAction(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Item RAB dihapus.')
    router.refresh()
  }

  return (
    <div className="space-y-5">
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
                  <SelectItem key={kategori} value={kategori} className="select-item">
                    {kategori}
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

            <Button onClick={addSelectedAhsp} disabled={!canManage || !effectiveSelectedAhspId || busyAction !== null}>
              {busyAction === 'add' ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
              Hubungkan
            </Button>
          </div>

          <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
            <Select value={effectiveSelectedAhspId} onValueChange={setSelectedAhspId} disabled={!canManage || filteredAhspOptions.length === 0}>
              <SelectTrigger className="h-9 bg-muted/40">
                <SelectValue placeholder={filteredAhspOptions.length > 0 ? 'Pilih analisa AHSP untuk uraian RAB' : 'Tidak ada AHSP sesuai filter'} />
              </SelectTrigger>
              <SelectContent className="select-content">
                {filteredAhspOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="select-item">
                    {item.bidang} / {item.kode_analisa} - {item.uraian_pekerjaan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="self-center text-right text-xs text-muted-foreground">
              {filteredAhspOptions.length} analisa tersedia
            </span>
          </div>
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

      <div className="rounded-xl border border-border bg-card">
        <Table className="min-w-[1320px] table-fixed">
          <TableHeader>
            <TableRow className="border-border bg-muted/40 hover:bg-transparent">
              <TableHead className="table-head w-14">No</TableHead>
              <TableHead className="table-head w-32">Kode</TableHead>
              <TableHead className="table-head">Uraian Snapshot</TableHead>
              <TableHead className="table-head w-24">Satuan</TableHead>
              <TableHead className="table-head w-36 text-right">Volume</TableHead>
              <TableHead className="table-head w-40 text-right">Harga Dasar</TableHead>
              <TableHead className="table-head w-28 text-right">Profit</TableHead>
              <TableHead className="table-head w-40 text-right">Harga Satuan</TableHead>
              <TableHead className="table-head w-40 text-right">Jumlah</TableHead>
              <TableHead className="table-head w-16 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.items.length > 0 ? (
              snapshot.items.map((item, index) => {
                const details = snapshot.detailsByItem[item.id] ?? []
                const detailsOpen = expandedItemId === item.id
                const volumeBusy = busyAction === `volume:${item.id}`
                const deleteBusy = busyAction === `delete:${item.id}`

                return (
                  <Fragment key={item.id}>
                  <TableRow
                    className={`cursor-pointer border-border hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${detailsOpen ? 'bg-muted/25' : ''}`}
                    onClick={() => toggleDetails(item.id)}
                    onKeyDown={(event) => handleDetailRowKeyDown(event, item.id)}
                    tabIndex={0}
                    aria-expanded={detailsOpen}
                    aria-label={`${detailsOpen ? 'Tutup' : 'Buka'} detail komponen ${item.uraian_pekerjaan_snapshot}`}
                    title={detailsOpen ? 'Klik untuk tutup detail' : 'Klik untuk buka detail komponen'}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{item.kode_analisa_snapshot}</TableCell>
                    <TableCell className="whitespace-normal">
                      <p className="text-sm font-semibold leading-snug text-foreground">{item.uraian_pekerjaan_snapshot}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.bidang_snapshot ?? '-'} / {item.kategori_snapshot ?? '-'}
                        {item.sub_bidang_snapshot ? ` / ${item.sub_bidang_snapshot}` : ''}
                        <span
                          className={`ml-2 rounded-full border px-1.5 py-0.5 font-mono ${
                            detailsOpen
                              ? 'border-primary/35 bg-primary/10 text-primary'
                              : 'border-border bg-muted/30'
                          }`}
                        >
                          {details.length} komponen
                        </span>
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.satuan_snapshot}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Input
                          value={volumeDrafts[item.id] ?? String(item.volume).replace('.', ',')}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            setVolumeDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                          }
                          disabled={!canManage || busyAction !== null}
                          inputMode="decimal"
                          className="h-8 w-20 bg-muted/40 text-right font-mono"
                          aria-label={`Volume ${item.uraian_pekerjaan_snapshot}`}
                        />
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            saveVolume(item.id)
                          }}
                          disabled={!canManage || busyAction !== null}
                          title="Simpan volume"
                          aria-label={`Simpan volume ${item.uraian_pekerjaan_snapshot}`}
                        >
                          {volumeBusy ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatRupiah(item.harga_dasar_total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`font-mono ${item.profit_override_reason ? 'font-semibold text-amber' : ''}`}
                          title={item.profit_override_reason ? `Alasan perubahan: ${item.profit_override_reason}` : undefined}
                        >
                          {formatNumber(item.profit_persen_final)}%
                          {item.profit_override_reason && (
                            <span
                              className="ml-1 inline-block size-1.5 rounded-full bg-amber align-middle"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          className="border-amber/25 text-amber hover:bg-amber/10"
                          disabled={!canManage || busyAction !== null}
                          title="Edit profit"
                          aria-label={`Edit profit ${item.uraian_pekerjaan_snapshot}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            setProfitDraft({
                              itemId: item.id,
                              value: String(item.profit_persen_final).replace('.', ','),
                              reason: item.profit_override_reason ?? '',
                            })
                          }}
                        >
                          <PencilIcon />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatRupiah(item.harga_satuan)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{formatRupiah(item.jumlah_harga)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            deleteItem(item.id)
                          }}
                          disabled={!canManage || busyAction !== null}
                          aria-label={`Hapus ${item.uraian_pekerjaan_snapshot}`}
                          title="Hapus item RAB"
                        >
                          {deleteBusy ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {detailsOpen && (
                    <TableRow className="border-border bg-muted/10 hover:bg-muted/10">
                      <TableCell className="py-0" />
                      <TableCell colSpan={9} className="px-3 py-3">
                        <div className="rounded-lg border border-border bg-background/60">
                          <div className="grid grid-cols-[90px_1fr_90px_150px_150px_48px] gap-2 border-b border-border bg-muted/30 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            <span>Tipe</span>
                            <span>Komponen</span>
                            <span className="text-right">Koef.</span>
                            <span className="text-right">Harga Dasar</span>
                            <span className="text-right">Jumlah</span>
                            <span className="text-right">Aksi</span>
                          </div>
                          {details.length > 0 ? (
                            details.map((detail) => (
                              <div
                                key={detail.id}
                                className="grid grid-cols-[90px_1fr_90px_150px_150px_48px] items-center gap-2 border-b border-border px-3 py-2 text-xs last:border-b-0"
                              >
                                <span className="font-mono font-semibold uppercase text-muted-foreground">{detail.komponen_tipe}</span>
                                <span className="min-w-0 truncate text-foreground">{detail.nama_komponen_snapshot}</span>
                                <span className="text-right font-mono">{formatNumber(detail.koefisien_snapshot)}</span>
                                <span
                                  className={`text-right font-mono ${detail.harga_override_reason ? 'font-semibold text-amber' : ''}`}
                                  title={detail.harga_override_reason ? `Alasan perubahan: ${detail.harga_override_reason}` : undefined}
                                >
                                  {formatRupiah(detail.harga_dasar_final)}
                                  {detail.harga_override_reason && (
                                    <span
                                      className="ml-1 inline-block size-1.5 rounded-full bg-amber align-middle"
                                      aria-hidden="true"
                                    />
                                  )}
                                </span>
                                <span className="text-right font-mono font-semibold">{formatRupiah(detail.jumlah_harga_dasar)}</span>
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-xs"
                                    className="border-amber/25 text-amber hover:bg-amber/10"
                                    disabled={!canManage || busyAction !== null}
                                    title="Edit harga dasar"
                                    aria-label={`Edit harga dasar ${detail.nama_komponen_snapshot}`}
                                    onClick={() =>
                                      setHargaDraft({
                                        itemId: item.id,
                                        detailId: detail.id,
                                        value: String(detail.harga_dasar_final).replace('.', ','),
                                        reason: detail.harga_override_reason ?? '',
                                      })
                                    }
                                  >
                                    <PencilIcon />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="px-3 py-3 text-xs text-muted-foreground">Belum ada detail snapshot.</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </Fragment>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-sm text-muted-foreground">
                  Belum ada item RAB. Pilih uraian AHSP master lalu klik Salin untuk membuat snapshot RAB proyek.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={profitDraft !== null} onOpenChange={(open) => !open && setProfitDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profit Item RAB</DialogTitle>
            <DialogDescription>
              Alasan wajib diisi kalau profit final berbeda dari profit default AHSP.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-5 py-4">
            <label className="space-y-1.5 text-sm font-medium text-foreground">
              <span>Profit Final (%)</span>
              <Input
                value={profitDraft?.value ?? ''}
                onChange={(event) => setProfitDraft((current) => current ? { ...current, value: event.target.value } : current)}
                inputMode="decimal"
                className="field-input font-mono"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-foreground">
              <span>Alasan Perubahan</span>
              <Textarea
                value={profitDraft?.reason ?? ''}
                onChange={(event) => setProfitDraft((current) => current ? { ...current, reason: event.target.value } : current)}
                className="field-input min-h-24"
                placeholder="Contoh: penyesuaian risiko lokasi atau kondisi harga lapangan."
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setProfitDraft(null)}>
              Batal
            </Button>
            <Button type="button" onClick={saveProfitOverride} disabled={!canManage || busyAction !== null}>
              {busyAction?.startsWith('profit:') ? <Loader2Icon className="animate-spin" /> : null}
              Simpan Profit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hargaDraft !== null} onOpenChange={(open) => !open && setHargaDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Harga Dasar Komponen</DialogTitle>
            <DialogDescription>
              Koefisien tetap terkunci. Sistem menghitung ulang harga satuan item setelah harga dasar disimpan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-5 py-4">
            <label className="space-y-1.5 text-sm font-medium text-foreground">
              <span>Harga Dasar Final</span>
              <Input
                value={hargaDraft?.value ?? ''}
                onChange={(event) => setHargaDraft((current) => current ? { ...current, value: event.target.value } : current)}
                inputMode="decimal"
                className="field-input font-mono"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-foreground">
              <span>Alasan Perubahan</span>
              <Textarea
                value={hargaDraft?.reason ?? ''}
                onChange={(event) => setHargaDraft((current) => current ? { ...current, reason: event.target.value } : current)}
                className="field-input min-h-24"
                placeholder="Contoh: harga pasar lokal terbaru atau jarak distribusi material."
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setHargaDraft(null)}>
              Batal
            </Button>
            <Button type="button" onClick={saveHargaOverride} disabled={!canManage || busyAction !== null}>
              {busyAction?.startsWith('harga:') ? <Loader2Icon className="animate-spin" /> : null}
              Simpan Harga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
