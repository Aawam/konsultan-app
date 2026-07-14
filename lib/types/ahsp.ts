export type RelationValue<T> = T | T[] | null

export type SatuanRow = {
  id: string
  nama_satuan: string
  created_at: string
}

export type KategoriPekerjaanMasterRow = {
  id: string
  nama_kategori: string
  created_at: string
}

export type MasterHargaKind = 'upah' | 'bahan' | 'alat'
export type AhspComponentType = MasterHargaKind

export type MasterHargaRow = {
  id: string
  kind: MasterHargaKind
  nama: string
  satuan_id: string
  satuan: string
  harga_dasar: number
  updated_at: string
}

export type AhspItemRow = {
  id: string
  kode_analisa: string
  uraian_pekerjaan: string
  bidang: 'CK' | 'SDA'
  sub_bidang: string | null
  kategori_id: string
  kategori: string
  satuan_id: string
  satuan: string
  profit_persen_default: number
  created_at: string
}

export type AhspDetailRow = {
  id: string
  ahsp_item_id: string
  komponen_tipe: AhspComponentType
  komponen_id: string
  nama_komponen: string
  satuan: string
  harga_dasar: number
  koefisien: number
  jumlah_harga_dasar: number
}

export type RabProjectListItem = {
  id: string
  nama_proyek: string
  jenis_pekerjaan: string
  kategori_pekerjaan: string
  tahun_anggaran: number
  dinas: string
  lokasi_kecamatan: string | null
  tahap_progress: string | null
  persentase_progress: number | null
}

export type RabProjectListPage = {
  rows: RabProjectListItem[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export type RabDraftRow = {
  id: string
  kode_analisa: string
  uraian_pekerjaan: string
  satuan: string
  volume: number
  harga_satuan: number
  jumlah_harga: number
  urutan: number
}

export type RabRekapRow = {
  id: string
  subtotal: number
  margin_persen: number
  overhead_persen: number
  ppn_persen: number
  pembulatan_rule: string | null
  total_final: number
  status: 'draft' | 'review' | 'validated' | 'final'
}

export type RabMakerHeader = {
  id: string
  proyek_id: string
  status: 'draft' | 'review' | 'validated' | 'final'
  ppn_persen: number
  subtotal: number
  ppn_nilai: number
  total_final: number
  validated_by: string | null
  validated_at: string | null
  finalized_by: string | null
  finalized_at: string | null
  updated_at: string
}

export type RabMakerItemRow = {
  id: string
  rab_maker_id: string
  source_ahsp_item_id: string | null
  kode_analisa_snapshot: string
  uraian_pekerjaan_snapshot: string
  bidang_snapshot: string | null
  sub_bidang_snapshot: string | null
  kategori_snapshot: string | null
  satuan_snapshot: string
  volume: number
  profit_persen_default: number
  profit_persen_final: number
  profit_override_reason: string | null
  harga_dasar_total: number
  profit_nilai: number
  harga_satuan: number
  jumlah_harga: number
  koefisien_locked: boolean
  urutan: number
}

export type RabMakerItemDetailRow = {
  id: string
  rab_maker_item_id: string
  komponen_tipe: AhspComponentType
  nama_komponen_snapshot: string
  satuan_snapshot: string
  koefisien_snapshot: number
  koefisien_locked: boolean
  harga_dasar_default: number
  harga_dasar_final: number
  harga_override_reason: string | null
  jumlah_harga_dasar: number
  urutan: number
}

export type RabMakerSnapshot = {
  maker: RabMakerHeader | null
  items: RabMakerItemRow[]
  detailsByItem: Record<string, RabMakerItemDetailRow[]>
}

export type AvailableAhspForRabResult = {
  rows: AhspItemRow[]
  total: number
  limit: number
}
