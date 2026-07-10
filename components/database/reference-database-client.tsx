'use client'

import { PlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { DatabaseClient } from '@/components/database/database-client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import {
  AhspDetailTable,
  AhspTable,
  formatPercent,
  HargaTable,
} from '@/components/database/reference-database-tables'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TabGroup } from '@/components/ui/tab-group'
import type {
  AhspComponentType,
  AhspDetailRow,
  AhspItemRow,
  KategoriPekerjaanMasterRow,
  MasterHargaKind,
  MasterHargaRow,
  SatuanRow,
} from '@/lib/types/ahsp'
import type { PerusahaanDetail } from '@/lib/types/perusahaan'
import type { DinasOption, ProyekDisplay } from '@/lib/types/proyek'
import { formatNumberInput, formatRupiah } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'

type MainTab = 'ahsp' | 'harga' | 'internal'

type HargaRows = Record<MasterHargaKind, MasterHargaRow[]>

type SatuanResponse = { data?: SatuanRow; error?: string }
type KategoriResponse = { data?: KategoriPekerjaanMasterRow; error?: string }

type ReferenceDraft = {
  type: 'satuan' | 'kategori'
  target: 'ahsp' | 'harga'
  value: string
}

type HargaFormState = {
  kind: MasterHargaKind
  nama: string
  satuan_id: string
  harga_dasar: string
}

type AhspFormState = {
  kode_analisa: string
  uraian_pekerjaan: string
  bidang: 'CK' | 'SDA'
  sub_bidang: string
  kategori_id: string
  satuan_id: string
  profit_persen_default: string
}

type AhspDetailFormState = {
  komponen_tipe: AhspComponentType
  komponen_id: string
  koefisien: string
}

const HARGA_KIND_LABEL: Record<MasterHargaKind, string> = {
  upah: 'Upah',
  bahan: 'Bahan',
  alat: 'Alat',
}

function emptyHargaForm(kind: MasterHargaKind): HargaFormState {
  return {
    kind,
    nama: '',
    satuan_id: '',
    harga_dasar: '',
  }
}

function emptyAhspForm(): AhspFormState {
  return {
    kode_analisa: '',
    uraian_pekerjaan: '',
    bidang: 'CK',
    sub_bidang: '',
    kategori_id: '',
    satuan_id: '',
    profit_persen_default: '0',
  }
}

function emptyAhspDetailForm(): AhspDetailFormState {
  return {
    komponen_tipe: 'upah',
    komponen_id: '',
    koefisien: '',
  }
}

async function readApiError(response: Response, fallback: string) {
  const json = await response.json().catch(() => null) as { error?: string } | null
  return json?.error ?? fallback
}

function getComponentRows(hargaRows: HargaRows, type: AhspComponentType) {
  return hargaRows[type]
}

const inputToneClass = 'bg-muted/40 focus-visible:bg-background'
const selectToneClass = 'bg-muted/40 data-[state=open]:bg-background'

