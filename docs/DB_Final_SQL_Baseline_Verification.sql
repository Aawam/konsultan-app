-- ============================================================
-- FINAL SQL BASELINE VERIFICATION
-- Run with psql -X -v ON_ERROR_STOP=1 after migration 20260717190000.
-- Creates isolated fixtures and rolls every mutation back.
-- ============================================================

BEGIN;

CREATE TEMP TABLE verification_numeric_template (value numeric) ON COMMIT DROP;
ALTER TABLE verification_numeric_template
  ADD CONSTRAINT verification_numeric_template_finite
  CHECK (value NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric));

DO $$
DECLARE
  invalid_constraint text;
  unsafe_function text;
  exposed_function text;
  invalid_policy text;
  target record;
  has_nonfinite boolean;
  expected_finite_expression text;
BEGIN
  SELECT pg_get_expr(c.conbin, c.conrelid)
  INTO expected_finite_expression
  FROM pg_constraint c
  WHERE c.conrelid = 'verification_numeric_template'::regclass
    AND c.conname = 'verification_numeric_template_finite';

  WITH expected(table_name, column_name, constraint_name) AS (
    VALUES
      ('proyek', 'pagu_dana', 'proyek_pagu_dana_finite'),
      ('proyek', 'hps', 'proyek_hps_finite'),
      ('proyek', 'nilai_penawaran', 'proyek_nilai_penawaran_finite'),
      ('proyek_internal', 'nilai_kontrak_jasa', 'proyek_internal_nilai_kontrak_jasa_finite'),
      ('proyek_internal', 'piutang', 'proyek_internal_piutang_finite'),
      ('master_upah', 'harga_dasar', 'master_upah_harga_dasar_finite'),
      ('master_bahan', 'harga_dasar', 'master_bahan_harga_dasar_finite'),
      ('master_alat', 'harga_dasar', 'master_alat_harga_dasar_finite'),
      ('ahsp_items', 'profit_persen_default', 'ahsp_items_profit_persen_default_finite'),
      ('ahsp_details', 'koefisien', 'ahsp_details_koefisien_finite'),
      ('rab_maker', 'ppn_persen', 'rab_maker_ppn_persen_finite'),
      ('rab_maker', 'subtotal', 'rab_maker_subtotal_finite'),
      ('rab_maker', 'ppn_nilai', 'rab_maker_ppn_nilai_finite'),
      ('rab_maker', 'total_final', 'rab_maker_total_final_finite'),
      ('rab_maker_items', 'volume', 'rab_maker_items_volume_finite'),
      ('rab_maker_items', 'profit_persen_default', 'rab_maker_items_profit_default_finite'),
      ('rab_maker_items', 'profit_persen_final', 'rab_maker_items_profit_final_finite'),
      ('rab_maker_items', 'harga_dasar_total', 'rab_maker_items_harga_dasar_total_finite'),
      ('rab_maker_items', 'profit_nilai', 'rab_maker_items_profit_nilai_finite'),
      ('rab_maker_items', 'harga_satuan', 'rab_maker_items_harga_satuan_finite'),
      ('rab_maker_items', 'jumlah_harga', 'rab_maker_items_jumlah_harga_finite'),
      ('rab_maker_item_details', 'koefisien_snapshot', 'rab_maker_item_details_koefisien_finite'),
      ('rab_maker_item_details', 'harga_dasar_default', 'rab_maker_item_details_harga_default_finite'),
      ('rab_maker_item_details', 'harga_dasar_final', 'rab_maker_item_details_harga_final_finite'),
      ('rab_maker_item_details', 'jumlah_harga_dasar', 'rab_maker_item_details_jumlah_finite')
  )
  SELECT expected.constraint_name
  INTO invalid_constraint
  FROM expected
  LEFT JOIN pg_namespace n ON n.nspname = 'public'
  LEFT JOIN pg_class t
    ON t.relnamespace = n.oid
   AND t.relname = expected.table_name
  LEFT JOIN pg_attribute a
    ON a.attrelid = t.oid
   AND a.attname = expected.column_name
   AND NOT a.attisdropped
  LEFT JOIN pg_constraint c
    ON c.conrelid = t.oid
   AND c.conname = expected.constraint_name
   AND c.contype = 'c'
  WHERE c.oid IS NULL
    OR NOT c.convalidated
    OR c.conkey IS DISTINCT FROM ARRAY[a.attnum]::smallint[]
    OR replace(
      pg_get_expr(c.conbin, c.conrelid),
      quote_ident(expected.column_name),
      'value'
    ) IS DISTINCT FROM expected_finite_expression
  LIMIT 1;

  IF invalid_constraint IS NOT NULL THEN
    RAISE EXCEPTION 'Missing, unvalidated, or incorrectly bound finite constraint: %', invalid_constraint;
  END IF;

  FOR target IN
    SELECT table_name, column_name
    FROM (VALUES
      ('proyek', 'pagu_dana'),
      ('proyek', 'hps'),
      ('proyek', 'nilai_penawaran'),
      ('proyek_internal', 'nilai_kontrak_jasa'),
      ('proyek_internal', 'piutang'),
      ('master_upah', 'harga_dasar'),
      ('master_bahan', 'harga_dasar'),
      ('master_alat', 'harga_dasar'),
      ('ahsp_items', 'profit_persen_default'),
      ('ahsp_details', 'koefisien'),
      ('rab_maker', 'ppn_persen'),
      ('rab_maker', 'subtotal'),
      ('rab_maker', 'ppn_nilai'),
      ('rab_maker', 'total_final'),
      ('rab_maker_items', 'volume'),
      ('rab_maker_items', 'profit_persen_default'),
      ('rab_maker_items', 'profit_persen_final'),
      ('rab_maker_items', 'harga_dasar_total'),
      ('rab_maker_items', 'profit_nilai'),
      ('rab_maker_items', 'harga_satuan'),
      ('rab_maker_items', 'jumlah_harga'),
      ('rab_maker_item_details', 'koefisien_snapshot'),
      ('rab_maker_item_details', 'harga_dasar_default'),
      ('rab_maker_item_details', 'harga_dasar_final'),
      ('rab_maker_item_details', 'jumlah_harga_dasar')
    ) AS numeric_column(table_name, column_name)
  LOOP
    EXECUTE format(
      'SELECT EXISTS (SELECT 1 FROM public.%I WHERE lower(%I::text) IN (''nan'', ''infinity'', ''-infinity''))',
      target.table_name,
      target.column_name
    )
    INTO has_nonfinite;

    IF has_nonfinite THEN
      RAISE EXCEPTION 'Non-finite value remains in public.%.%.', target.table_name, target.column_name;
    END IF;
  END LOOP;

  SELECT p.oid::regprocedure::text
  INTO unsafe_function
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND (p.proconfig IS NULL OR NOT ('search_path=pg_catalog' = ANY(p.proconfig)))
  ORDER BY p.oid
  LIMIT 1;

  IF unsafe_function IS NOT NULL THEN
    RAISE EXCEPTION 'SECURITY DEFINER does not enforce search_path=pg_catalog: %', unsafe_function;
  END IF;

  SELECT p.oid::regprocedure::text
  INTO exposed_function
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND (
      has_function_privilege('public', p.oid, 'EXECUTE')
      OR has_function_privilege('anon', p.oid, 'EXECUTE')
    )
  ORDER BY p.oid
  LIMIT 1;

  IF exposed_function IS NOT NULL THEN
    RAISE EXCEPTION 'Public function remains executable by PUBLIC/anon: %', exposed_function;
  END IF;

  WITH expected(table_name, policy_name) AS (
    VALUES
      ('rab_maker', 'rab_maker project team read'),
      ('rab_maker_sections', 'rab_maker_sections project team read'),
      ('rab_maker_items', 'rab_maker_items project team read'),
      ('rab_maker_item_details', 'rab_maker_item_details project team read'),
      ('rab_audit_log', 'rab_audit_log project team read'),
      ('rab_export_history', 'rab_export_history project team read')
  )
  SELECT expected.table_name
  INTO invalid_policy
  FROM expected
  LEFT JOIN pg_class t
    ON t.relnamespace = 'public'::regnamespace
   AND t.relname = expected.table_name
  LEFT JOIN pg_policies p
    ON p.schemaname = 'public'
   AND p.tablename = expected.table_name
   AND p.policyname = expected.policy_name
   AND p.cmd = 'SELECT'
  WHERE t.oid IS NULL
    OR NOT t.relrowsecurity
    OR p.policyname IS NULL
    OR COALESCE(p.qual, '') NOT ILIKE '%can_access_project_rab%'
    OR (
      SELECT count(*)
      FROM pg_policies extra
      WHERE extra.schemaname = 'public'
        AND extra.tablename = expected.table_name
        AND extra.cmd IN ('SELECT', 'ALL')
    ) <> 1
  LIMIT 1;

  IF invalid_policy IS NOT NULL THEN
    RAISE EXCEPTION 'Missing, permissive, duplicated, or disabled RAB read policy on public.%', invalid_policy;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd IN ('SELECT', 'ALL')
      AND (
        COALESCE(qual, '') ILIKE '%can_manage_project_rab%'
        OR COALESCE(with_check, '') ILIKE '%can_manage_project_rab%'
      )
  ) THEN
    RAISE EXCEPTION 'A read policy still couples RAB visibility to mutation readiness.';
  END IF;
