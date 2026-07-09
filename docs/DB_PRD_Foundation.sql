-- ============================================================
-- KONSULTAN APP - PRD FOUNDATION DRAFT
-- Purpose:
-- 1. Add app roles for Owner/Admin and Tenaga Ahli.
-- 2. Add AHSP/master harga/RAB tables required by the PRD.
-- 3. Move future commercial-only fields into an owner-only table.
--
-- Prerequisite: run after docs/DB_SUPABASE_DEPLOY.sql or an equivalent core
-- schema that already creates public.proyek and public.perusahaan.
-- Status: draft migration. Review before running in Supabase.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('owner_admin', 'tenaga_ahli');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.ahsp_component_type AS ENUM ('upah', 'bahan', 'alat');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.rab_status AS ENUM ('draft', 'review', 'validated', 'final');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- App user profile. auth.users remains the auth source; this table stores app-level role.
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  nama text NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'tenaga_ahli',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_owner_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_app_role() = 'owner_admin'::public.app_role
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, nama, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'tenaga_ahli'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nama = CASE WHEN public.users.nama = '' THEN EXCLUDED.nama ELSE public.users.nama END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_create_app_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_app_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

INSERT INTO public.users (id, email, nama, role)
SELECT
  au.id,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data->>'nama', au.raw_user_meta_data->>'name', split_part(COALESCE(au.email, ''), '@', 1), ''),
  'tenaga_ahli'
FROM auth.users au
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    nama = CASE WHEN public.users.nama = '' THEN EXCLUDED.nama ELSE public.users.nama END;

