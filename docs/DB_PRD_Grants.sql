-- ============================================================
-- KONSULTAN APP - PRD TABLE GRANTS
-- Purpose:
-- Supabase/PostgREST needs table privileges in addition to RLS policies.
-- RLS decides which rows/actions are allowed; GRANT makes the table visible
-- to the API role in the first place.
--
-- Target: staging first.
-- Safe to re-run.
-- ============================================================

BEGIN;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- App profile and role checks.
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.project_assignments TO authenticated;

-- Read-only reference data for Tenaga Ahli and Owner/Admin.
GRANT SELECT ON TABLE public.satuan TO authenticated;
GRANT SELECT ON TABLE public.kategori_pekerjaan_master TO authenticated;
GRANT SELECT ON TABLE public.master_upah TO authenticated;
GRANT SELECT ON TABLE public.master_bahan TO authenticated;
GRANT SELECT ON TABLE public.master_alat TO authenticated;
GRANT SELECT ON TABLE public.ahsp_items TO authenticated;
GRANT SELECT ON TABLE public.ahsp_details TO authenticated;

-- Owner/Admin writes are still constrained by RLS policies.
GRANT INSERT, UPDATE, DELETE ON TABLE public.satuan TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.kategori_pekerjaan_master TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.master_upah TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.master_bahan TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.master_alat TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.ahsp_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.ahsp_details TO authenticated;

-- RAB tables: assigned project team/Owner access is constrained by RLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_draft TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_rekap TO authenticated;
GRANT SELECT, INSERT ON TABLE public.rab_audit_log TO authenticated;

-- RAB Maker snapshot tables. These may not exist before the snapshot migration,
-- so the grants are guarded for repeatable execution.
DO $$
BEGIN
  IF to_regclass('public.rab_maker') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_maker TO authenticated;
  END IF;

  IF to_regclass('public.rab_maker_sections') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_maker_sections TO authenticated;
  END IF;

  IF to_regclass('public.rab_maker_items') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_maker_items TO authenticated;
  END IF;

  IF to_regclass('public.rab_maker_item_details') IS NOT NULL THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rab_maker_item_details TO authenticated;
  END IF;
END $$;

-- Owner-only internal commercial table; RLS restricts actual access.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.proyek_internal TO authenticated;

-- Existing internal database tables used by the owner-only Database Internal tab.
-- RLS/policies decide whether the authenticated user is Owner/Admin.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.proyek TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.perusahaan TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dinas_skpd TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.override_log TO authenticated;

DO $$
BEGIN
  IF to_regprocedure('public.get_assigned_proyek_teknis(uuid)') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.get_assigned_proyek_teknis(uuid) TO authenticated;
  END IF;
END $$;

COMMIT;
