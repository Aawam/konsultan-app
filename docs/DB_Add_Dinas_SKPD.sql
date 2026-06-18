-- ============================================================
-- DB ADD DINAS_SKPD
-- Tanggal: 2026-06-18
--
-- Jalankan di Supabase SQL Editor sebelum memakai CRUD Dinas/SKPD.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.dinas_skpd (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_dinas text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dinas_skpd ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read dinas_skpd" ON public.dinas_skpd;
DROP POLICY IF EXISTS "authenticated insert dinas_skpd" ON public.dinas_skpd;
DROP POLICY IF EXISTS "authenticated update dinas_skpd" ON public.dinas_skpd;
DROP POLICY IF EXISTS "authenticated delete dinas_skpd" ON public.dinas_skpd;

CREATE POLICY "authenticated read dinas_skpd" ON public.dinas_skpd
FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated insert dinas_skpd" ON public.dinas_skpd
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated update dinas_skpd" ON public.dinas_skpd
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated delete dinas_skpd" ON public.dinas_skpd
FOR DELETE TO authenticated USING (true);

INSERT INTO public.dinas_skpd (nama_dinas)
SELECT DISTINCT trim(dinas)
FROM public.proyek
WHERE dinas IS NOT NULL
  AND trim(dinas) <> ''
ON CONFLICT (nama_dinas) DO NOTHING;

COMMIT;