-- Commercial/internal project fields should live outside public.proyek.
-- RLS cannot hide individual columns reliably from direct API access.
--
-- Important:
-- Existing columns such as public.proyek.nilai_penawaran and public.proyek.catatan
-- must be migrated or reclassified before Tenaga Ahli access is enabled in production.
-- This draft does not rewrite public.proyek policies yet because the active UI still
-- reads those columns directly.
CREATE TABLE IF NOT EXISTS public.proyek_internal (
  proyek_id uuid PRIMARY KEY REFERENCES public.proyek(id) ON DELETE CASCADE,
  nilai_kontrak_jasa numeric CHECK (nilai_kontrak_jasa IS NULL OR nilai_kontrak_jasa >= 0),
  termin_pembayaran jsonb NOT NULL DEFAULT '[]'::jsonb,
  piutang numeric CHECK (piutang IS NULL OR piutang >= 0),
  honor_tim jsonb NOT NULL DEFAULT '[]'::jsonb,
  catatan_internal text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Assignment table needed before Tenaga Ahli access can be limited per project.
CREATE TABLE IF NOT EXISTS public.project_assignments (
  proyek_id uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (proyek_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.satuan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_satuan text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kategori_pekerjaan_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kategori text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.master_upah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_upah text NOT NULL,
  satuan_id uuid NOT NULL REFERENCES public.satuan(id),
  harga_dasar numeric NOT NULL CHECK (harga_dasar >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.master_bahan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_bahan text NOT NULL,
  satuan_id uuid NOT NULL REFERENCES public.satuan(id),
  harga_dasar numeric NOT NULL CHECK (harga_dasar >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.master_alat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_alat text NOT NULL,
  satuan_id uuid NOT NULL REFERENCES public.satuan(id),
  harga_dasar numeric NOT NULL CHECK (harga_dasar >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ahsp_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_analisa text NOT NULL UNIQUE,
  uraian_pekerjaan text NOT NULL,
  kategori_id uuid NOT NULL REFERENCES public.kategori_pekerjaan_master(id),
  satuan_id uuid NOT NULL REFERENCES public.satuan(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ahsp_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ahsp_item_id uuid NOT NULL REFERENCES public.ahsp_items(id) ON DELETE CASCADE,
  komponen_tipe public.ahsp_component_type NOT NULL,
  upah_id uuid REFERENCES public.master_upah(id),
  bahan_id uuid REFERENCES public.master_bahan(id),
  alat_id uuid REFERENCES public.master_alat(id),
  koefisien numeric NOT NULL CHECK (koefisien > 0),
  CONSTRAINT ahsp_details_exact_component CHECK (
    (komponen_tipe = 'upah' AND upah_id IS NOT NULL AND bahan_id IS NULL AND alat_id IS NULL)
    OR (komponen_tipe = 'bahan' AND upah_id IS NULL AND bahan_id IS NOT NULL AND alat_id IS NULL)
    OR (komponen_tipe = 'alat' AND upah_id IS NULL AND bahan_id IS NULL AND alat_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.rab_rekap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyek_id uuid NOT NULL UNIQUE REFERENCES public.proyek(id) ON DELETE CASCADE,
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  margin_persen numeric NOT NULL DEFAULT 0 CHECK (margin_persen >= 0),
  overhead_persen numeric NOT NULL DEFAULT 0 CHECK (overhead_persen >= 0),
  ppn_persen numeric NOT NULL DEFAULT 11 CHECK (ppn_persen >= 0),
  pembulatan_rule text,
  total_final numeric NOT NULL DEFAULT 0 CHECK (total_final >= 0),
  status public.rab_status NOT NULL DEFAULT 'draft',
  validated_by uuid REFERENCES public.users(id),
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rab_draft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyek_id uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  ahsp_item_id uuid NOT NULL REFERENCES public.ahsp_items(id),
  volume numeric NOT NULL CHECK (volume > 0),
  harga_satuan numeric NOT NULL CHECK (harga_satuan >= 0),
  jumlah_harga numeric NOT NULL CHECK (jumlah_harga >= 0),
  urutan integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rab_draft_jumlah_matches_volume CHECK (jumlah_harga = volume * harga_satuan)
);

CREATE TABLE IF NOT EXISTS public.rab_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rab_draft_id uuid REFERENCES public.rab_draft(id) ON DELETE SET NULL,
  rab_rekap_id uuid REFERENCES public.rab_rekap(id) ON DELETE SET NULL,
  proyek_id uuid REFERENCES public.proyek(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  aksi text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rab_audit_log_target CHECK (
    rab_draft_id IS NOT NULL OR rab_rekap_id IS NOT NULL OR proyek_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS proyek_internal_updated_at_idx ON public.proyek_internal(updated_at);
CREATE INDEX IF NOT EXISTS project_assignments_user_id_idx ON public.project_assignments(user_id);
CREATE INDEX IF NOT EXISTS satuan_nama_satuan_idx ON public.satuan(nama_satuan);
CREATE INDEX IF NOT EXISTS kategori_pekerjaan_master_nama_idx ON public.kategori_pekerjaan_master(nama_kategori);
CREATE INDEX IF NOT EXISTS master_upah_satuan_id_idx ON public.master_upah(satuan_id);
CREATE INDEX IF NOT EXISTS master_bahan_satuan_id_idx ON public.master_bahan(satuan_id);
CREATE INDEX IF NOT EXISTS master_alat_satuan_id_idx ON public.master_alat(satuan_id);
CREATE INDEX IF NOT EXISTS ahsp_items_kategori_id_idx ON public.ahsp_items(kategori_id);
CREATE INDEX IF NOT EXISTS ahsp_items_satuan_id_idx ON public.ahsp_items(satuan_id);
CREATE INDEX IF NOT EXISTS ahsp_details_ahsp_item_id_idx ON public.ahsp_details(ahsp_item_id);
CREATE INDEX IF NOT EXISTS ahsp_details_upah_id_idx ON public.ahsp_details(upah_id);
CREATE INDEX IF NOT EXISTS ahsp_details_bahan_id_idx ON public.ahsp_details(bahan_id);
CREATE INDEX IF NOT EXISTS ahsp_details_alat_id_idx ON public.ahsp_details(alat_id);
CREATE INDEX IF NOT EXISTS rab_draft_proyek_id_idx ON public.rab_draft(proyek_id);
CREATE INDEX IF NOT EXISTS rab_draft_ahsp_item_id_idx ON public.rab_draft(ahsp_item_id);
CREATE INDEX IF NOT EXISTS rab_rekap_proyek_id_idx ON public.rab_rekap(proyek_id);
CREATE INDEX IF NOT EXISTS rab_audit_log_proyek_id_idx ON public.rab_audit_log(proyek_id);
CREATE INDEX IF NOT EXISTS rab_audit_log_user_id_idx ON public.rab_audit_log(user_id);

DROP TRIGGER IF EXISTS set_proyek_internal_updated_at ON public.proyek_internal;
CREATE TRIGGER set_proyek_internal_updated_at
BEFORE UPDATE ON public.proyek_internal
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_master_upah_updated_at ON public.master_upah;
CREATE TRIGGER set_master_upah_updated_at
BEFORE UPDATE ON public.master_upah
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_master_bahan_updated_at ON public.master_bahan;
CREATE TRIGGER set_master_bahan_updated_at
BEFORE UPDATE ON public.master_bahan
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_master_alat_updated_at ON public.master_alat;
CREATE TRIGGER set_master_alat_updated_at
BEFORE UPDATE ON public.master_alat
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_rab_rekap_updated_at ON public.rab_rekap;
CREATE TRIGGER set_rab_rekap_updated_at
BEFORE UPDATE ON public.rab_rekap
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.can_manage_project_rab(target_proyek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_owner_admin()
    OR EXISTS (
      SELECT 1
      FROM public.project_assignments pa
      JOIN public.proyek p ON p.id = pa.proyek_id
      WHERE pa.proyek_id = target_proyek_id
        AND pa.user_id = auth.uid()
        AND p.jenis_pekerjaan = 'Perencanaan'
        AND COALESCE(p.is_deleted, false) = false
    )
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users',
    'proyek_internal',
    'project_assignments',
    'satuan',
    'kategori_pekerjaan_master',
    'master_upah',
    'master_bahan',
    'master_alat',
    'ahsp_items',
    'ahsp_details',
    'rab_draft',
    'rab_rekap',
    'rab_audit_log'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.project_assignments TO authenticated;

GRANT SELECT ON TABLE public.satuan TO authenticated;
GRANT SELECT ON TABLE public.kategori_pekerjaan_master TO authenticated;
GRANT SELECT ON TABLE public.master_upah TO authenticated;
GRANT SELECT ON TABLE public.master_bahan TO authenticated;
GRANT SELECT ON TABLE public.master_alat TO authenticated;
GRANT SELECT ON TABLE public.ahsp_items TO authenticated;
GRANT SELECT ON TABLE public.ahsp_details TO authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE public.satuan TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.kategori_pekerjaan_master TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.master_upah TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.master_bahan TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.master_alat TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.ahsp_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.ahsp_details TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_draft TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_rekap TO authenticated;
GRANT SELECT, INSERT ON TABLE public.rab_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.proyek_internal TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.proyek TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.perusahaan TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dinas_skpd TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.override_log TO authenticated;

-- Users can read their own profile; Owner/Admin can manage all profiles.
DROP POLICY IF EXISTS "users read own or owner" ON public.users;
CREATE POLICY "users read own or owner" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_owner_admin());

DROP POLICY IF EXISTS "users owner write" ON public.users;
CREATE POLICY "users owner write" ON public.users
FOR ALL TO authenticated
USING (public.is_owner_admin())
WITH CHECK (public.is_owner_admin());

-- Commercial fields are Owner/Admin only.
DROP POLICY IF EXISTS "proyek_internal owner only" ON public.proyek_internal;
CREATE POLICY "proyek_internal owner only" ON public.proyek_internal
FOR ALL TO authenticated
USING (public.is_owner_admin())
WITH CHECK (public.is_owner_admin());

DROP POLICY IF EXISTS "project_assignments owner write" ON public.project_assignments;
CREATE POLICY "project_assignments owner write" ON public.project_assignments
FOR ALL TO authenticated
USING (public.is_owner_admin())
WITH CHECK (public.is_owner_admin());

DROP POLICY IF EXISTS "project_assignments read own or owner" ON public.project_assignments;
CREATE POLICY "project_assignments read own or owner" ON public.project_assignments
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_owner_admin());

-- Master data: Tenaga Ahli can read; Owner/Admin can write.
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'satuan',
    'kategori_pekerjaan_master',
    'master_upah',
    'master_bahan',
    'master_alat',
    'ahsp_items',
    'ahsp_details'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "authenticated read %1$s" ON public.%1$I', tbl);
    EXECUTE format('CREATE POLICY "authenticated read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "owner write %1$s" ON public.%1$I', tbl);
    EXECUTE format('CREATE POLICY "owner write %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_owner_admin()) WITH CHECK (public.is_owner_admin())', tbl);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "rab_draft project team read" ON public.rab_draft;
CREATE POLICY "rab_draft project team read" ON public.rab_draft
FOR SELECT TO authenticated
USING (public.can_manage_project_rab(proyek_id));

DROP POLICY IF EXISTS "rab_draft project team write" ON public.rab_draft;
CREATE POLICY "rab_draft project team write" ON public.rab_draft
FOR ALL TO authenticated
USING (public.can_manage_project_rab(proyek_id))
WITH CHECK (public.can_manage_project_rab(proyek_id));

DROP POLICY IF EXISTS "rab_rekap project team read" ON public.rab_rekap;
CREATE POLICY "rab_rekap project team read" ON public.rab_rekap
FOR SELECT TO authenticated
USING (public.can_manage_project_rab(proyek_id));

DROP POLICY IF EXISTS "rab_rekap project team write" ON public.rab_rekap;
CREATE POLICY "rab_rekap project team write" ON public.rab_rekap
FOR ALL TO authenticated
USING (public.can_manage_project_rab(proyek_id))
WITH CHECK (public.can_manage_project_rab(proyek_id));

DROP POLICY IF EXISTS "rab_audit_log project team read" ON public.rab_audit_log;
CREATE POLICY "rab_audit_log project team read" ON public.rab_audit_log
FOR SELECT TO authenticated
USING (public.is_owner_admin() OR public.can_manage_project_rab(proyek_id));

DROP POLICY IF EXISTS "rab_audit_log project team insert" ON public.rab_audit_log;
CREATE POLICY "rab_audit_log project team insert" ON public.rab_audit_log
FOR INSERT TO authenticated
WITH CHECK (public.is_owner_admin() OR public.can_manage_project_rab(proyek_id));

COMMIT;

-- Bootstrap first Owner/Admin after running the migration as a database admin:
-- UPDATE public.users
-- SET role = 'owner_admin', nama = COALESCE(NULLIF(nama, ''), 'Owner Admin')
-- WHERE email = 'owner@example.com';
