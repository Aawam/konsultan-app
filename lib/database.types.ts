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
      checklist_proyek: {
        Row: {
          catatan: string | null
          id: string
          nama_item: string
          proyek_id: string
          status: string
          urutan: number | null
        }
        Insert: {
          catatan?: string | null
          id?: string
          nama_item: string
          proyek_id: string
          status?: string
          urutan?: number | null
        }
        Update: {
          catatan?: string | null
          id?: string
          nama_item?: string
          proyek_id?: string
          status?: string
          urutan?: number | null
        }
        Relationships: []
      }
      nomor_surat: {
        Row: {
          created_at: string
          id: string
          is_manual: boolean
          jenis_surat: string
          nomor_surat: string
          proyek_id: string
          tanggal_surat: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_manual?: boolean
          jenis_surat: string
          nomor_surat: string
          proyek_id: string
          tanggal_surat: string
        }
        Update: {
          created_at?: string
          id?: string
          is_manual?: boolean
          jenis_surat?: string
          nomor_surat?: string
          proyek_id?: string
          tanggal_surat?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomor_surat_proyek_id_fkey"
            columns: ["proyek_id"]
            isOneToOne: false
            referencedRelation: "proyek"
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
      pengalaman_perusahaan: {
        Row: {
          id: string
          kategori_pekerjaan: string
          lokasi: string | null
          nama_paket: string
          nilai_kontrak: number
          nomor_kontrak: string | null
          pemberi_kerja: string
          perusahaan_id: string
          tanggal_mulai: string
          tanggal_selesai: string
        }
        Insert: {
          id?: string
          kategori_pekerjaan: string
          lokasi?: string | null
          nama_paket: string
          nilai_kontrak: number
          nomor_kontrak?: string | null
          pemberi_kerja: string
          perusahaan_id: string
          tanggal_mulai: string
          tanggal_selesai: string
        }
        Update: {
          id?: string
          kategori_pekerjaan?: string
          lokasi?: string | null
          nama_paket?: string
          nilai_kontrak?: number
          nomor_kontrak?: string | null
          pemberi_kerja?: string
          perusahaan_id?: string
          tanggal_mulai?: string
          tanggal_selesai?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengalaman_perusahaan_perusahaan_id_fkey"
            columns: ["perusahaan_id"]
            isOneToOne: false
            referencedRelation: "perusahaan"
            referencedColumns: ["id"]
          },
        ]
      }
      personil: {
        Row: {
          alamat: string | null
          id: string
          klasifikasi_skk: string | null
          nama_lengkap: string
          nomor_skk: string | null
        }
        Insert: {
          alamat?: string | null
          id?: string
          klasifikasi_skk?: string | null
          nama_lengkap: string
          nomor_skk?: string | null
        }
        Update: {
          alamat?: string | null
          id?: string
          klasifikasi_skk?: string | null
          nama_lengkap?: string
          nomor_skk?: string | null
        }
        Relationships: []
      }
      personil_proyek: {
        Row: {
          durasi_bulan: number
          id: string
          personil_id: string
          posisi: string
          proyek_id: string
          tanggal_mulai_tugas: string | null
          tanggal_selesai_tugas: string | null
        }
        Insert: {
          durasi_bulan: number
          id?: string
          personil_id: string
          posisi: string
          proyek_id: string
          tanggal_mulai_tugas?: string | null
          tanggal_selesai_tugas?: string | null
        }
        Update: {
          durasi_bulan?: number
          id?: string
          personil_id?: string
          posisi?: string
          proyek_id?: string
          tanggal_mulai_tugas?: string | null
          tanggal_selesai_tugas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personil_proyek_personil_id_fkey"
            columns: ["personil_id"]
            isOneToOne: false
            referencedRelation: "personil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personil_proyek_proyek_id_fkey"
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
          is_deleted: boolean | null
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
          is_deleted?: boolean | null
          jalur_masuk?: string
          jenis_pekerjaan: string
          kategori_pekerjaan: string
          lokasi_kecamatan: string
          nama_kpa?: string | null
          nama_ppk: string
          nama_pptk?: string | null
          nama_proyek: string
          nilai_penawaran?: number | null
          nomor_kontrak?: string | null
          nomor_spk?: string | null
          pagu_dana: number
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
          is_deleted?: boolean | null
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
      template_metodologi: {
        Row: {
          id: string
          kategori_pekerjaan: string
          konten: string
          tipe_pekerjaan: string
        }
        Insert: {
          id?: string
          kategori_pekerjaan: string
          konten: string
          tipe_pekerjaan: string
        }
        Update: {
          id?: string
          kategori_pekerjaan?: string
          konten?: string
          tipe_pekerjaan?: string
        }
        Relationships: []
      }
      termin_pembayaran: {
        Row: {
          deskripsi: string
          id: string
          jenis_termin: string
          nilai: number | null
          persentase: number
          proyek_id: string
          status: string
          syarat_pencairan: string | null
          tanggal_dibayar: string | null
          urutan: number
        }
        Insert: {
          deskripsi: string
          id?: string
          jenis_termin: string
          nilai?: number | null
          persentase: number
          proyek_id: string
          status?: string
          syarat_pencairan?: string | null
          tanggal_dibayar?: string | null
          urutan: number
        }
        Update: {
          deskripsi?: string
          id?: string
          jenis_termin?: string
          nilai?: number | null
          persentase?: number
          proyek_id?: string
          status?: string
          syarat_pencairan?: string | null
          tanggal_dibayar?: string | null
          urutan?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_nomor_penawaran: { Args: { p_tahun: number }; Returns: number }
    }
    Enums: {
      jenis_pekerjaan_enum: "Perencanaan" | "Pengawasan"
      sumber_dana_enum: "APBD" | "APBD-Perubahan"
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
      jenis_pekerjaan_enum: ["Perencanaan", "Pengawasan"],
      sumber_dana_enum: ["APBD", "APBD-Perubahan"],
    },
  },
} as const