END
$$;

-- Isolated fixture: no dependency on existing users, projects, or RAB rows.
DO $$
DECLARE
  actor_id uuid := gen_random_uuid();
  member_id uuid := gen_random_uuid();
  company_id uuid := gen_random_uuid();
  project_id uuid := gen_random_uuid();
  denied_project_id uuid := gen_random_uuid();
  maker_id uuid := gen_random_uuid();
  denied_maker_id uuid := gen_random_uuid();
  item_id uuid := gen_random_uuid();
  denied_item_id uuid := gen_random_uuid();
  section_id uuid := gen_random_uuid();
  denied_section_id uuid := gen_random_uuid();
  unit_id uuid := gen_random_uuid();
  wage_id uuid := gen_random_uuid();
  detail_id uuid := gen_random_uuid();
  denied_detail_id uuid := gen_random_uuid();
  audit_id uuid := gen_random_uuid();
  denied_audit_id uuid := gen_random_uuid();
  export_id uuid := gen_random_uuid();
  denied_export_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES
    (actor_id, 'baseline-owner-' || actor_id::text || '@example.invalid', '{}'::jsonb),
    (member_id, 'baseline-member-' || member_id::text || '@example.invalid', '{}'::jsonb);

  UPDATE public.users
  SET role = 'owner_admin'::public.app_role,
      nama = 'Baseline verifier'
  WHERE id = actor_id;

  INSERT INTO public.perusahaan (id, nama_perusahaan, adalah_perusahaan_sendiri)
  VALUES (company_id, 'Baseline verifier', true);

  INSERT INTO public.proyek (
    id,
    nama_proyek,
    paket_pekerjaan_induk,
    jenis_pekerjaan,
    kategori_pekerjaan,
    tahun_anggaran,
    sumber_dana,
    dinas,
    lokasi_kecamatan,
    nama_ppk,
    pagu_dana,
    hps,
    nilai_penawaran,
    perusahaan_id,
    tanggal_mulai,
    tanggal_selesai,
    tahap_progress,
    persentase_progress,
    status_proyek
  )
  VALUES
    (
      project_id,
      'Baseline planning fixture',
      'Baseline verifier',
      'Perencanaan',
      'Gedung',
      2026,
      'APBD',
      'Baseline verifier',
      'Tanjung Redeb',
      'Baseline verifier',
      1,
      1,
      1,
      company_id,
      current_date,
      current_date + 30,
      'Penyusunan Laporan Akhir & RAB',
      80,
      'Work'
    ),
    (
      denied_project_id,
      'Baseline denied fixture',
      'Baseline verifier',
      'Pengawasan',
      'Gedung',
      2026,
      'APBD',
      'Baseline verifier',
      'Tanjung Redeb',
      'Baseline verifier',
      1,
      1,
      1,
      company_id,
      current_date,
      current_date + 30,
      'Penyusunan Laporan Akhir & RAB',
      80,
      'Work'
    );

  INSERT INTO public.rab_maker (id, proyek_id, created_by)
  VALUES
    (maker_id, project_id, actor_id),
    (denied_maker_id, denied_project_id, actor_id);

  INSERT INTO public.rab_maker_sections (id, rab_maker_id, nama_section, urutan)
  VALUES
    (section_id, maker_id, 'Allowed section', 1),
    (denied_section_id, denied_maker_id, 'Denied section', 1);

  INSERT INTO public.rab_maker_items (
    id,
    rab_maker_id,
    kode_analisa_snapshot,
    uraian_pekerjaan_snapshot,
    kategori_snapshot,
    satuan_snapshot,
    volume,
    profit_persen_default,
    profit_persen_final,
    harga_dasar_total,
    profit_nilai,
    harga_satuan,
    jumlah_harga,
    urutan,
    created_by
  )
  VALUES
    (
      item_id,
      maker_id,
      'VERIFY.001',
      'Allowed item',
      'Gedung',
      'LS',
      1,
      0,
      0,
      100,
      0,
      100,
      100,
      1,
      actor_id
    ),
    (
      denied_item_id,
      denied_maker_id,
      'VERIFY.002',
      'Denied item',
      'Gedung',
      'LS',
      1,
      0,
      0,
      100,
      0,
      100,
      100,
      1,
      actor_id
    );

  INSERT INTO public.satuan (id, nama_satuan)
  VALUES (unit_id, 'VERIFY-' || unit_id::text);

  INSERT INTO public.master_upah (id, nama_upah, satuan_id, harga_dasar)
  VALUES (wage_id, 'VERIFY-' || wage_id::text, unit_id, 100);

  INSERT INTO public.rab_maker_item_details (
    id,
    rab_maker_item_id,
    komponen_tipe,
    source_upah_id,
    nama_komponen_snapshot,
    satuan_snapshot,
    koefisien_snapshot,
    harga_dasar_default,
    harga_dasar_final,
    jumlah_harga_dasar,
    urutan
  )
  VALUES
    (detail_id, item_id, 'upah', wage_id, 'Allowed detail', 'LS', 1, 100, 100, 100, 1),
    (denied_detail_id, denied_item_id, 'upah', wage_id, 'Denied detail', 'LS', 1, 100, 100, 100, 1);

  INSERT INTO public.rab_audit_log (
    id, proyek_id, user_id, aksi, rab_maker_id, rab_maker_item_id
  )
  VALUES
    (audit_id, project_id, actor_id, 'verification_allowed', maker_id, item_id),
    (denied_audit_id, denied_project_id, actor_id, 'verification_denied', denied_maker_id, denied_item_id);

  INSERT INTO public.rab_export_history (
    id,
    rab_maker_id,
    proyek_id,
    version_number,
    export_format,
    file_name,
    file_size_bytes,
    exported_by
  )
  VALUES
    (export_id, maker_id, project_id, 1, 'xlsx', 'allowed.xlsx', 1, actor_id),
    (denied_export_id, denied_maker_id, denied_project_id, 1, 'xlsx', 'denied.xlsx', 1, actor_id);

  PERFORM set_config('verification.actor_id', actor_id::text, true);
  PERFORM set_config('verification.member_id', member_id::text, true);
  PERFORM set_config('verification.project_id', project_id::text, true);
  PERFORM set_config('verification.denied_project_id', denied_project_id::text, true);
  PERFORM set_config('verification.maker_id', maker_id::text, true);
  PERFORM set_config('verification.denied_maker_id', denied_maker_id::text, true);
  PERFORM set_config('verification.item_id', item_id::text, true);
  PERFORM set_config('verification.denied_item_id', denied_item_id::text, true);
  PERFORM set_config('verification.section_id', section_id::text, true);
  PERFORM set_config('verification.denied_section_id', denied_section_id::text, true);
  PERFORM set_config('verification.detail_id', detail_id::text, true);
  PERFORM set_config('verification.denied_detail_id', denied_detail_id::text, true);
  PERFORM set_config('verification.audit_id', audit_id::text, true);
  PERFORM set_config('verification.denied_audit_id', denied_audit_id::text, true);
  PERFORM set_config('verification.export_id', export_id::text, true);
  PERFORM set_config('verification.denied_export_id', denied_export_id::text, true);
