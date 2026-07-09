-- RLS policies for Konsulindo internal app.
-- Model: every authenticated Supabase user can manage active app data.
-- Active monitoring schema: perusahaan, proyek, override_log, dinas_skpd.
-- Run this after the schema in docs/DB_SUPABASE_DEPLOY.sql exists.

BEGIN;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'perusahaan',
    'proyek',
    'override_log',
    'dinas_skpd'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "authenticated read %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated insert %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated update %1$s" ON public.%1$I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated delete %1$s" ON public.%1$I', tbl);

    EXECUTE format('CREATE POLICY "authenticated read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', tbl);
    EXECUTE format('CREATE POLICY "authenticated insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "authenticated update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', tbl);
    EXECUTE format('CREATE POLICY "authenticated delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (true)', tbl);
  END LOOP;
END $$;

COMMIT;
