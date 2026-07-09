-- ============================================================
-- KONSULTAN APP - PRD CORE RLS DRAFT
--
-- Purpose:
-- Replace old "authenticated can do everything" policies on core tables.
--
-- Status: DRAFT, do not apply until the app no longer exposes commercial
-- fields from public.proyek directly to Tenaga Ahli.
--
-- Reason:
-- public.proyek still contains legacy commercial-ish fields such as
-- nilai_penawaran and catatan. RLS cannot hide individual columns. Before
-- Tenaga Ahli can SELECT public.proyek safely, those fields must either move
-- to public.proyek_internal or the app must read through a technical-only view.
-- ============================================================

BEGIN;

ALTER TABLE public.proyek ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perusahaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.override_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dinas_skpd ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read proyek" ON public.proyek;
DROP POLICY IF EXISTS "authenticated insert proyek" ON public.proyek;
DROP POLICY IF EXISTS "authenticated update proyek" ON public.proyek;
DROP POLICY IF EXISTS "authenticated delete proyek" ON public.proyek;

DROP POLICY IF EXISTS "owner manage proyek" ON public.proyek;
CREATE POLICY "owner manage proyek" ON public.proyek
FOR ALL TO authenticated
USING (public.is_owner_admin())
WITH CHECK (public.is_owner_admin());

-- Add a Tenaga Ahli SELECT policy only after commercial fields are removed
-- from public.proyek or replaced by a technical-only view.
-- CREATE POLICY "assigned technical read proyek" ON public.proyek
-- FOR SELECT TO authenticated
-- USING (
--   public.is_owner_admin()
--   OR EXISTS (
--     SELECT 1
--     FROM public.project_assignments pa
--     WHERE pa.proyek_id = proyek.id
--       AND pa.user_id = auth.uid()
--   )
-- );

DROP POLICY IF EXISTS "authenticated read perusahaan" ON public.perusahaan;
DROP POLICY IF EXISTS "authenticated insert perusahaan" ON public.perusahaan;
DROP POLICY IF EXISTS "authenticated update perusahaan" ON public.perusahaan;
DROP POLICY IF EXISTS "authenticated delete perusahaan" ON public.perusahaan;

DROP POLICY IF EXISTS "owner manage perusahaan" ON public.perusahaan;
CREATE POLICY "owner manage perusahaan" ON public.perusahaan
FOR ALL TO authenticated
USING (public.is_owner_admin())
WITH CHECK (public.is_owner_admin());

DROP POLICY IF EXISTS "authenticated read override_log" ON public.override_log;
DROP POLICY IF EXISTS "authenticated insert override_log" ON public.override_log;
DROP POLICY IF EXISTS "authenticated update override_log" ON public.override_log;
DROP POLICY IF EXISTS "authenticated delete override_log" ON public.override_log;

DROP POLICY IF EXISTS "owner manage override_log" ON public.override_log;
CREATE POLICY "owner manage override_log" ON public.override_log
FOR ALL TO authenticated
USING (public.is_owner_admin())
WITH CHECK (public.is_owner_admin());

DROP POLICY IF EXISTS "authenticated read dinas_skpd" ON public.dinas_skpd;
DROP POLICY IF EXISTS "authenticated insert dinas_skpd" ON public.dinas_skpd;
DROP POLICY IF EXISTS "authenticated update dinas_skpd" ON public.dinas_skpd;
DROP POLICY IF EXISTS "authenticated delete dinas_skpd" ON public.dinas_skpd;

DROP POLICY IF EXISTS "owner manage dinas_skpd" ON public.dinas_skpd;
CREATE POLICY "owner manage dinas_skpd" ON public.dinas_skpd
FOR ALL TO authenticated
USING (public.is_owner_admin())
WITH CHECK (public.is_owner_admin());

DROP POLICY IF EXISTS "authenticated read dinas_skpd" ON public.dinas_skpd;
CREATE POLICY "authenticated read dinas_skpd" ON public.dinas_skpd
FOR SELECT TO authenticated
USING (true);

COMMIT;