END
$$;

DO $$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    UPDATE public.rab_maker_items
    SET volume = 'NaN'::numeric,
        jumlah_harga = 'NaN'::numeric
    WHERE id = current_setting('verification.item_id')::uuid;
  EXCEPTION
    WHEN check_violation THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'RAB storage accepted NaN.';
  END IF;

  rejected := false;

  BEGIN
    UPDATE public.proyek
    SET hps = 'Infinity'::numeric
    WHERE id = current_setting('verification.project_id')::uuid;
  EXCEPTION
    WHEN check_violation THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Project storage accepted infinity.';
  END IF;
END
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('verification.member_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  project_id uuid := current_setting('verification.project_id')::uuid;
  maker_id uuid := current_setting('verification.maker_id')::uuid;
  denied_maker_id uuid := current_setting('verification.denied_maker_id')::uuid;
  item_id uuid := current_setting('verification.item_id')::uuid;
  denied_item_id uuid := current_setting('verification.denied_item_id')::uuid;
  section_id uuid := current_setting('verification.section_id')::uuid;
  denied_section_id uuid := current_setting('verification.denied_section_id')::uuid;
  detail_id uuid := current_setting('verification.detail_id')::uuid;
  denied_detail_id uuid := current_setting('verification.denied_detail_id')::uuid;
  audit_id uuid := current_setting('verification.audit_id')::uuid;
  denied_audit_id uuid := current_setting('verification.denied_audit_id')::uuid;
  export_id uuid := current_setting('verification.export_id')::uuid;
  denied_export_id uuid := current_setting('verification.denied_export_id')::uuid;
BEGIN
  IF public.can_access_project_rab(project_id) IS DISTINCT FROM true
    OR public.can_manage_project_rab(project_id) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Ready fixture did not pass read and mutation gates.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.rab_maker rm WHERE rm.id = maker_id)
    OR NOT EXISTS (SELECT 1 FROM public.rab_maker_sections rms WHERE rms.id = section_id)
    OR NOT EXISTS (SELECT 1 FROM public.rab_maker_items rmi WHERE rmi.id = item_id)
    OR NOT EXISTS (SELECT 1 FROM public.rab_maker_item_details rmid WHERE rmid.id = detail_id)
    OR NOT EXISTS (SELECT 1 FROM public.rab_audit_log ral WHERE ral.id = audit_id)
    OR NOT EXISTS (SELECT 1 FROM public.rab_export_history reh WHERE reh.id = export_id) THEN
    RAISE EXCEPTION 'Allowed planning fixture is not visible through every RAB read policy.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.rab_maker rm WHERE rm.id = denied_maker_id)
    OR EXISTS (SELECT 1 FROM public.rab_maker_sections rms WHERE rms.id = denied_section_id)
    OR EXISTS (SELECT 1 FROM public.rab_maker_items rmi WHERE rmi.id = denied_item_id)
    OR EXISTS (SELECT 1 FROM public.rab_maker_item_details rmid WHERE rmid.id = denied_detail_id)
    OR EXISTS (SELECT 1 FROM public.rab_audit_log ral WHERE ral.id = denied_audit_id)
    OR EXISTS (SELECT 1 FROM public.rab_export_history reh WHERE reh.id = denied_export_id) THEN
    RAISE EXCEPTION 'Denied non-planning fixture bypassed a RAB read policy.';
  END IF;
