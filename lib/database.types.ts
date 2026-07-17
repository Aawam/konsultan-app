export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ahsp_details: {
        Row: {
          ahsp_item_id: string
          alat_id: string | null
          bahan_id: string | null
          id: string
          koefisien: number
          komponen_tipe: Database["public"]["Enums"]["ahsp_component_type"]
          upah_id: string | null
        }
        Insert: {
          ahsp_item_id: string
          alat_id?: string | null
          bahan_id?: string | null
          id?: string
          koefisien: number
          komponen_tipe: Database["public"]["Enums"]["ahsp_component_type"]
          upah_id?: string | null
        }
        Update: {
          ahsp_item_id?: string
          alat_id?: string | null
          bahan_id?: string | null
          id?: string
          koefisien?: number
          komponen_tipe?: Database["public"]["Enums"]["ahsp_component_type"]
          upah_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ahsp_details_ahsp_item_id_fkey"
            columns: ["ahsp_item_id"]
            isOneToOne: false
            referencedRelation: "ahsp_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ahsp_details_alat_id_fkey"
            columns: ["alat_id"]
            isOneToOne: false
            referencedRelation: "master_alat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ahsp_details_bahan_id_fkey"
            columns: ["bahan_id"]
            isOneToOne: false
            referencedRelation: "master_bahan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ahsp_details_upah_id_fkey"
            columns: ["upah_id"]
            isOneToOne: false
            referencedRelation: "master_upah"
            referencedColumns: ["id"]
          },
        ]
      }
      ahsp_items: {
        Row: {
          bidang: string
          created_at: string
          id: string
          kategori_id: string
          kode_analisa: string
          profit_persen_default: number
          satuan_id: string
          sub_bidang: string | null
          uraian_pekerjaan: string
        }
        Insert: {
          bidang?: string
          created_at?: string
          id?: string
          kategori_id: string
          kode_analisa: string
          profit_persen_default?: number
          satuan_id: string
          sub_bidang?: string | null
          uraian_pekerjaan: string
        }
        Update: {
          bidang?: string
          created_at?: string
          id?: string
          kategori_id?: string
          kode_analisa?: string
          profit_persen_default?: number
          satuan_id?: string
          sub_bidang?: string | null
          uraian_pekerjaan?: string
        }
        Relationships: [
          {
            foreignKeyName: "ahsp_items_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "kategori_pekerjaan_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ahsp_items_satuan_id_fkey"
            columns: ["satuan_id"]
            isOneToOne: false
            referencedRelation: "satuan"
            referencedColumns: ["id"]
          },
        ]
      }
      dinas_skpd: {
        Row: {
          created_at: string
          id: string
          nama_dinas: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama_dinas: string
        }
        Update: {
          created_at?: string
          id?: string
          nama_dinas?: string
        }
        Relationships: []
      }
      kategori_pekerjaan_master: {
        Row: {
          created_at: string
          id: string
          nama_kategori: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama_kategori: string
        }
        Update: {
          created_at?: string
          id?: string
          nama_kategori?: string
        }
        Relationships: []
      }
      master_alat: {
        Row: {
          harga_dasar: number
          id: string
          nama_alat: string
          satuan_id: string
          updated_at: string
        }
        Insert: {
          harga_dasar: number
          id?: string
          nama_alat: string
          satuan_id: string
          updated_at?: string
        }
        Update: {
          harga_dasar?: number
          id?: string
          nama_alat?: string
          satuan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_alat_satuan_id_fkey"
            columns: ["satuan_id"]
            isOneToOne: false
            referencedRelation: "satuan"
            referencedColumns: ["id"]
          },
        ]
      }
      master_bahan: {
        Row: {
          harga_dasar: number
          id: string
          nama_bahan: string
          satuan_id: string
          updated_at: string
        }
        Insert: {
          harga_dasar: number
          id?: string
          nama_bahan: string
          satuan_id: string
          updated_at?: string
        }
        Update: {
          harga_dasar?: number
          id?: string
          nama_bahan?: string
          satuan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_bahan_satuan_id_fkey"
            columns: ["satuan_id"]
            isOneToOne: false
            referencedRelation: "satuan"
            referencedColumns: ["id"]
          },
        ]
      }
      master_upah: {
        Row: {
          harga_dasar: number
          id: string
          nama_upah: string
          satuan_id: string
          updated_at: string
        }
        Insert: {
          harga_dasar: number
          id?: string
          nama_upah: string
          satuan_id: string
          updated_at?: string
        }
        Update: {
          harga_dasar?: number
          id?: string
          nama_upah?: string
          satuan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_upah_satuan_id_fkey"
            columns: ["satuan_id"]
            isOneToOne: false
            referencedRelation: "satuan"
            referencedColumns: ["id"]
          },
        ]
      }
      override_log: {
        Row: {
          alasan: string
          dilakukan_oleh: string
          dilakukan_pada: string
          field_dioverride: string
          id: string
          nilai_sebelum: string | null
          nilai_sesudah: string | null
          proyek_id: string
        }
        Insert: {
          alasan: string
          dilakukan_oleh?: string
          dilakukan_pada?: string
          field_dioverride: string
          id?: string
          nilai_sebelum?: string | null
          nilai_sesudah?: string | null
          proyek_id: string
        }
        Update: {
          alasan?: string
          dilakukan_oleh?: string
          dilakukan_pada?: string
          field_dioverride?: string
          id?: string
          nilai_sebelum?: string | null
          nilai_sesudah?: string | null
          proyek_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "override_log_proyek_id_fkey"
            columns: ["proyek_id"]
            isOneToOne: false
            referencedRelation: "proyek"
            referencedColumns: ["id"]
          },
        ]
      }
      perusahaan: {
        Row: {
          adalah_perusahaan_sendiri: boolean
          alamat: string | null
          bank_atas_nama: string | null
          bank_nama: string | null
          bank_rekening: string | null
          email: string | null
          id: string
          inisial_perusahaan: string | null
          kode_kbli: string | null
          kode_pos: string | null
          kota: string | null
          ktp_direktur: string | null
          masa_berlaku_sbu: string | null
          nama_direktur: string | null
          nama_perusahaan: string
          nib: string | null
          nib_berbasis_risiko: string | null
          nomor_akta_pendirian: string | null
          nomor_akta_perubahan: string | null
          notaris_pendirian: string | null
          notaris_perubahan: string | null
          npwp: string | null
          npwp_direktur: string | null
          pengesahan_kemenkumham: string | null
          sbu: string | null
          siujk: string | null
          subklasifikasi_sbu: string | null
          tanggal_akta_pendirian: string | null
          tanggal_akta_perubahan: string | null
          telepon: string | null
        }
        Insert: {
          adalah_perusahaan_sendiri?: boolean
          alamat?: string | null
          bank_atas_nama?: string | null
          bank_nama?: string | null
          bank_rekening?: string | null
          email?: string | null
          id?: string
          inisial_perusahaan?: string | null
          kode_kbli?: string | null
          kode_pos?: string | null
          kota?: string | null
          ktp_direktur?: string | null
          masa_berlaku_sbu?: string | null
          nama_direktur?: string | null
          nama_perusahaan: string
          nib?: string | null
          nib_berbasis_risiko?: string | null
          nomor_akta_pendirian?: string | null
          nomor_akta_perubahan?: string | null
          notaris_pendirian?: string | null
          notaris_perubahan?: string | null
          npwp?: string | null
          npwp_direktur?: string | null
          pengesahan_kemenkumham?: string | null
          sbu?: string | null
          siujk?: string | null
          subklasifikasi_sbu?: string | null
          tanggal_akta_pendirian?: string | null
          tanggal_akta_perubahan?: string | null
          telepon?: string | null
        }
        Update: {
          adalah_perusahaan_sendiri?: boolean
          alamat?: string | null
          bank_atas_nama?: string | null
          bank_nama?: string | null
          bank_rekening?: string | null
          email?: string | null
          id?: string
          inisial_perusahaan?: string | null
          kode_kbli?: string | null
          kode_pos?: string | null
          kota?: string | null
          ktp_direktur?: string | null
          masa_berlaku_sbu?: string | null
          nama_direktur?: string | null
          nama_perusahaan?: string
          nib?: string | null
          nib_berbasis_risiko?: string | null
          nomor_akta_pendirian?: string | null
          nomor_akta_perubahan?: string | null
          notaris_pendirian?: string | null
          notaris_perubahan?: string | null
          npwp?: string | null
          npwp_direktur?: string | null
          pengesahan_kemenkumham?: string | null
          sbu?: string | null
          siujk?: string | null
          subklasifikasi_sbu?: string | null
          tanggal_akta_pendirian?: string | null
          tanggal_akta_perubahan?: string | null
          telepon?: string | null
        }
        Relationships: []
      }
      proyek: {
        Row: {
          alamat_dinas: string | null
          catatan: string | null
          created_at: string
          dinas: string
          durasi_hari: number | null
          hps: number | null
          id: string
          is_deleted: boolean
          jalur_masuk: string
          jenis_pekerjaan: string
          kategori_pekerjaan: string
          lokasi_kecamatan: string
          nama_kpa: string | null
          nama_ppk: string
          nama_pptk: string | null
          nama_proyek: string
          nilai_penawaran: number | null
          nomor_kontrak: string | null
          nomor_spk: string | null
          pagu_dana: number
          paket_pekerjaan_induk: string
          pernah_dioverride: boolean
          persentase_progress: number
          perusahaan_id: string
          skema_pembayaran: string | null
          status_proyek: string | null
          status_tender: string | null
          sumber_dana: string
          tahap_progress: string | null
          tahun_anggaran: number
          tanggal_kontrak: string | null
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          updated_at: string
        }
        Insert: {
          alamat_dinas?: string | null
          catatan?: string | null
          created_at?: string
          dinas: string
          durasi_hari?: number | null
          hps?: number | null
          id?: string
          is_deleted?: boolean
          jalur_masuk?: string
          jenis_pekerjaan: string
          kategori_pekerjaan: string
          lokasi_kecamatan: string
          nama_kpa?: string | null
          nama_ppk?: string
          nama_pptk?: string | null
          nama_proyek: string
          nilai_penawaran?: number | null
          nomor_kontrak?: string | null
          nomor_spk?: string | null
          pagu_dana?: number
          paket_pekerjaan_induk: string
          pernah_dioverride?: boolean
          persentase_progress?: number
          perusahaan_id: string
          skema_pembayaran?: string | null
          status_proyek?: string | null
          status_tender?: string | null
          sumber_dana: string
          tahap_progress?: string | null
          tahun_anggaran: number
          tanggal_kontrak?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string
        }
        Update: {
          alamat_dinas?: string | null
          catatan?: string | null
          created_at?: string
          dinas?: string
          durasi_hari?: number | null
          hps?: number | null
          id?: string
          is_deleted?: boolean
          jalur_masuk?: string
          jenis_pekerjaan?: string
          kategori_pekerjaan?: string
          lokasi_kecamatan?: string
          nama_kpa?: string | null
          nama_ppk?: string
          nama_pptk?: string | null
          nama_proyek?: string
          nilai_penawaran?: number | null
          nomor_kontrak?: string | null
          nomor_spk?: string | null
          pagu_dana?: number
          paket_pekerjaan_induk?: string
          pernah_dioverride?: boolean
          persentase_progress?: number
          perusahaan_id?: string
          skema_pembayaran?: string | null
          status_proyek?: string | null
          status_tender?: string | null
          sumber_dana?: string
          tahap_progress?: string | null
          tahun_anggaran?: number
          tanggal_kontrak?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyek_perusahaan_id_fkey"
            columns: ["perusahaan_id"]
            isOneToOne: false
            referencedRelation: "perusahaan"
            referencedColumns: ["id"]
          },
        ]
      }
      proyek_internal: {
        Row: {
          catatan_internal: string | null
          honor_tim: Json
          nilai_kontrak_jasa: number | null
          piutang: number | null
          proyek_id: string
          termin_pembayaran: Json
          updated_at: string
        }
        Insert: {
          catatan_internal?: string | null
          honor_tim?: Json
          nilai_kontrak_jasa?: number | null
          piutang?: number | null
          proyek_id: string
          termin_pembayaran?: Json
          updated_at?: string
        }
        Update: {
          catatan_internal?: string | null
          honor_tim?: Json
          nilai_kontrak_jasa?: number | null
          piutang?: number | null
          proyek_id?: string
          termin_pembayaran?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyek_internal_proyek_id_fkey"
            columns: ["proyek_id"]
            isOneToOne: true
            referencedRelation: "proyek"
            referencedColumns: ["id"]
          },
        ]
      }
      rab_audit_log: {
        Row: {
          aksi: string
          created_at: string
          id: string
          metadata: Json
          proyek_id: string
          rab_maker_id: string | null
          rab_maker_item_detail_id: string | null
          rab_maker_item_id: string | null
          user_id: string | null
        }
        Insert: {
          aksi: string
          created_at?: string
          id?: string
          metadata?: Json
          proyek_id: string
          rab_maker_id?: string | null
          rab_maker_item_detail_id?: string | null
          rab_maker_item_id?: string | null
          user_id?: string | null
        }
        Update: {
          aksi?: string
          created_at?: string
          id?: string
          metadata?: Json
          proyek_id?: string
          rab_maker_id?: string | null
          rab_maker_item_detail_id?: string | null
          rab_maker_item_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rab_audit_log_proyek_id_fkey"
            columns: ["proyek_id"]
            isOneToOne: false
            referencedRelation: "proyek"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_audit_log_rab_maker_id_fkey"
            columns: ["rab_maker_id"]
            isOneToOne: false
            referencedRelation: "rab_maker"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_audit_log_rab_maker_item_detail_id_fkey"
            columns: ["rab_maker_item_detail_id"]
            isOneToOne: false
            referencedRelation: "rab_maker_item_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_audit_log_rab_maker_item_id_fkey"
            columns: ["rab_maker_item_id"]
            isOneToOne: false
            referencedRelation: "rab_maker_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rab_export_history: {
        Row: {
          export_format: string
          exported_at: string
          exported_by: string | null
          file_name: string
          file_size_bytes: number
          id: string
          metadata: Json
          proyek_id: string
          rab_maker_id: string
          version_number: number
        }
        Insert: {
          export_format: string
          exported_at?: string
          exported_by?: string | null
          file_name: string
          file_size_bytes: number
          id?: string
          metadata?: Json
          proyek_id: string
          rab_maker_id: string
          version_number: number
        }
        Update: {
          export_format?: string
          exported_at?: string
          exported_by?: string | null
          file_name?: string
          file_size_bytes?: number
          id?: string
          metadata?: Json
          proyek_id?: string
          rab_maker_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "rab_export_history_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_export_history_proyek_id_fkey"
            columns: ["proyek_id"]
            isOneToOne: false
            referencedRelation: "proyek"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_export_history_rab_maker_id_fkey"
            columns: ["rab_maker_id"]
            isOneToOne: false
            referencedRelation: "rab_maker"
            referencedColumns: ["id"]
          },
        ]
      }
      rab_maker: {
        Row: {
          created_at: string
          created_by: string
          finalized_at: string | null
          finalized_by: string | null
          id: string
          pembulatan_rule: string | null
          ppn_nilai: number
          ppn_persen: number
          proyek_id: string
          status: Database["public"]["Enums"]["rab_status"]
          subtotal: number
          total_final: number
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          pembulatan_rule?: string | null
          ppn_nilai?: number
          ppn_persen?: number
          proyek_id: string
          status?: Database["public"]["Enums"]["rab_status"]
          subtotal?: number
          total_final?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          pembulatan_rule?: string | null
          ppn_nilai?: number
          ppn_persen?: number
          proyek_id?: string
          status?: Database["public"]["Enums"]["rab_status"]
          subtotal?: number
          total_final?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rab_maker_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_maker_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_maker_proyek_id_fkey"
            columns: ["proyek_id"]
            isOneToOne: true
            referencedRelation: "proyek"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_maker_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rab_maker_item_details: {
        Row: {
          created_at: string
          harga_dasar_default: number
          harga_dasar_final: number
          harga_override_reason: string | null
          id: string
          jumlah_harga_dasar: number
          koefisien_locked: boolean
          koefisien_snapshot: number
          komponen_tipe: Database["public"]["Enums"]["ahsp_component_type"]
          nama_komponen_snapshot: string
          rab_maker_item_id: string
          satuan_snapshot: string
          source_ahsp_detail_id: string | null
          source_alat_id: string | null
          source_bahan_id: string | null
          source_upah_id: string | null
          updated_at: string
          urutan: number
        }
        Insert: {
          created_at?: string
          harga_dasar_default: number
          harga_dasar_final: number
          harga_override_reason?: string | null
          id?: string
          jumlah_harga_dasar?: number
          koefisien_locked?: boolean
          koefisien_snapshot: number
          komponen_tipe: Database["public"]["Enums"]["ahsp_component_type"]
          nama_komponen_snapshot: string
          rab_maker_item_id: string
          satuan_snapshot: string
          source_ahsp_detail_id?: string | null
          source_alat_id?: string | null
          source_bahan_id?: string | null
          source_upah_id?: string | null
          updated_at?: string
          urutan?: number
        }
        Update: {
          created_at?: string
          harga_dasar_default?: number
          harga_dasar_final?: number
          harga_override_reason?: string | null
          id?: string
          jumlah_harga_dasar?: number
          koefisien_locked?: boolean
          koefisien_snapshot?: number
          komponen_tipe?: Database["public"]["Enums"]["ahsp_component_type"]
          nama_komponen_snapshot?: string
          rab_maker_item_id?: string
          satuan_snapshot?: string
          source_ahsp_detail_id?: string | null
          source_alat_id?: string | null
          source_bahan_id?: string | null
          source_upah_id?: string | null
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "rab_maker_item_details_rab_maker_item_id_fkey"
            columns: ["rab_maker_item_id"]
            isOneToOne: false
            referencedRelation: "rab_maker_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_maker_item_details_source_ahsp_detail_id_fkey"
            columns: ["source_ahsp_detail_id"]
            isOneToOne: false
            referencedRelation: "ahsp_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_maker_item_details_source_alat_id_fkey"
            columns: ["source_alat_id"]
            isOneToOne: false
            referencedRelation: "master_alat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_maker_item_details_source_bahan_id_fkey"
            columns: ["source_bahan_id"]
            isOneToOne: false
            referencedRelation: "master_bahan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_maker_item_details_source_upah_id_fkey"
            columns: ["source_upah_id"]
            isOneToOne: false
            referencedRelation: "master_upah"
            referencedColumns: ["id"]
          },
        ]
      }
      rab_maker_items: {
        Row: {
          bidang_snapshot: string | null
          created_at: string
          created_by: string
          harga_dasar_total: number
          harga_satuan: number
          id: string
          jumlah_harga: number
          kategori_snapshot: string | null
          kode_analisa_snapshot: string
          koefisien_locked: boolean
          profit_nilai: number
          profit_override_reason: string | null
          profit_persen_default: number
          profit_persen_final: number
          rab_maker_id: string
          satuan_snapshot: string
          section_id: string | null
          source_ahsp_item_id: string | null
          sub_bidang_snapshot: string | null
          updated_at: string
          uraian_pekerjaan_snapshot: string
          urutan: number
          volume: number
        }
        Insert: {
          bidang_snapshot?: string | null
          created_at?: string
          created_by: string
          harga_dasar_total?: number
          harga_satuan?: number
          id?: string
          jumlah_harga?: number
          kategori_snapshot?: string | null
          kode_analisa_snapshot: string
          koefisien_locked?: boolean
          profit_nilai?: number
          profit_override_reason?: string | null
          profit_persen_default?: number
          profit_persen_final?: number
          rab_maker_id: string
          satuan_snapshot: string
          section_id?: string | null
          source_ahsp_item_id?: string | null
          sub_bidang_snapshot?: string | null
          updated_at?: string
          uraian_pekerjaan_snapshot: string
          urutan?: number
          volume?: number
        }
        Update: {
          bidang_snapshot?: string | null
          created_at?: string
          created_by?: string
          harga_dasar_total?: number
          harga_satuan?: number
          id?: string
          jumlah_harga?: number
          kategori_snapshot?: string | null
          kode_analisa_snapshot?: string
          koefisien_locked?: boolean
          profit_nilai?: number
          profit_override_reason?: string | null
          profit_persen_default?: number
          profit_persen_final?: number
          rab_maker_id?: string
          satuan_snapshot?: string
          section_id?: string | null
          source_ahsp_item_id?: string | null
          sub_bidang_snapshot?: string | null
          updated_at?: string
          uraian_pekerjaan_snapshot?: string
          urutan?: number
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "rab_maker_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_maker_items_rab_maker_id_fkey"
            columns: ["rab_maker_id"]
            isOneToOne: false
            referencedRelation: "rab_maker"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_maker_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "rab_maker_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rab_maker_items_source_ahsp_item_id_fkey"
            columns: ["source_ahsp_item_id"]
            isOneToOne: false
            referencedRelation: "ahsp_items"
            referencedColumns: ["id"]
          },
        ]
      }
      rab_maker_sections: {
        Row: {
          created_at: string
          id: string
          kode_section: string | null
          nama_section: string
          rab_maker_id: string
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: string
          kode_section?: string | null
          nama_section: string
          rab_maker_id: string
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: string
          kode_section?: string | null
          nama_section?: string
          rab_maker_id?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "rab_maker_sections_rab_maker_id_fkey"
            columns: ["rab_maker_id"]
            isOneToOne: false
            referencedRelation: "rab_maker"
            referencedColumns: ["id"]
          },
        ]
      }
      satuan: {
        Row: {
          created_at: string
          id: string
          nama_satuan: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama_satuan: string
        }
        Update: {
          created_at?: string
          id?: string
          nama_satuan?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          nama: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nama?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nama?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_rab_maker: { Args: { target_proyek_id: string }; Returns: string }
      assert_rab_maker_ready_for_approval: {
        Args: { target_rab_maker_id: string }
        Returns: undefined
      }
      can_manage_project_rab: {
        Args: { target_proyek_id: string }
        Returns: boolean
      }
      create_rab_maker_from_ahsp: {
        Args: { source_ahsp_item_id: string; target_proyek_id: string }
        Returns: string
      }
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      delete_rab_maker_item: {
        Args: { target_item_id: string }
        Returns: undefined
      }
      finalize_rab_maker: {
        Args: { target_proyek_id: string }
        Returns: string
      }
      get_proyek_teknis: {
        Args: { target_proyek_id?: string }
        Returns: {
          created_at: string
          dinas: string
          durasi_hari: number
          id: string
          is_deleted: boolean
          jalur_masuk: string
          jenis_pekerjaan: string
          kategori_pekerjaan: string
          lokasi_kecamatan: string
          nama_ppk: string
          nama_proyek: string
          nomor_kontrak: string
          paket_pekerjaan_induk: string
          pernah_dioverride: boolean
          persentase_progress: number
          perusahaan_adalah_perusahaan_sendiri: boolean
          perusahaan_id: string
          perusahaan_nama: string
          status_proyek: string
          sumber_dana: string
          tahap_progress: string
          tahun_anggaran: number
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at: string
        }[]
      }
      get_proyek_teknis_page: {
        Args: {
          target_jenis_pekerjaan?: string
          target_page?: number
          target_page_size?: number
          target_perusahaan_id?: string
          target_progress?: string
          target_search?: string
          target_status_proyek?: string
          target_tahun_anggaran?: number
        }
        Returns: Json
      }
      get_proyek_teknis_page_unchecked: {
        Args: {
          target_jenis_pekerjaan?: string
          target_page?: number
          target_page_size?: number
          target_perusahaan_id?: string
          target_progress?: string
          target_search?: string
          target_status_proyek?: string
          target_tahun_anggaran?: number
        }
        Returns: Json
      }
      get_proyek_teknis_unchecked: {
        Args: { target_proyek_id?: string }
        Returns: {
          created_at: string
          dinas: string
          durasi_hari: number
          id: string
          is_deleted: boolean
          jalur_masuk: string
          jenis_pekerjaan: string
          kategori_pekerjaan: string
          lokasi_kecamatan: string
          nama_ppk: string
          nama_proyek: string
          nomor_kontrak: string
          paket_pekerjaan_induk: string
          pernah_dioverride: boolean
          persentase_progress: number
          perusahaan_adalah_perusahaan_sendiri: boolean
          perusahaan_id: string
          perusahaan_nama: string
          status_proyek: string
          sumber_dana: string
          tahap_progress: string
          tahun_anggaran: number
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at: string
        }[]
      }
      import_ahsp_masterfile: { Args: { import_payload: Json }; Returns: Json }
      import_ahsp_masterfile_unchecked: {
        Args: { import_payload: Json }
        Returns: Json
      }
      is_owner_admin: { Args: never; Returns: boolean }
      recalculate_rab_maker: {
        Args: { target_rab_maker_id: string }
        Returns: undefined
      }
      record_rab_export_file: {
        Args: {
          base_file_name: string
          export_format: string
          file_size_bytes: number
          target_rab_maker_id: string
        }
        Returns: Json
      }
      transition_project_workflow_to_rab_ready: {
        Args: { actor_email?: string; target_proyek_id: string }
        Returns: string
      }
      update_rab_maker_detail_harga_dasar: {
        Args: {
          new_harga_dasar: number
          override_reason?: string
          target_detail_id: string
        }
        Returns: undefined
      }
      update_rab_maker_item_profit: {
        Args: {
          new_profit_persen: number
          override_reason?: string
          target_item_id: string
        }
        Returns: undefined
      }
      update_rab_maker_item_volume: {
        Args: { new_volume: number; target_item_id: string }
        Returns: undefined
      }
    }
    Enums: {
      ahsp_component_type: "upah" | "bahan" | "alat"
      app_role: "owner_admin" | "tenaga_ahli"
      rab_status: "draft" | "review" | "validated" | "final"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ahsp_component_type: ["upah", "bahan", "alat"],
      app_role: ["owner_admin", "tenaga_ahli"],
      rab_status: ["draft", "review", "validated", "final"],
    },
  },
} as const