function ResponsiveFormShell({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="p-0">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="max-h-[85vh] overflow-y-auto p-5">{children}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="max-h-[80vh] overflow-y-auto px-5 pb-5">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}

export function ReferenceDatabaseClient({
  ahspItems,
  ahspDetails,
  hargaRows,
  canViewInternal,
  satuanList,
  kategoriList,
  perusahaanList,
  proyekList,
  dinasList,
}: {
  ahspItems: AhspItemRow[]
  ahspDetails: AhspDetailRow[]
  hargaRows: HargaRows
  canViewInternal: boolean
  satuanList: SatuanRow[]
  kategoriList: KategoriPekerjaanMasterRow[]
  perusahaanList: PerusahaanDetail[]
  proyekList: ProyekDisplay[]
  dinasList: DinasOption[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<MainTab>('ahsp')
  const [hargaTab, setHargaTab] = useState<MasterHargaKind>('upah')
  const [hargaDialogOpen, setHargaDialogOpen] = useState(false)
  const [editingHarga, setEditingHarga] = useState<MasterHargaRow | null>(null)
  const [hargaForm, setHargaForm] = useState<HargaFormState>(() => emptyHargaForm('upah'))
  const [ahspDialogOpen, setAhspDialogOpen] = useState(false)
  const [editingAhsp, setEditingAhsp] = useState<AhspItemRow | null>(null)
  const [ahspForm, setAhspForm] = useState<AhspFormState>(() => emptyAhspForm())
  const [isSavingHarga, setIsSavingHarga] = useState(false)
  const [isSavingAhsp, setIsSavingAhsp] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedAhsp, setSelectedAhsp] = useState<AhspItemRow | null>(null)
  const [editingDetail, setEditingDetail] = useState<AhspDetailRow | null>(null)
  const [detailForm, setDetailForm] = useState<AhspDetailFormState>(() => emptyAhspDetailForm())
  const [isSavingDetail, setIsSavingDetail] = useState(false)
  const [isDeletingDetail, setIsDeletingDetail] = useState(false)
  const [satuanRows, setSatuanRows] = useState<SatuanRow[]>(satuanList)
  const [kategoriRows, setKategoriRows] = useState<KategoriPekerjaanMasterRow[]>(kategoriList)
  const [referenceDraft, setReferenceDraft] = useState<ReferenceDraft | null>(null)
  const [isSavingReference, setIsSavingReference] = useState(false)
  const canManageMaster = canViewInternal

  useEffect(() => {
    setSatuanRows(satuanList)
  }, [satuanList])

  useEffect(() => {
    setKategoriRows(kategoriList)
  }, [kategoriList])

  const detailCountByItem = ahspDetails.reduce<Record<string, number>>((acc, detail) => {
    acc[detail.ahsp_item_id] = (acc[detail.ahsp_item_id] ?? 0) + 1
    return acc
  }, {})
  const selectedDetails = selectedAhsp
    ? ahspDetails.filter((detail) => detail.ahsp_item_id === selectedAhsp.id)
    : []
  const selectedSubtotal = selectedDetails.reduce((total, detail) => total + detail.jumlah_harga_dasar, 0)
  const selectedProfit = selectedSubtotal * ((selectedAhsp?.profit_persen_default ?? 0) / 100)
  const selectedTotal = selectedSubtotal + selectedProfit

  const tabs: { label: string; value: MainTab }[] = [
    { label: 'AHSP', value: 'ahsp' },
    { label: 'Harga', value: 'harga' },
    ...(canViewInternal ? [{ label: 'Database Internal', value: 'internal' as const }] : []),
  ]

  const openCreateHarga = () => {
    setEditingHarga(null)
    setHargaForm(emptyHargaForm(hargaTab))
    setHargaDialogOpen(true)
  }

  const openEditHarga = (row: MasterHargaRow) => {
    setEditingHarga(row)
    setHargaForm({
      kind: row.kind,
      nama: row.nama,
      satuan_id: row.satuan_id,
      harga_dasar: formatNumberInput(row.harga_dasar),
    })
    setHargaDialogOpen(true)
  }

  const openCreateAhsp = () => {
    setEditingAhsp(null)
    setAhspForm(emptyAhspForm())
    setAhspDialogOpen(true)
  }

  const openEditAhsp = (row: AhspItemRow) => {
    setEditingAhsp(row)
    setAhspForm({
      kode_analisa: row.kode_analisa,
      uraian_pekerjaan: row.uraian_pekerjaan,
      bidang: row.bidang,
      sub_bidang: row.sub_bidang ?? '',
      kategori_id: row.kategori_id,
      satuan_id: row.satuan_id,
      profit_persen_default: String(row.profit_persen_default).replace('.', ','),
    })
    setAhspDialogOpen(true)
  }

  const openDetailDialog = (row: AhspItemRow) => {
    setSelectedAhsp(row)
    setEditingDetail(null)
    setDetailForm(emptyAhspDetailForm())
    setDetailDialogOpen(true)
  }

  const openCreateDetail = () => {
    setEditingDetail(null)
    setDetailForm(emptyAhspDetailForm())
  }

  const openEditDetail = (row: AhspDetailRow) => {
    setEditingDetail(row)
    setDetailForm({
      komponen_tipe: row.komponen_tipe,
      komponen_id: row.komponen_id,
      koefisien: String(row.koefisien).replace('.', ','),
    })
  }

  const submitReference = async () => {
    if (!referenceDraft) return
    const trimmed = referenceDraft.value.trim()
    if (!trimmed) return

    setIsSavingReference(true)
    const response = await fetch(referenceDraft.type === 'satuan' ? '/api/master/satuan' : '/api/master/kategori', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(referenceDraft.type === 'satuan' ? { nama_satuan: trimmed } : { nama_kategori: trimmed }),
    })
    setIsSavingReference(false)

    if (!response.ok) {
      toast.error(await readApiError(response, 'Gagal menambah referensi.'))
      return
    }

    const json = await response.json() as SatuanResponse | KategoriResponse
    if (!json.data) return

    if (referenceDraft.type === 'satuan') {
      const row = json.data as SatuanRow
      setSatuanRows((current) => [...current, row].sort((a, b) => a.nama_satuan.localeCompare(b.nama_satuan)))
      if (referenceDraft.target === 'harga') {
        setHargaForm((current) => ({ ...current, satuan_id: row.id }))
      } else {
        setAhspForm((current) => ({ ...current, satuan_id: row.id }))
      }
      toast.success('Satuan berhasil ditambahkan.')
    } else {
      const row = json.data as KategoriPekerjaanMasterRow
      setKategoriRows((current) => [...current, row].sort((a, b) => a.nama_kategori.localeCompare(b.nama_kategori)))
      setAhspForm((current) => ({ ...current, kategori_id: row.id }))
      toast.success('Kategori berhasil ditambahkan.')
    }

    setReferenceDraft(null)
    router.refresh()
  }

  const submitHarga = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSavingHarga(true)

    const response = await fetch(editingHarga ? `/api/master/harga/${editingHarga.id}` : '/api/master/harga', {
      method: editingHarga ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hargaForm),
    })

    setIsSavingHarga(false)

    if (!response.ok) {
      toast.error(await readApiError(response, 'Gagal menyimpan harga.'))
      return
    }

    toast.success(editingHarga ? 'Harga berhasil diperbarui.' : 'Harga berhasil ditambahkan.')
    setHargaDialogOpen(false)
    router.refresh()
  }

  const submitAhsp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSavingAhsp(true)

    const response = await fetch(editingAhsp ? `/api/master/ahsp/${editingAhsp.id}` : '/api/master/ahsp', {
      method: editingAhsp ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ahspForm),
    })

    setIsSavingAhsp(false)

    if (!response.ok) {
      toast.error(await readApiError(response, 'Gagal menyimpan AHSP.'))
      return
    }

    toast.success(editingAhsp ? 'AHSP berhasil diperbarui.' : 'AHSP berhasil ditambahkan.')
    setAhspDialogOpen(false)
    router.refresh()
  }

  const submitDetail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAhsp) return

    setIsSavingDetail(true)
    const response = await fetch(
      editingDetail
        ? `/api/master/ahsp/${selectedAhsp.id}/detail/${editingDetail.id}`
        : `/api/master/ahsp/${selectedAhsp.id}/detail`,
      {
        method: editingDetail ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detailForm),
      }
    )

    setIsSavingDetail(false)

    if (!response.ok) {
      toast.error(await readApiError(response, 'Gagal menyimpan detail AHSP.'))
      return
    }

    toast.success(editingDetail ? 'Detail AHSP berhasil diperbarui.' : 'Detail AHSP berhasil ditambahkan.')
    setEditingDetail(null)
    setDetailForm(emptyAhspDetailForm())
    router.refresh()
  }

  const deleteDetail = async (row: AhspDetailRow) => {
    if (!selectedAhsp) return
    if (!window.confirm(`Hapus komponen "${row.nama_komponen}" dari AHSP ini?`)) return

    setIsDeletingDetail(true)
    const response = await fetch(`/api/master/ahsp/${selectedAhsp.id}/detail/${row.id}`, {
      method: 'DELETE',
    })
    setIsDeletingDetail(false)

    if (!response.ok) {
      toast.error(await readApiError(response, 'Gagal menghapus detail AHSP.'))
      return
    }

    toast.success('Detail AHSP berhasil dihapus.')
    if (editingDetail?.id === row.id) {
      setEditingDetail(null)
      setDetailForm(emptyAhspDetailForm())
    }
    router.refresh()
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Referensi"
          title="Database"
          description="Pusat referensi untuk AHSP, harga dasar, dan database internal. Master kecil digabung agar navigasi tidak tersebar."
        actions={
          <TabGroup
            value={tab}
            onChange={setTab}
            tabs={tabs}
            className="w-fit rounded-xl bg-card p-1"
            buttonClassName="px-5 py-2.5 text-sm"
          />
        }
      />

      {tab === 'ahsp' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="stat-card">
                <p className="stat-label">Item AHSP</p>
                <p className="stat-value">{ahspItems.length}</p>
              </div>
            </div>
            {canManageMaster && (
              <Button type="button" onClick={openCreateAhsp}>
                <PlusIcon />
                Tambah AHSP
              </Button>
            )}
          </div>
          <AhspTable
            rows={ahspItems}
            canManage={canManageMaster}
            detailCountByItem={detailCountByItem}
            onOpenDetail={openDetailDialog}
            onEdit={openEditAhsp}
          />
        </div>
      )}

      {tab === 'harga' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Harga Dasar</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Berisi harga upah, bahan, dan alat sebagai default Masterfile AHSP.
              </p>
            </div>
            <TabGroup
              value={hargaTab}
              onChange={setHargaTab}
              tabs={[
                { label: 'Upah', value: 'upah' },
                { label: 'Bahan', value: 'bahan' },
                { label: 'Alat', value: 'alat' },
              ]}
              className="w-fit rounded-xl bg-card p-1"
              buttonClassName="px-5 py-2.5 text-sm"
            />
            {canManageMaster && (
              <Button type="button" onClick={openCreateHarga}>
                <PlusIcon />
                Tambah Harga
              </Button>
            )}
          </div>
          <HargaTable rows={hargaRows[hargaTab]} canManage={canManageMaster} onEdit={openEditHarga} />
        </div>
      )}

      {tab === 'internal' && canViewInternal && (
        <DatabaseClient
          perusahaanList={perusahaanList}
          proyekList={proyekList}
          dinasList={dinasList}
          showHeading={false}
        />
      )}

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail AHSP</DialogTitle>
            <DialogDescription>
              {selectedAhsp
                ? `${selectedAhsp.kode_analisa} - ${selectedAhsp.uraian_pekerjaan}`
                : 'Detail komponen upah, bahan, alat, dan koefisien.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="stat-card">
                <p className="stat-label">Subtotal Harga Dasar</p>
                <p className="stat-value text-lg">{formatRupiah(selectedSubtotal)}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Profit Default</p>
                <p className="stat-value text-lg">
                  {formatPercent(selectedAhsp?.profit_persen_default ?? 0)}
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Total Masterfile</p>
                <p className="stat-value text-lg">{formatRupiah(selectedTotal)}</p>
              </div>
            </div>

            {canManageMaster && selectedAhsp && (
              <form onSubmit={submitDetail} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="grid gap-3 lg:grid-cols-[160px_1fr_160px_auto] lg:items-end">
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Tipe</span>
                    <Select
                      value={detailForm.komponen_tipe}
                      onValueChange={(value) => setDetailForm((current) => ({
                        ...current,
                        komponen_tipe: value as AhspComponentType,
                        komponen_id: '',
                      }))}
                    >
                      <SelectTrigger className={selectToneClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upah">Upah</SelectItem>
                        <SelectItem value="bahan">Bahan</SelectItem>
                        <SelectItem value="alat">Alat</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Komponen</span>
                    <Select
                      value={detailForm.komponen_id}
                      onValueChange={(value) => setDetailForm((current) => ({ ...current, komponen_id: value }))}
                    >
                      <SelectTrigger className={selectToneClass}>
                        <SelectValue placeholder={`Pilih ${HARGA_KIND_LABEL[detailForm.komponen_tipe]}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getComponentRows(hargaRows, detailForm.komponen_tipe).map((row) => (
                          <SelectItem key={row.id} value={row.id}>
                            {row.nama} - {row.satuan} - {formatRupiah(row.harga_dasar)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Koefisien</span>
                    <Input
                      className={inputToneClass}
                      inputMode="decimal"
                      value={detailForm.koefisien}
                      onChange={(event) => setDetailForm((current) => ({
                        ...current,
                        koefisien: event.target.value,
                      }))}
                      placeholder="0,0000"
                    />
                  </label>
                  <div className="flex gap-2">
                    {editingDetail && (
                      <Button type="button" variant="outline" onClick={openCreateDetail}>
                        Batal Edit
                      </Button>
                    )}
                    <Button type="submit" disabled={isSavingDetail}>
                      {isSavingDetail ? 'Menyimpan...' : editingDetail ? 'Update' : 'Tambah'}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            <AhspDetailTable
              rows={selectedDetails}
              canManage={canManageMaster}
              onEdit={openEditDetail}
              onDelete={deleteDetail}
            />
            {isDeletingDetail && <p className="text-xs text-muted-foreground">Menghapus detail...</p>}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            <Button type="button" variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ResponsiveFormShell
        open={hargaDialogOpen}
        title={editingHarga ? 'Edit Harga Dasar' : 'Tambah Harga Dasar'}
        description="Harga ini menjadi default Masterfile AHSP. Nilai RAB nanti memakai salinan snapshot."
        onClose={() => setHargaDialogOpen(false)}
      >
          <form onSubmit={submitHarga}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Jenis</span>
                <Select
                  value={hargaForm.kind}
                  onValueChange={(value) => setHargaForm((current) => ({ ...current, kind: value as MasterHargaKind }))}
                  disabled={Boolean(editingHarga)}
                >
                  <SelectTrigger className={selectToneClass}>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upah">Upah</SelectItem>
                    <SelectItem value="bahan">Bahan</SelectItem>
                    <SelectItem value="alat">Alat</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Satuan</span>
                <Select
                  value={hargaForm.satuan_id}
                  onValueChange={(value) => setHargaForm((current) => ({ ...current, satuan_id: value }))}
                >
                  <SelectTrigger className={selectToneClass}>
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {satuanRows.map((satuan) => (
                      <SelectItem key={satuan.id} value={satuan.id}>
                        {satuan.nama_satuan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setReferenceDraft({ type: 'satuan', target: 'harga', value: '' })}
                >
                  <PlusIcon />
                  Tambah Satuan
                </Button>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground sm:col-span-2">
                <span>Nama {HARGA_KIND_LABEL[hargaForm.kind]}</span>
                <Input
                  className={inputToneClass}
                  value={hargaForm.nama}
                  onChange={(event) => setHargaForm((current) => ({ ...current, nama: event.target.value }))}
                  placeholder="Contoh: Pekerja, Semen Portland, Excavator"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground sm:col-span-2">
                <span>Harga Dasar</span>
                <Input
                  className={inputToneClass}
                  inputMode="numeric"
                  value={hargaForm.harga_dasar}
                  onChange={(event) => setHargaForm((current) => ({
                    ...current,
                    harga_dasar: formatNumberInput(event.target.value),
                  }))}
                  placeholder="0"
                />
              </label>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setHargaDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSavingHarga}>
                {isSavingHarga ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
      </ResponsiveFormShell>

      <ResponsiveFormShell
        open={ahspDialogOpen}
        title={editingAhsp ? 'Edit AHSP' : 'Tambah AHSP'}
        description="Ini header Masterfile AHSP. Detail komponen dan koefisien dikelola dari tombol Detail."
        onClose={() => setAhspDialogOpen(false)}
      >
          <form onSubmit={submitAhsp}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Kode Analisa</span>
                <Input
                  className={inputToneClass}
                  value={ahspForm.kode_analisa}
                  onChange={(event) => setAhspForm((current) => ({ ...current, kode_analisa: event.target.value }))}
                  placeholder="Contoh: A.1.1"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Profit Default (%)</span>
                <Input
                  className={inputToneClass}
                  inputMode="decimal"
                  value={ahspForm.profit_persen_default}
                  onChange={(event) => setAhspForm((current) => ({
                    ...current,
                    profit_persen_default: event.target.value,
                  }))}
                  placeholder="0"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Bidang</span>
                <Select
                  value={ahspForm.bidang}
                  onValueChange={(value) => setAhspForm((current) => ({
                    ...current,
                    bidang: value === 'SDA' ? 'SDA' : 'CK',
                  }))}
                >
                  <SelectTrigger className={selectToneClass}>
                    <SelectValue placeholder="Pilih bidang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CK">CK</SelectItem>
                    <SelectItem value="SDA">SDA</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Sub Bidang</span>
                <Input
                  className={inputToneClass}
                  value={ahspForm.sub_bidang}
                  onChange={(event) => setAhspForm((current) => ({
                    ...current,
                    sub_bidang: event.target.value,
                  }))}
                  placeholder="Opsional"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Kategori</span>
                <Select
                  value={ahspForm.kategori_id}
                  onValueChange={(value) => setAhspForm((current) => ({ ...current, kategori_id: value }))}
                >
                  <SelectTrigger className={selectToneClass}>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {kategoriRows.map((kategori) => (
                      <SelectItem key={kategori.id} value={kategori.id}>
                        {kategori.nama_kategori}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setReferenceDraft({ type: 'kategori', target: 'ahsp', value: '' })}
                >
                  <PlusIcon />
                  Tambah Kategori
                </Button>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Satuan Output</span>
                <Select
                  value={ahspForm.satuan_id}
                  onValueChange={(value) => setAhspForm((current) => ({ ...current, satuan_id: value }))}
                >
                  <SelectTrigger className={selectToneClass}>
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {satuanRows.map((satuan) => (
                      <SelectItem key={satuan.id} value={satuan.id}>
                        {satuan.nama_satuan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setReferenceDraft({ type: 'satuan', target: 'ahsp', value: '' })}
                >
                  <PlusIcon />
                  Tambah Satuan
                </Button>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-foreground sm:col-span-2">
                <span>Uraian Pekerjaan</span>
                <Input
                  className={inputToneClass}
                  value={ahspForm.uraian_pekerjaan}
                  onChange={(event) => setAhspForm((current) => ({
                    ...current,
                    uraian_pekerjaan: event.target.value,
                  }))}
                  placeholder="Contoh: Galian tanah biasa"
                />
              </label>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAhspDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSavingAhsp}>
                {isSavingAhsp ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
      </ResponsiveFormShell>

      <ResponsiveFormShell
        open={referenceDraft !== null}
        title={referenceDraft?.type === 'kategori' ? 'Tambah Kategori' : 'Tambah Satuan'}
        description="Tambahkan referensi kecil dan langsung pilih di form aktif."
        onClose={() => setReferenceDraft(null)}
      >
        <div className="section-card">
          <div className="section-header">
            <p className="section-title">{referenceDraft?.type === 'kategori' ? 'Kategori AHSP' : 'Satuan'}</p>
          </div>
          <div className="section-body space-y-4">
            <label className="space-y-1.5 text-sm font-medium text-foreground">
              <span>Nama {referenceDraft?.type === 'kategori' ? 'Kategori' : 'Satuan'}</span>
              <Input
                value={referenceDraft?.value ?? ''}
                onChange={(event) => setReferenceDraft((current) => current ? { ...current, value: event.target.value } : current)}
                placeholder={referenceDraft?.type === 'kategori' ? 'Contoh: Pekerjaan Tanah' : 'Contoh: m3'}
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setReferenceDraft(null)}>
                Batal
              </Button>
              <Button type="button" onClick={submitReference} disabled={isSavingReference || !referenceDraft?.value.trim()}>
                {isSavingReference ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      </ResponsiveFormShell>
    </div>
  )
}
