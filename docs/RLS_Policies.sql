-- RLS policies for Konsulindo internal app.
-- Model: every authenticated Supabase user can manage internal app data.
-- Run this after the app has been deployed with authenticated SSR/browser clients.

BEGIN;

ALTER TABLE public.proyek ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perusahaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personil_proyek ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengalaman_perusahaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nomor_surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.override_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_metodologi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termin_pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_proyek ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read proyek" ON public.proyek
FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert proyek" ON public.proyek
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update proyek" ON public.proyek
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read perusahaan" ON public.perusahaan
FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert perusahaan" ON public.perusahaan
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update perusahaan" ON public.perusahaan
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read personil" ON public.personil
FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert personil" ON public.personil
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update personil" ON public.personil
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read personil_proyek" ON public.personil_proyek
FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert personil_proyek" ON public.personil_proyek
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update personil_proyek" ON public.personil_proyek
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read pengalaman_perusahaan" ON public.pengalaman_perusahaan
FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert pengalaman_perusahaan" ON public.pengalaman_perusahaan
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update pengalaman_perusahaan" ON public.pengalaman_perusahaan
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read nomor_surat" ON public.nomor_surat
FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert nomor_surat" ON public.nomor_surat
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update nomor_surat" ON public.nomor_surat
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read override_log" ON public.override_log
FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert override_log" ON public.override_log
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update override_log" ON public.override_log
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read template_metodologi" ON public.template_metodologi
FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert template_metodologi" ON public.template_metodologi
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update template_metodologi" ON public.template_metodologi
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read termin_pembayaran" ON public.termin_pembayaran
FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert termin_pembayaran" ON public.termin_pembayaran
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update termin_pembayaran" ON public.termin_pembayaran
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read checklist_proyek" ON public.checklist_proyek
FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert checklist_proyek" ON public.checklist_proyek
FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update checklist_proyek" ON public.checklist_proyek
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

COMMIT;
