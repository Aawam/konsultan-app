-- ============================================================
-- KONSULTAN APP - RAB MAKER SNAPSHOT MODEL DRAFT
-- Purpose:
-- 1. Treat Masterfile AHSP as a default template.
-- 2. Treat RAB Maker as a per-project snapshot copy.
-- 3. Lock coefficients after copy while allowing price/profit override.
--
-- Status: DRAFT ONLY. Do not run before Step 6 core RLS is finalized.
-- Target: staging first.
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

-- Masterfile AHSP default profit per uraian pekerjaan.
ALTER TABLE public.ahsp_items
ADD COLUMN IF NOT EXISTS profit_persen_default numeric NOT NULL DEFAULT 0
CHECK (profit_persen_default >= 0);

ALTER TABLE public.ahsp_items
ADD COLUMN IF NOT EXISTS bidang text NOT NULL DEFAULT 'CK'
CHECK (bidang IN ('CK', 'SDA')),
ADD COLUMN IF NOT EXISTS sub_bidang text;

-- RAB Maker header: one maker per Perencanaan project.
CREATE TABLE IF NOT EXISTS public.rab_maker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyek_id uuid NOT NULL UNIQUE REFERENCES public.proyek(id) ON DELETE CASCADE,
  status public.rab_status NOT NULL DEFAULT 'draft',
  ppn_persen numeric NOT NULL DEFAULT 11 CHECK (ppn_persen >= 0),
  pembulatan_rule text,
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  ppn_nilai numeric NOT NULL DEFAULT 0 CHECK (ppn_nilai >= 0),
  total_final numeric NOT NULL DEFAULT 0 CHECK (total_final >= 0),
  created_by uuid NOT NULL REFERENCES public.users(id),
  validated_by uuid REFERENCES public.users(id),
  validated_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Optional grouping copied into each project RAB. This is the project RAB template layer.
CREATE TABLE IF NOT EXISTS public.rab_maker_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rab_maker_id uuid NOT NULL REFERENCES public.rab_maker(id) ON DELETE CASCADE,
  kode_section text,
  nama_section text NOT NULL,
  urutan integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rab_maker_id, urutan)
);

-- Snapshot item copied from Masterfile AHSP.
CREATE TABLE IF NOT EXISTS public.rab_maker_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rab_maker_id uuid NOT NULL REFERENCES public.rab_maker(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.rab_maker_sections(id) ON DELETE SET NULL,
  source_ahsp_item_id uuid REFERENCES public.ahsp_items(id) ON DELETE SET NULL,

  kode_analisa_snapshot text NOT NULL,
  uraian_pekerjaan_snapshot text NOT NULL,
  bidang_snapshot text,
  sub_bidang_snapshot text,
  kategori_snapshot text,
  satuan_snapshot text NOT NULL,

  volume numeric NOT NULL DEFAULT 0 CHECK (volume >= 0),
  profit_persen_default numeric NOT NULL DEFAULT 0 CHECK (profit_persen_default >= 0),
  profit_persen_final numeric NOT NULL DEFAULT 0 CHECK (profit_persen_final >= 0),
  profit_override_reason text,

  harga_dasar_total numeric NOT NULL DEFAULT 0 CHECK (harga_dasar_total >= 0),
  profit_nilai numeric NOT NULL DEFAULT 0 CHECK (profit_nilai >= 0),
  harga_satuan numeric NOT NULL DEFAULT 0 CHECK (harga_satuan >= 0),
  jumlah_harga numeric NOT NULL DEFAULT 0 CHECK (jumlah_harga >= 0),

  koefisien_locked boolean NOT NULL DEFAULT true,
  urutan integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rab_maker_items_profit_reason_required CHECK (
    profit_persen_final = profit_persen_default OR profit_override_reason IS NOT NULL
  ),
  CONSTRAINT rab_maker_items_amount_matches CHECK (
    jumlah_harga = volume * harga_satuan
  )
);

ALTER TABLE public.rab_maker_items
ADD COLUMN IF NOT EXISTS bidang_snapshot text,
ADD COLUMN IF NOT EXISTS sub_bidang_snapshot text;

