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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
