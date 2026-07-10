import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'

import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { KATEGORI_PEKERJAAN } from '@/lib/constants/proyek'
import type { Perusahaan } from '@/lib/types/proyek'
import {
  NEW_DINAS_VALUE,
  type ProyekFormValues,
} from '@/components/proyek/form/proyek-form-schema'

type MoneyField = 'pagu_dana' | 'hps' | 'nilai_penawaran'

type ProyekFormStepContentProps = {
  step: number
  control: Control<ProyekFormValues>
  errors: FieldErrors<ProyekFormValues>
  register: UseFormRegister<ProyekFormValues>
  fieldClassName: string
  normalizedDinasList: string[]
  isCustomDinas: boolean
  perusahaanList: Perusahaan[]
  jenisPekerjaan: string | undefined
  faseList: ReadonlyArray<{ label: string; persentase: number }>
  onCustomDinasChange: (value: boolean) => void
  onMoneyChange: (field: MoneyField, value: string) => void
  onValidateWarnings: () => string[]
  onDurasiManualChange: (manual: boolean) => void
}

export function ProyekFormStepContent({
  step,
  control,
  errors,
  register,
  fieldClassName,
  normalizedDinasList,
  isCustomDinas,
  perusahaanList,
  jenisPekerjaan,
  faseList,
  onCustomDinasChange,
  onMoneyChange,
  onValidateWarnings,
  onDurasiManualChange,
}: ProyekFormStepContentProps) {
  if (step === 1) {
    return (
      <div className="section-card">
        <div className="section-header">
          <p className="section-title">Identitas Proyek</p>
        </div>
        <FieldGroup className="section-body grid-cols-1 gap-4 md:grid-cols-2">
          <Field className="md:col-span-2" data-invalid={Boolean(errors.nama_proyek)}>
            <FieldLabel htmlFor="nama_proyek">Nama Proyek *</FieldLabel>
            <Input
              id="nama_proyek"
              className={fieldClassName}
              aria-invalid={Boolean(errors.nama_proyek)}
              placeholder="Contoh: Perencanaan Teknis Pembangunan ..."
              {...register('nama_proyek')}
            />
            <FieldError errors={[errors.nama_proyek]} />
          </Field>

          <Field className="md:col-span-2" data-invalid={Boolean(errors.paket_pekerjaan_induk)}>
            <FieldLabel htmlFor="paket_pekerjaan_induk">Paket Pekerjaan Induk *</FieldLabel>
            <Input
              id="paket_pekerjaan_induk"
              className={fieldClassName}
              aria-invalid={Boolean(errors.paket_pekerjaan_induk)}
              placeholder="Nama paket fisik induk"
              {...register('paket_pekerjaan_induk')}
            />
            <FieldError errors={[errors.paket_pekerjaan_induk]} />
          </Field>

          <Field className="md:col-span-2" data-invalid={Boolean(errors.nomor_kontrak)}>
            <FieldLabel htmlFor="nomor_kontrak">Nomor Kontrak</FieldLabel>
            <Input
              id="nomor_kontrak"
              className={fieldClassName}
              aria-invalid={Boolean(errors.nomor_kontrak)}
              placeholder="Opsional"
              {...register('nomor_kontrak')}
            />
            <FieldError errors={[errors.nomor_kontrak]} />
          </Field>

          <Field data-invalid={Boolean(errors.jenis_pekerjaan)}>
            <FieldLabel>Jenis Pekerjaan *</FieldLabel>
            <Controller
              control={control}
              name="jenis_pekerjaan"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldClassName} aria-invalid={Boolean(errors.jenis_pekerjaan)}>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent className="select-content">
                    <SelectItem value="Perencanaan" className="select-item">
                      Perencanaan
                    </SelectItem>
                    <SelectItem value="Pengawasan" className="select-item">
                      Pengawasan
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.jenis_pekerjaan]} />
          </Field>

          <Field data-invalid={Boolean(errors.kategori_pekerjaan)}>
            <FieldLabel>Kategori Pekerjaan *</FieldLabel>
            <Controller
              control={control}
              name="kategori_pekerjaan"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldClassName} aria-invalid={Boolean(errors.kategori_pekerjaan)}>
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
            <FieldError errors={[errors.kategori_pekerjaan]} />
          </Field>
        </FieldGroup>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="section-card">
        <div className="section-header">
          <p className="section-title">Anggaran</p>
        </div>
        <FieldGroup className="section-body grid-cols-1 gap-4 md:grid-cols-2">
          <Field data-invalid={Boolean(errors.tahun_anggaran)}>
            <FieldLabel htmlFor="tahun_anggaran">Tahun Anggaran *</FieldLabel>
            <Input
              id="tahun_anggaran"
              className={fieldClassName}
              type="number"
              aria-invalid={Boolean(errors.tahun_anggaran)}
              {...register('tahun_anggaran', { valueAsNumber: true })}
            />
            <FieldError errors={[errors.tahun_anggaran]} />
          </Field>

          <Field data-invalid={Boolean(errors.sumber_dana)}>
            <FieldLabel>Sumber Dana *</FieldLabel>
            <Controller
              control={control}
              name="sumber_dana"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldClassName} aria-invalid={Boolean(errors.sumber_dana)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="select-content">
                    <SelectItem value="APBD" className="select-item">
                      APBD
                    </SelectItem>
                    <SelectItem value="APBD-Perubahan" className="select-item">
                      APBD-Perubahan
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.sumber_dana]} />
          </Field>

          <Field data-invalid={Boolean(errors.pagu_dana)}>
            <FieldLabel htmlFor="pagu_dana">Pagu Dana (Rp) *</FieldLabel>
            <Input
              id="pagu_dana"
              className={fieldClassName}
              inputMode="numeric"
              aria-invalid={Boolean(errors.pagu_dana)}
              placeholder="Contoh: 50.000.000"
              {...register('pagu_dana', {
                onChange: (event) => onMoneyChange('pagu_dana', event.target.value),
                onBlur: onValidateWarnings,
              })}
            />
            <FieldError errors={[errors.pagu_dana]} />
          </Field>

          <Field data-invalid={Boolean(errors.hps)}>
            <FieldLabel htmlFor="hps">HPS (Rp)</FieldLabel>
            <Input
              id="hps"
              className={fieldClassName}
              inputMode="numeric"
              aria-invalid={Boolean(errors.hps)}
              placeholder="Opsional"
              {...register('hps', {
                onChange: (event) => onMoneyChange('hps', event.target.value),
                onBlur: onValidateWarnings,
              })}
            />
            <FieldError errors={[errors.hps]} />
          </Field>

          <Field className="md:col-span-2" data-invalid={Boolean(errors.nilai_penawaran)}>
            <FieldLabel htmlFor="nilai_penawaran">Nilai Penawaran / Kontrak (Rp)</FieldLabel>
            <Input
              id="nilai_penawaran"
              className={fieldClassName}
              inputMode="numeric"
              aria-invalid={Boolean(errors.nilai_penawaran)}
              placeholder="Opsional"
              {...register('nilai_penawaran', {
                onChange: (event) => onMoneyChange('nilai_penawaran', event.target.value),
                onBlur: onValidateWarnings,
              })}
            />
            <FieldError errors={[errors.nilai_penawaran]} />
          </Field>
        </FieldGroup>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="section-card">
        <div className="section-header">
          <p className="section-title">Pemberi Kerja</p>
        </div>
        <FieldGroup className="section-body grid-cols-1 gap-4 md:grid-cols-2">
          <Field className="md:col-span-2" data-invalid={Boolean(errors.dinas)}>
            <FieldLabel>Dinas *</FieldLabel>
            <Controller
              control={control}
              name="dinas"
              render={({ field }) => (
                <div className="space-y-2">
                  <Select
                    value={isCustomDinas ? NEW_DINAS_VALUE : (field.value ?? '')}
                    onValueChange={(value) => {
                      if (value === NEW_DINAS_VALUE) {
                        onCustomDinasChange(true)
                        if (normalizedDinasList.includes(field.value ?? '')) field.onChange('')
                        return
                      }
                      onCustomDinasChange(false)
                      field.onChange(value)
                    }}
                  >
                    <SelectTrigger className={fieldClassName} aria-invalid={Boolean(errors.dinas)}>
                      <SelectValue placeholder="Pilih dinas" />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      {normalizedDinasList.map((dinas) => (
                        <SelectItem key={dinas} value={dinas} className="select-item">
                          {dinas}
                        </SelectItem>
                      ))}
                      <SelectItem value={NEW_DINAS_VALUE} className="select-item">
                        + Tambah dinas baru
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {isCustomDinas && (
                    <Input
                      className={fieldClassName}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Ketik nama dinas baru"
                    />
                  )}
                </div>
              )}
            />
            <FieldError errors={[errors.dinas]} />
          </Field>

          <Field data-invalid={Boolean(errors.lokasi_kecamatan)}>
            <FieldLabel htmlFor="lokasi_kecamatan">Lokasi Kecamatan *</FieldLabel>
            <Input
              id="lokasi_kecamatan"
              className={fieldClassName}
              aria-invalid={Boolean(errors.lokasi_kecamatan)}
              {...register('lokasi_kecamatan')}
            />
            <FieldError errors={[errors.lokasi_kecamatan]} />
          </Field>

          <Field data-invalid={Boolean(errors.nama_ppk)}>
            <FieldLabel htmlFor="nama_ppk">Nama PPK</FieldLabel>
            <Input
              id="nama_ppk"
              className={fieldClassName}
              aria-invalid={Boolean(errors.nama_ppk)}
              placeholder="Opsional"
              {...register('nama_ppk')}
            />
            <FieldError errors={[errors.nama_ppk]} />
          </Field>
        </FieldGroup>
      </div>
    )
  }

  if (step === 4) {
    return (
      <div className="section-card">
        <div className="section-header">
          <p className="section-title">Pelaksanaan</p>
        </div>
        <FieldGroup className="section-body grid-cols-1 gap-4 md:grid-cols-2">
          <Field className="md:col-span-2" data-invalid={Boolean(errors.perusahaan_id)}>
            <FieldLabel>Perusahaan (Bendera) *</FieldLabel>
            <Controller
              control={control}
              name="perusahaan_id"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldClassName} aria-invalid={Boolean(errors.perusahaan_id)}>
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
            <FieldError errors={[errors.perusahaan_id]} />
          </Field>

          <Field className="md:col-span-2" data-invalid={Boolean(errors.status_proyek)}>
            <FieldLabel>Status Bendera *</FieldLabel>
            <Controller
              control={control}
              name="status_proyek"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className={fieldClassName} aria-invalid={Boolean(errors.status_proyek)}>
                    <SelectValue placeholder="Pilih status bendera" />
                  </SelectTrigger>
                  <SelectContent className="select-content">
                    <SelectItem value="Work" className="select-item">
                      Work - Proyek milik sendiri
                    </SelectItem>
                    <SelectItem value="Borrowed" className="select-item">
                      Borrowed - Bendera dipinjam pihak lain
                    </SelectItem>
                    <SelectItem value="Get Borrowed" className="select-item">
                      Get Borrowed - Pinjam bendera perusahaan lain
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.status_proyek]} />
          </Field>

          <Field data-invalid={Boolean(errors.tanggal_mulai)}>
            <FieldLabel htmlFor="tanggal_mulai">Tanggal Mulai</FieldLabel>
            <Input
              id="tanggal_mulai"
              className={fieldClassName}
              type="date"
              aria-invalid={Boolean(errors.tanggal_mulai)}
              {...register('tanggal_mulai', { onBlur: onValidateWarnings })}
            />
            <FieldError errors={[errors.tanggal_mulai]} />
          </Field>

          <Field data-invalid={Boolean(errors.durasi_hari)}>
            <FieldLabel htmlFor="durasi_hari">Durasi (Hari)</FieldLabel>
            <Input
              id="durasi_hari"
              className={fieldClassName}
              type="number"
              aria-invalid={Boolean(errors.durasi_hari)}
              placeholder="Otomatis dari tanggal, bisa diubah manual"
              {...register('durasi_hari', {
                onChange: (event) => {
                  onDurasiManualChange(Boolean(event.target.value))
                },
              })}
            />
            <FieldError errors={[errors.durasi_hari]} />
          </Field>

          <Field data-invalid={Boolean(errors.tanggal_selesai)}>
            <FieldLabel htmlFor="tanggal_selesai">Tanggal Selesai</FieldLabel>
            <Input
              id="tanggal_selesai"
              className={fieldClassName}
              type="date"
              aria-invalid={Boolean(errors.tanggal_selesai)}
              {...register('tanggal_selesai', { onBlur: onValidateWarnings })}
            />
            <FieldError errors={[errors.tanggal_selesai]} />
          </Field>

          <Field className="md:col-span-2" data-invalid={Boolean(errors.tahap_progress)}>
            <FieldLabel>Tahap Progress</FieldLabel>
            <Controller
              control={control}
              name="tahap_progress"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={!jenisPekerjaan}>
                  <SelectTrigger className={fieldClassName} aria-invalid={Boolean(errors.tahap_progress)}>
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
            <FieldError errors={[errors.tahap_progress]} />
          </Field>

          <Field className="md:col-span-2" data-invalid={Boolean(errors.catatan)}>
            <FieldLabel htmlFor="catatan">Catatan</FieldLabel>
            <Textarea
              id="catatan"
              className={fieldClassName}
              aria-invalid={Boolean(errors.catatan)}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
              {...register('catatan')}
            />
            <FieldError errors={[errors.catatan]} />
          </Field>
        </FieldGroup>
      </div>
    )
  }

  return null
}