-- Snapshot details copied from Masterfile AHSP details.
CREATE TABLE IF NOT EXISTS public.rab_maker_item_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rab_maker_item_id uuid NOT NULL REFERENCES public.rab_maker_items(id) ON DELETE CASCADE,
  source_ahsp_detail_id uuid REFERENCES public.ahsp_details(id) ON DELETE SET NULL,

  komponen_tipe public.ahsp_component_type NOT NULL,
  source_upah_id uuid REFERENCES public.master_upah(id) ON DELETE SET NULL,
  source_bahan_id uuid REFERENCES public.master_bahan(id) ON DELETE SET NULL,
  source_alat_id uuid REFERENCES public.master_alat(id) ON DELETE SET NULL,

  nama_komponen_snapshot text NOT NULL,
  satuan_snapshot text NOT NULL,
  koefisien_snapshot numeric NOT NULL CHECK (koefisien_snapshot > 0),
  koefisien_locked boolean NOT NULL DEFAULT true,

  harga_dasar_default numeric NOT NULL CHECK (harga_dasar_default >= 0),
  harga_dasar_final numeric NOT NULL CHECK (harga_dasar_final >= 0),
  harga_override_reason text,

  jumlah_harga_dasar numeric NOT NULL DEFAULT 0 CHECK (jumlah_harga_dasar >= 0),
  urutan integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rab_maker_item_details_source_matches_type CHECK (
    (komponen_tipe = 'upah' AND source_upah_id IS NOT NULL AND source_bahan_id IS NULL AND source_alat_id IS NULL)
    OR (komponen_tipe = 'bahan' AND source_upah_id IS NULL AND source_bahan_id IS NOT NULL AND source_alat_id IS NULL)
    OR (komponen_tipe = 'alat' AND source_upah_id IS NULL AND source_bahan_id IS NULL AND source_alat_id IS NOT NULL)
  ),
  CONSTRAINT rab_maker_item_details_override_reason_required CHECK (
    harga_dasar_final = harga_dasar_default OR harga_override_reason IS NOT NULL
  ),
  CONSTRAINT rab_maker_item_details_amount_matches CHECK (
    jumlah_harga_dasar = koefisien_snapshot * harga_dasar_final
  )
);

