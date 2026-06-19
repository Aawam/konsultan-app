'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  FASE_PERENCANAAN,
  FASE_PENGAWASAN,
  KATEGORI_PEKERJAAN,
} from '@/lib/constants/proyek'
import type { DinasOption, Perusahaan, ProyekFormData } from '@/lib/types/proyek'
import { formatNumberInput, formatRupiah, formatTanggal, parseNumberInput } from '@/lib/utils'

type Props = {
  perusahaanList: Perusahaan[]
  dinasList: DinasOption[]
  initialData: ProyekFormData
  metadata?: {
    createdAt?: string | null
    updatedAt?: string | null
  }
}

type SectionKey = 'identitas' | 'anggaran' | 'pemberi' | 'pelaksanaan'

const SECTION_LABEL: Record<SectionKey, string> = {
  identitas: 'Identitas Proyek',
  anggaran: 'Anggaran',
  pemberi: 'Pemberi Kerja',
  pelaksanaan: 'Pelaksanaan',
}

const NEW_DINAS_VALUE = '__new__'

function getDefaultValues(initialData: ProyekFormData): ProyekFormData {
  return {
    ...initialData,
    nomor_kontrak: initialData.nomor_kontrak ?? '',
    nama_ppk: initialData.nama_ppk ?? '',
    pagu_dana: formatNumberInput(initialData.pagu_dana ?? ''),
    hps: formatNumberInput(initialData.hps ?? ''),
    nilai_penawaran: formatNumberInput(initialData.nilai_penawaran ?? ''),
    tanggal_mulai: initialData.tanggal_mulai ?? '',
    tanggal_selesai: initialData.tanggal_selesai ?? '',
    durasi_hari: initialData.durasi_hari ?? '',
    tahap_progress: initialData.tahap_progress ?? '',
    catatan: initialData.catatan ?? '',
  }
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return Date.UTC(year, month - 1, day)
}

function getDurasiHari(tanggalMulai: string, tanggalSelesai: string) {
  const mulai = parseDateInput(tanggalMulai)
  const selesai = parseDateInput(tanggalSelesai)
  if (mulai === null || selesai === null || selesai <= mulai) return null
  return Math.round((selesai - mulai) / 86400000)
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-foreground">{value || 'Belum diisi'}</p>
    </div>
  )
}