END
$$;

RESET ROLE;

UPDATE public.proyek
SET tahap_progress = 'Persiapan & Pengumpulan Data',
    persentase_progress = 20
WHERE id = current_setting('verification.project_id')::uuid;

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  project_id uuid := current_setting('verification.project_id')::uuid;
  maker_id uuid := current_setting('verification.maker_id')::uuid;
  denied_maker_id uuid := current_setting('verification.denied_maker_id')::uuid;
  item_id uuid := current_setting('verification.item_id')::uuid;
  denied_item_id uuid := current_setting('verification.denied_item_id')::uuid;
  section_id uuid := current_setting('verification.section_id')::uuid;
  denied_section_id uuid := current_setting('verification.denied_section_id')::uuid;
  detail_id uuid := current_setting('verification.detail_id')::uuid;
  denied_detail_id uuid := current_setting('verification.denied_detail_id')::uuid;
  audit_id uuid := current_setting('verification.audit_id')::uuid;
  denied_audit_id uuid := current_setting('verification.denied_audit_id')::uuid;
  export_id uuid := current_setting('verification.export_id')::uuid;
  denied_export_id uuid := current_setting('verification.denied_export_id')::uuid;
  existing_volume numeric;
  rejected boolean := false;
BEGIN
  IF public.can_access_project_rab(project_id) IS DISTINCT FROM true
    OR public.can_manage_project_rab(project_id) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Read and mutation gates are not separated for an unready project.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.rab_maker rm WHERE rm.id = maker_id)
    OR NOT EXISTS (SELECT 1 FROM public.rab_maker_sections rms WHERE rms.id = section_id)
    OR NOT EXISTS (SELECT 1 FROM public.rab_maker_items rmi WHERE rmi.id = item_id)
    OR NOT EXISTS (SELECT 1 FROM public.rab_maker_item_details rmid WHERE rmid.id = detail_id)
    OR NOT EXISTS (SELECT 1 FROM public.rab_audit_log ral WHERE ral.id = audit_id)
    OR NOT EXISTS (SELECT 1 FROM public.rab_export_history reh WHERE reh.id = export_id) THEN
    RAISE EXCEPTION 'Unready planning fixture lost visibility through a RAB read policy.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.rab_maker rm WHERE rm.id = denied_maker_id)
    OR EXISTS (SELECT 1 FROM public.rab_maker_sections rms WHERE rms.id = denied_section_id)
    OR EXISTS (SELECT 1 FROM public.rab_maker_items rmi WHERE rmi.id = denied_item_id)
    OR EXISTS (SELECT 1 FROM public.rab_maker_item_details rmid WHERE rmid.id = denied_detail_id)
    OR EXISTS (SELECT 1 FROM public.rab_audit_log ral WHERE ral.id = denied_audit_id)
    OR EXISTS (SELECT 1 FROM public.rab_export_history reh WHERE reh.id = denied_export_id) THEN
    RAISE EXCEPTION 'Denied non-planning fixture bypassed a RAB read policy after workflow change.';
  END IF;

  SELECT rmi.volume INTO existing_volume
  FROM public.rab_maker_items rmi
  WHERE rmi.id = item_id;

  BEGIN
    PERFORM public.update_rab_maker_item_volume(item_id, existing_volume);
  EXCEPTION
    WHEN raise_exception THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Direct RAB RPC bypassed readiness.';
  END IF;
END
$$;

RESET ROLE;

UPDATE public.proyek
SET nama_ppk = ''
WHERE id = current_setting('verification.project_id')::uuid;

SELECT set_config('request.jwt.claim.sub', current_setting('verification.actor_id'), true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  rejected boolean := false;
BEGIN
  BEGIN
    PERFORM public.transition_project_workflow_to_rab_ready(
      current_setting('verification.project_id')::uuid,
      'ignored@example.com'
    );
  EXCEPTION
    WHEN check_violation THEN
      rejected := true;
  END;

  IF NOT rejected THEN
    RAISE EXCEPTION 'Workflow RPC advanced a project with incomplete core data.';
  END IF;
END
$$;

RESET ROLE;

ROLLBACK;

SELECT 'final SQL baseline verification passed' AS result;