-- Allow audit log to reference the new snapshot model without losing old compatibility.
ALTER TABLE public.rab_audit_log
ADD COLUMN IF NOT EXISTS rab_maker_id uuid REFERENCES public.rab_maker(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rab_maker_item_id uuid REFERENCES public.rab_maker_items(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rab_maker_item_detail_id uuid REFERENCES public.rab_maker_item_details(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ahsp_items_profit_default_idx ON public.ahsp_items(profit_persen_default);
CREATE INDEX IF NOT EXISTS ahsp_items_bidang_idx ON public.ahsp_items(bidang);
CREATE INDEX IF NOT EXISTS rab_maker_proyek_id_idx ON public.rab_maker(proyek_id);
CREATE INDEX IF NOT EXISTS rab_maker_sections_maker_idx ON public.rab_maker_sections(rab_maker_id);
CREATE INDEX IF NOT EXISTS rab_maker_items_maker_idx ON public.rab_maker_items(rab_maker_id);
CREATE INDEX IF NOT EXISTS rab_maker_items_source_ahsp_idx ON public.rab_maker_items(source_ahsp_item_id);
CREATE INDEX IF NOT EXISTS rab_maker_item_details_item_idx ON public.rab_maker_item_details(rab_maker_item_id);
CREATE INDEX IF NOT EXISTS rab_maker_item_details_source_idx ON public.rab_maker_item_details(source_ahsp_detail_id);
CREATE INDEX IF NOT EXISTS rab_audit_log_rab_maker_idx ON public.rab_audit_log(rab_maker_id);
CREATE INDEX IF NOT EXISTS rab_audit_log_rab_maker_item_idx ON public.rab_audit_log(rab_maker_item_id);

DROP TRIGGER IF EXISTS set_rab_maker_updated_at ON public.rab_maker;
CREATE TRIGGER set_rab_maker_updated_at
BEFORE UPDATE ON public.rab_maker
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_rab_maker_items_updated_at ON public.rab_maker_items;
CREATE TRIGGER set_rab_maker_items_updated_at
BEFORE UPDATE ON public.rab_maker_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_rab_maker_item_details_updated_at ON public.rab_maker_item_details;
CREATE TRIGGER set_rab_maker_item_details_updated_at
BEFORE UPDATE ON public.rab_maker_item_details
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'rab_maker',
    'rab_maker_sections',
    'rab_maker_items',
    'rab_maker_item_details'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_maker TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_maker_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_maker_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_maker_item_details TO authenticated;

DROP POLICY IF EXISTS "rab_maker project team read" ON public.rab_maker;
CREATE POLICY "rab_maker project team read" ON public.rab_maker
FOR SELECT TO authenticated
USING (public.can_manage_project_rab(proyek_id));

DROP POLICY IF EXISTS "rab_maker project team write" ON public.rab_maker;
CREATE POLICY "rab_maker project team write" ON public.rab_maker
FOR ALL TO authenticated
USING (public.can_manage_project_rab(proyek_id))
WITH CHECK (public.can_manage_project_rab(proyek_id));

DROP POLICY IF EXISTS "rab_maker_sections project team read" ON public.rab_maker_sections;
CREATE POLICY "rab_maker_sections project team read" ON public.rab_maker_sections
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rab_maker rm
    WHERE rm.id = rab_maker_sections.rab_maker_id
      AND public.can_manage_project_rab(rm.proyek_id)
  )
);

DROP POLICY IF EXISTS "rab_maker_sections project team write" ON public.rab_maker_sections;
CREATE POLICY "rab_maker_sections project team write" ON public.rab_maker_sections
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rab_maker rm
    WHERE rm.id = rab_maker_sections.rab_maker_id
      AND public.can_manage_project_rab(rm.proyek_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rab_maker rm
    WHERE rm.id = rab_maker_sections.rab_maker_id
      AND public.can_manage_project_rab(rm.proyek_id)
  )
);

DROP POLICY IF EXISTS "rab_maker_items project team read" ON public.rab_maker_items;
CREATE POLICY "rab_maker_items project team read" ON public.rab_maker_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rab_maker rm
    WHERE rm.id = rab_maker_items.rab_maker_id
      AND public.can_manage_project_rab(rm.proyek_id)
  )
);

DROP POLICY IF EXISTS "rab_maker_items project team write" ON public.rab_maker_items;
CREATE POLICY "rab_maker_items project team write" ON public.rab_maker_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rab_maker rm
    WHERE rm.id = rab_maker_items.rab_maker_id
      AND public.can_manage_project_rab(rm.proyek_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rab_maker rm
    WHERE rm.id = rab_maker_items.rab_maker_id
      AND public.can_manage_project_rab(rm.proyek_id)
  )
);

DROP POLICY IF EXISTS "rab_maker_item_details project team read" ON public.rab_maker_item_details;
CREATE POLICY "rab_maker_item_details project team read" ON public.rab_maker_item_details
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.rab_maker_items rmi
    JOIN public.rab_maker rm ON rm.id = rmi.rab_maker_id
    WHERE rmi.id = rab_maker_item_details.rab_maker_item_id
      AND public.can_manage_project_rab(rm.proyek_id)
  )
);

DROP POLICY IF EXISTS "rab_maker_item_details project team write" ON public.rab_maker_item_details;
CREATE POLICY "rab_maker_item_details project team write" ON public.rab_maker_item_details
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.rab_maker_items rmi
    JOIN public.rab_maker rm ON rm.id = rmi.rab_maker_id
    WHERE rmi.id = rab_maker_item_details.rab_maker_item_id
      AND public.can_manage_project_rab(rm.proyek_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.rab_maker_items rmi
    JOIN public.rab_maker rm ON rm.id = rmi.rab_maker_id
    WHERE rmi.id = rab_maker_item_details.rab_maker_item_id
      AND public.can_manage_project_rab(rm.proyek_id)
  )
);

COMMIT;