function SectionCard({
  title,
  active,
  onEdit,
  children,
}: {
  title: string
  active?: boolean
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <section
      className={[
        'rounded-2xl border bg-card p-5 transition-colors',
        active ? 'border-primary bg-primary/10' : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <Button type="button" variant="outline" onClick={onEdit}>
          Ubah
        </Button>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  )
}

export function FormEditProyek({ perusahaanList, dinasList, initialData, metadata }: Props) {
  const router = useRouter()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [durasiManuallyEdited, setDurasiManuallyEdited] = useState(false)
  const [isCustomDinas, setIsCustomDinas] = useState(() => {
    const initialDinas = initialData.dinas?.trim()
    if (!initialDinas) return false
    return !dinasList.some((item) => item.dinas.trim() === initialDinas)
  })

  const form = useForm<ProyekFormData>({
    defaultValues: getDefaultValues(initialData),
  })

  const { control, getValues, register, setValue } = form

  const [
    namaProyek = '',
    jenisPekerjaan = '',
    kategoriPekerjaan = '',
    nomorKontrak = '',
    paketInduk = '',
    tahunAnggaran,
    sumberDana = '',
    paguDana = '',
    hps = '',
    nilaiPenawaran = '',
    dinas = '',
    lokasiKecamatan = '',
    namaPpk = '',
    perusahaanId = '',
    statusProyek = '',
    tanggalMulai = '',
    tanggalSelesai = '',
    durasiHari = '',
    tahapProgress = '',
    catatan = '',
  ] = useWatch({
    control,
    name: [
      'nama_proyek',
      'jenis_pekerjaan',
      'kategori_pekerjaan',
      'nomor_kontrak',
      'paket_pekerjaan_induk',
      'tahun_anggaran',
      'sumber_dana',
      'pagu_dana',
      'hps',
      'nilai_penawaran',
      'dinas',
      'lokasi_kecamatan',
      'nama_ppk',
      'perusahaan_id',
      'status_proyek',
      'tanggal_mulai',
      'tanggal_selesai',
      'durasi_hari',
      'tahap_progress',
      'catatan',
    ],
  })

  const baseDinasList = useMemo(
    () =>
      [...new Set(dinasList.map((item) => item.dinas.trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [dinasList]
  )

  const normalizedDinasList = useMemo(() => {
    const values = new Set(baseDinasList)
    if (dinas.trim()) values.add(dinas.trim())
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [baseDinasList, dinas])

  const faseList =
    jenisPekerjaan === 'Perencanaan'
      ? FASE_PERENCANAAN
      : jenisPekerjaan === 'Pengawasan'
        ? FASE_PENGAWASAN
        : []

  const namaPerusahaan =
    perusahaanList.find((perusahaan) => perusahaan.id === perusahaanId)?.nama_perusahaan ?? 'Belum dipilih'

  const validateSection = (section: SectionKey) => {
    const values = getValues()
    if (section === 'identitas') {
      if (!values.nama_proyek?.trim() || !values.paket_pekerjaan_induk?.trim() || !values.jenis_pekerjaan || !values.kategori_pekerjaan) {
        return 'Nama, paket induk, jenis, dan kategori wajib diisi.'
      }
    }
    if (section === 'anggaran') {
      if (!values.tahun_anggaran || !values.sumber_dana || parseNumberInput(values.pagu_dana) <= 0) {
        return 'Tahun, sumber dana, dan pagu dana wajib diisi.'
      }
      if (values.hps && parseNumberInput(values.hps) > parseNumberInput(values.pagu_dana)) {
        return 'HPS melebihi Pagu Dana.'
      }
      if (values.nilai_penawaran && values.hps && parseNumberInput(values.nilai_penawaran) > parseNumberInput(values.hps)) {
        return 'Nilai penawaran melebihi HPS.'
      }
    }
    if (section === 'pemberi') {
      if (!values.dinas?.trim() || !values.lokasi_kecamatan?.trim()) {
        return 'Dinas dan lokasi kecamatan wajib diisi.'
      }
    }
    if (section === 'pelaksanaan') {
      if (!values.perusahaan_id || !values.status_proyek) {
        return 'Perusahaan bendera dan status bendera wajib dipilih.'
      }
      if (values.tanggal_mulai && values.tanggal_selesai && values.tanggal_selesai <= values.tanggal_mulai) {
        return 'Tanggal selesai harus setelah tanggal mulai.'
      }
    }
    return null
  }

  const submitSection = async (section: SectionKey) => {
    const message = validateSection(section)
    if (message) {
      toast.error(message)
      return
    }

    setIsSubmitting(true)
    const values = getValues()
    const res = await fetch(`/api/proyek/${initialData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const json = (await res.json()) as { error?: string }
    setIsSubmitting(false)

    if (!res.ok || json.error) {
      toast.error(`Gagal menyimpan: ${json.error ?? 'Terjadi kesalahan'}`)
      return
    }

    toast.success(`${SECTION_LABEL[section]} berhasil disimpan`)
    setActiveSection(null)
    router.refresh()
  }

  const handleMoneyChange = (field: 'pagu_dana' | 'hps' | 'nilai_penawaran', value: string) => {
    setValue(field, formatNumberInput(value), { shouldDirty: true })
  }

  const updateTanggalField = (field: 'tanggal_mulai' | 'tanggal_selesai', value: string) => {
    setValue(field, value, { shouldDirty: true })
    if (durasiManuallyEdited) return

    const nextMulai = field === 'tanggal_mulai' ? value : tanggalMulai
    const nextSelesai = field === 'tanggal_selesai' ? value : tanggalSelesai
    const durasiOtomatis = nextMulai && nextSelesai ? getDurasiHari(nextMulai, nextSelesai) : null
    setValue('durasi_hari', durasiOtomatis ? String(durasiOtomatis) : '', { shouldDirty: true })
  }

  const fi = 'field-input'

  const sectionForm = activeSection ? (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {activeSection === 'identitas' && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit_nama_proyek">Nama Proyek *</FieldLabel>
              <Input id="edit_nama_proyek" className={fi} {...register('nama_proyek')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_paket_induk">Paket Pekerjaan Induk *</FieldLabel>
              <Input id="edit_paket_induk" className={fi} {...register('paket_pekerjaan_induk')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_nomor_kontrak">Nomor Kontrak</FieldLabel>
              <Input id="edit_nomor_kontrak" className={fi} {...register('nomor_kontrak')} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Jenis Pekerjaan *</FieldLabel>
                <Controller
                  control={control}
                  name="jenis_pekerjaan"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className={fi}>
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent className="select-content">
                        <SelectItem value="Perencanaan" className="select-item">Perencanaan</SelectItem>
                        <SelectItem value="Pengawasan" className="select-item">Pengawasan</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel>Kategori *</FieldLabel>
                <Controller
                  control={control}
                  name="kategori_pekerjaan"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className={fi}>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent className="select-content">
                        {KATEGORI_PEKERJAAN.map((kategori) => (
                          <SelectItem key={kategori} value={kategori} className="select-item">
                            {kategori}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
          </FieldGroup>
        )}

        {activeSection === 'anggaran' && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit_tahun_anggaran">Tahun Anggaran *</FieldLabel>
              <Input
                id="edit_tahun_anggaran"
                className={fi}
                type="number"
                {...register('tahun_anggaran', { valueAsNumber: true })}
              />
            </Field>
            <Field>
              <FieldLabel>Sumber Dana *</FieldLabel>
              <Controller
                control={control}
                name="sumber_dana"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={fi}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      <SelectItem value="APBD" className="select-item">APBD</SelectItem>
                      <SelectItem value="APBD-Perubahan" className="select-item">APBD-Perubahan</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_pagu_dana">Pagu Dana *</FieldLabel>
              <Input
                id="edit_pagu_dana"
                className={fi}
                inputMode="numeric"
                value={paguDana}
                onChange={(event) => handleMoneyChange('pagu_dana', event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_hps">HPS</FieldLabel>
              <Input
                id="edit_hps"
                className={fi}
                inputMode="numeric"
                value={hps}
                onChange={(event) => handleMoneyChange('hps', event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_nilai_penawaran">Nilai Penawaran / Kontrak</FieldLabel>
              <Input
                id="edit_nilai_penawaran"
                className={fi}
                inputMode="numeric"
                value={nilaiPenawaran}
                onChange={(event) => handleMoneyChange('nilai_penawaran', event.target.value)}
              />
            </Field>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-bold text-primary">Validasi Anggaran</p>
              <p className="mt-1 text-sm text-primary">
                {parseNumberInput(nilaiPenawaran) <= parseNumberInput(paguDana)
                  ? 'Nilai kontrak lebih kecil dari pagu. Data aman disimpan.'
                  : 'Nilai kontrak lebih besar dari pagu. Periksa kembali sebelum simpan.'}
              </p>
            </div>
          </FieldGroup>
        )}

        {activeSection === 'pemberi' && (
          <FieldGroup>
            <Field>
              <FieldLabel>Dinas / SKPD *</FieldLabel>
              <Controller
                control={control}
                name="dinas"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Select
                      value={isCustomDinas ? NEW_DINAS_VALUE : field.value || undefined}
                      onValueChange={(value) => {
                        if (value === NEW_DINAS_VALUE) {
                          setIsCustomDinas(true)
                          if (normalizedDinasList.includes(field.value ?? '')) field.onChange('')
                          return
                        }
                        setIsCustomDinas(false)
                        field.onChange(value)
                      }}
                    >
                      <SelectTrigger className={fi}>
                        <SelectValue placeholder="Pilih dinas" />
                      </SelectTrigger>
                      <SelectContent className="select-content">
                        {normalizedDinasList.map((namaDinas) => (
                          <SelectItem key={namaDinas} value={namaDinas} className="select-item">
                            {namaDinas}
                          </SelectItem>
                        ))}
                        <SelectItem value={NEW_DINAS_VALUE} className="select-item">
                          + Tambah dinas baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {isCustomDinas && (
                      <Input className={fi} value={field.value} onChange={field.onChange} />
                    )}
                  </div>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_lokasi">Lokasi Kecamatan *</FieldLabel>
              <Input id="edit_lokasi" className={fi} {...register('lokasi_kecamatan')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_nama_ppk">Nama PPK</FieldLabel>
              <Input id="edit_nama_ppk" className={fi} {...register('nama_ppk')} />
            </Field>
          </FieldGroup>
        )}

        {activeSection === 'pelaksanaan' && (
          <FieldGroup>
            <Field>
              <FieldLabel>Perusahaan (Bendera) *</FieldLabel>
              <Controller
                control={control}
                name="perusahaan_id"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger className={fi}>
                      <SelectValue placeholder="Pilih perusahaan" />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      {perusahaanList.map((perusahaan) => (
                        <SelectItem key={perusahaan.id} value={perusahaan.id} className="select-item">
                          {perusahaan.nama_perusahaan}
                          {perusahaan.adalah_perusahaan_sendiri && ' *'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Status Bendera *</FieldLabel>
              <Controller
                control={control}
                name="status_proyek"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger className={fi}>
                      <SelectValue placeholder="Pilih status bendera" />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      <SelectItem value="Work" className="select-item">Work - Proyek milik sendiri</SelectItem>
                      <SelectItem value="Borrowed" className="select-item">Borrowed - Bendera dipinjam pihak lain</SelectItem>
                      <SelectItem value="Get Borrowed" className="select-item">Get Borrowed - Pinjam bendera perusahaan lain</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="edit_tanggal_mulai">Tanggal Mulai</FieldLabel>
                <Input
                  id="edit_tanggal_mulai"
                  className={fi}
                  type="date"
                  value={tanggalMulai}
                  onChange={(event) => updateTanggalField('tanggal_mulai', event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit_tanggal_selesai">Tanggal Selesai</FieldLabel>
                <Input
                  id="edit_tanggal_selesai"
                  className={fi}
                  type="date"
                  value={tanggalSelesai}
                  onChange={(event) => updateTanggalField('tanggal_selesai', event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="edit_durasi">Durasi (Hari)</FieldLabel>
              <Input
                id="edit_durasi"
                className={fi}
                type="number"
                value={durasiHari}
                onChange={(event) => {
                  setDurasiManuallyEdited(Boolean(event.target.value))
                  setValue('durasi_hari', event.target.value, { shouldDirty: true })
                  if (!event.target.value) setDurasiManuallyEdited(false)
                }}
                placeholder="Otomatis dari tanggal, bisa diubah manual"
              />
            </Field>
            <Field>
              <FieldLabel>Tahap Progress</FieldLabel>
              <Controller
                control={control}
                name="tahap_progress"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange} disabled={!jenisPekerjaan}>
                    <SelectTrigger className={fi}>
                      <SelectValue placeholder={jenisPekerjaan ? 'Pilih tahap' : 'Pilih jenis pekerjaan dulu'} />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      {faseList.map((fase) => (
                        <SelectItem key={fase.label} value={fase.label} className="select-item">
                          {fase.label} ({fase.persentase}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit_catatan">Catatan</FieldLabel>
              <Textarea id="edit_catatan" className={fi} rows={5} {...register('catatan')} />
            </Field>
          </FieldGroup>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
        <Button type="button" variant="outline" onClick={() => setActiveSection(null)}>
          Batal
        </Button>
        <Button
          type="button"
          disabled={isSubmitting || !activeSection}
          onClick={() => {
            if (activeSection) void submitSection(activeSection)
          }}
        >
          {isSubmitting ? 'Menyimpan...' : `Simpan ${activeSection ? SECTION_LABEL[activeSection].replace(' Proyek', '') : ''}`}
        </Button>
      </div>
    </div>
  ) : null

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Ringkasan Data Proyek</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Klik Ubah pada section tertentu. Penyimpanan dilakukan per section.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-teal/50 bg-teal/10 px-4 py-1.5 text-sm font-bold text-teal">
              {jenisPekerjaan || 'Jenis belum dipilih'}
            </span>
            <span className="rounded-full border border-primary/50 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
              {tahapProgress || 'Tahap belum dipilih'}
            </span>
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-black leading-tight text-foreground">{namaProyek || 'Belum diisi'}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {dinas || 'Dinas belum diisi'} · {namaPerusahaan}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <SectionCard
              title="Identitas Proyek"
              active={activeSection === 'identitas'}
              onEdit={() => setActiveSection('identitas')}
            >
              <SummaryRow label="Nama Proyek" value={namaProyek} />
              <SummaryRow label="Jenis / Kategori" value={jenisPekerjaan && kategoriPekerjaan ? `${jenisPekerjaan} · ${kategoriPekerjaan}` : undefined} />
              <SummaryRow label="Nomor Kontrak" value={nomorKontrak} />
              <SummaryRow label="Paket Induk" value={paketInduk} />
            </SectionCard>

            <SectionCard
              title="Anggaran"
              active={activeSection === 'anggaran'}
              onEdit={() => setActiveSection('anggaran')}
            >
              <SummaryRow label="Tahun Anggaran" value={tahunAnggaran ? String(tahunAnggaran) : undefined} />
              <SummaryRow label="Sumber Dana" value={sumberDana} />
              <SummaryRow label="Pagu Dana" value={formatRupiah(parseNumberInput(paguDana))} />
              <SummaryRow label="Nilai Kontrak" value={formatRupiah(parseNumberInput(nilaiPenawaran))} />
            </SectionCard>

            <SectionCard
              title="Pemberi Kerja"
              active={activeSection === 'pemberi'}
              onEdit={() => setActiveSection('pemberi')}
            >
              <SummaryRow label="Dinas / SKPD" value={dinas} />
              <SummaryRow label="Lokasi Kecamatan" value={lokasiKecamatan} />
              <SummaryRow label="Nama PPK" value={namaPpk} />
              <SummaryRow label="Kontak" value="Belum diisi" />
            </SectionCard>

            <SectionCard
              title="Pelaksanaan"
              active={activeSection === 'pelaksanaan'}
              onEdit={() => setActiveSection('pelaksanaan')}
            >
              <SummaryRow label="Perusahaan" value={namaPerusahaan} />
              <SummaryRow label="Status Bendera" value={statusProyek} />
              <SummaryRow label="Tanggal" value={tanggalMulai || tanggalSelesai ? `${tanggalMulai || '-'} s/d ${tanggalSelesai || '-'}` : undefined} />
              <SummaryRow label="Durasi / Catatan" value={durasiHari ? `${durasiHari} hari` : catatan} />
            </SectionCard>
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-card p-5 xl:sticky xl:top-20 xl:self-start">
          <h2 className="text-lg font-bold text-foreground">Aturan Edit</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Halaman utama dibuat read-only agar data saat ini mudah dipindai.</p>
            <p>Gunakan tombol Ubah untuk mengedit satu section saja.</p>
            <p>Di desktop form muncul sebagai sheet kanan. Di mobile form berubah menjadi bottom drawer.</p>
          </div>
          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-sm font-bold text-primary">Tips</p>
            <p className="mt-2 text-sm text-primary">Simpan perubahan per section supaya risiko salah ubah lebih kecil.</p>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-bold text-foreground">Meta Data</p>
            <div className="mt-4 space-y-3">
              <SummaryRow label="ID Proyek" value={initialData.id} />
              <SummaryRow label="Dibuat" value={formatTanggal(metadata?.createdAt ?? null)} />
              <SummaryRow label="Terakhir Diubah" value={formatTanggal(metadata?.updatedAt ?? null)} />
              <SummaryRow label="Mode Simpan" value="Per section" />
            </div>
          </div>
        </aside>
      </div>

      {isDesktop ? (
        <Sheet open={Boolean(activeSection)} onOpenChange={(open) => !open && setActiveSection(null)}>
          <SheetContent className="p-0">
            <SheetHeader className="items-start">
              <div>
                <SheetTitle className="text-2xl font-bold">
                  {activeSection ? `Ubah ${SECTION_LABEL[activeSection]}` : 'Ubah Data'}
                </SheetTitle>
                <SheetDescription>
                  Perubahan hanya berlaku untuk section yang sedang dibuka.
                </SheetDescription>
              </div>
            </SheetHeader>
            {sectionForm}
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer open={Boolean(activeSection)} onOpenChange={(open) => !open && setActiveSection(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-xl font-bold">
                {activeSection ? `Ubah ${SECTION_LABEL[activeSection]}` : 'Ubah Data'}
              </DrawerTitle>
              <DrawerDescription>
                Perubahan hanya berlaku untuk section yang sedang dibuka.
              </DrawerDescription>
            </DrawerHeader>
            <div className="max-h-[68vh] overflow-y-auto">{sectionForm}</div>
            <DrawerFooter className="hidden" />
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
