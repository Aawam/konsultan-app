-- ============================================================
-- HARDEN AHSP IMPORT REPLAY AND COMPONENT IDENTITY
--
-- 1. Treat a master component as (normalized name, unit), not name alone.
-- 2. Preserve ahsp_details.id when an import replays the same component.
-- 3. Reject ambiguous duplicate master/detail identities.
-- 4. Keep the unchecked implementation private.
-- ============================================================

BEGIN;

SET LOCAL lock_timeout = '10s';

LOCK TABLE
  public.satuan,
  public.kategori_pekerjaan_master,
  public.master_upah,
  public.master_bahan,
  public.master_alat,
  public.ahsp_items,
  public.ahsp_details
IN SHARE ROW EXCLUSIVE MODE;

-- These indexes both document and enforce the identities used by the import.
-- Creation intentionally fails if production contains ambiguous data; it must
-- be reconciled explicitly instead of silently selecting an arbitrary row.
CREATE UNIQUE INDEX IF NOT EXISTS satuan_normalized_name_uidx
  ON public.satuan (lower(regexp_replace(btrim(nama_satuan), '\s+', ' ', 'g')));

CREATE UNIQUE INDEX IF NOT EXISTS kategori_pekerjaan_master_normalized_name_uidx
  ON public.kategori_pekerjaan_master (lower(regexp_replace(btrim(nama_kategori), '\s+', ' ', 'g')));

CREATE UNIQUE INDEX IF NOT EXISTS master_upah_normalized_name_unit_uidx
  ON public.master_upah (
    lower(regexp_replace(btrim(nama_upah), '\s+', ' ', 'g')),
    satuan_id
  );

CREATE UNIQUE INDEX IF NOT EXISTS master_bahan_normalized_name_unit_uidx
  ON public.master_bahan (
    lower(regexp_replace(btrim(nama_bahan), '\s+', ' ', 'g')),
    satuan_id
  );

CREATE UNIQUE INDEX IF NOT EXISTS master_alat_normalized_name_unit_uidx
  ON public.master_alat (
    lower(regexp_replace(btrim(nama_alat), '\s+', ' ', 'g')),
    satuan_id
  );

CREATE UNIQUE INDEX IF NOT EXISTS ahsp_items_normalized_code_uidx
  ON public.ahsp_items (lower(regexp_replace(btrim(kode_analisa), '\s+', ' ', 'g')));

CREATE UNIQUE INDEX IF NOT EXISTS ahsp_details_upah_identity_uidx
  ON public.ahsp_details (ahsp_item_id, upah_id)
  WHERE upah_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ahsp_details_bahan_identity_uidx
  ON public.ahsp_details (ahsp_item_id, bahan_id)
  WHERE bahan_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ahsp_details_alat_identity_uidx
  ON public.ahsp_details (ahsp_item_id, alat_id)
  WHERE alat_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.import_ahsp_masterfile_unchecked(import_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
SET lock_timeout = '10s'
AS $$
DECLARE
  row_data jsonb;
  row_text text;
  detail_data jsonb;
  target_satuan_id uuid;
  target_kategori_id uuid;
  target_master_id uuid;
  target_ahsp_id uuid;
  target_component_id uuid;
  target_detail_id uuid;
  retained_detail_ids uuid[];
  inserted_satuan integer := 0;
  reused_satuan integer := 0;
  inserted_kategori integer := 0;
  reused_kategori integer := 0;
  inserted_upah integer := 0;
  updated_upah integer := 0;
  inserted_bahan integer := 0;
  updated_bahan integer := 0;
  inserted_alat integer := 0;
  updated_alat integer := 0;
  inserted_ahsp integer := 0;
  updated_ahsp integer := 0;
  processed_details integer := 0;
BEGIN
  IF public.is_owner_admin() IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Hanya Owner/Admin yang boleh import AHSP.'
      USING ERRCODE = '42501';
  END IF;

  -- Serialize full-file imports. Direct UI edits remain protected by unique
  -- indexes and row constraints while this prevents two imports interleaving.
  PERFORM pg_advisory_xact_lock(hashtextextended('public.import_ahsp_masterfile', 0));

  -- Direct owner/admin table edits do not participate in the advisory lock.
  -- Take table locks so an import cannot interleave with those writes.
  LOCK TABLE
    public.satuan,
    public.kategori_pekerjaan_master,
    public.master_upah,
    public.master_bahan,
    public.master_alat,
    public.ahsp_items,
    public.ahsp_details
  IN SHARE ROW EXCLUSIVE MODE;

  FOR row_text IN
    SELECT value
    FROM jsonb_array_elements_text(import_payload->'satuan')
  LOOP
    SELECT id
    INTO target_satuan_id
    FROM public.satuan
    WHERE lower(regexp_replace(btrim(nama_satuan), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_text), '\s+', ' ', 'g'));

    IF target_satuan_id IS NULL THEN
      INSERT INTO public.satuan (nama_satuan)
      VALUES (btrim(row_text))
      RETURNING id INTO target_satuan_id;
      inserted_satuan := inserted_satuan + 1;
    ELSE
      reused_satuan := reused_satuan + 1;
    END IF;
  END LOOP;

  FOR row_text IN
    SELECT value
    FROM jsonb_array_elements_text(import_payload->'kategori')
  LOOP
    SELECT id
    INTO target_kategori_id
    FROM public.kategori_pekerjaan_master
    WHERE lower(regexp_replace(btrim(nama_kategori), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_text), '\s+', ' ', 'g'));

    IF target_kategori_id IS NULL THEN
      INSERT INTO public.kategori_pekerjaan_master (nama_kategori)
      VALUES (btrim(row_text))
      RETURNING id INTO target_kategori_id;
      inserted_kategori := inserted_kategori + 1;
    ELSE
      reused_kategori := reused_kategori + 1;
    END IF;
  END LOOP;

  FOR row_data IN
    SELECT value FROM jsonb_array_elements(import_payload->'master'->'upah')
  LOOP
    SELECT id INTO target_satuan_id
    FROM public.satuan
    WHERE lower(regexp_replace(btrim(nama_satuan), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_data->>'satuan'), '\s+', ' ', 'g'));

    IF target_satuan_id IS NULL THEN
      RAISE EXCEPTION 'Satuan upah tidak ditemukan: %', row_data->>'satuan';
    END IF;

    SELECT id INTO target_master_id
    FROM public.master_upah
    WHERE lower(regexp_replace(btrim(nama_upah), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_data->>'nama'), '\s+', ' ', 'g'))
      AND satuan_id = target_satuan_id;

    IF target_master_id IS NULL THEN
      INSERT INTO public.master_upah (nama_upah, satuan_id, harga_dasar)
      VALUES (btrim(row_data->>'nama'), target_satuan_id, (row_data->>'harga_dasar')::numeric)
      RETURNING id INTO target_master_id;
      inserted_upah := inserted_upah + 1;
    ELSE
      UPDATE public.master_upah
      SET nama_upah = btrim(row_data->>'nama'),
          harga_dasar = (row_data->>'harga_dasar')::numeric,
          updated_at = now()
      WHERE id = target_master_id;
      updated_upah := updated_upah + 1;
    END IF;
  END LOOP;

  FOR row_data IN
    SELECT value FROM jsonb_array_elements(import_payload->'master'->'bahan')
  LOOP
    SELECT id INTO target_satuan_id
    FROM public.satuan
    WHERE lower(regexp_replace(btrim(nama_satuan), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_data->>'satuan'), '\s+', ' ', 'g'));

    IF target_satuan_id IS NULL THEN
      RAISE EXCEPTION 'Satuan bahan tidak ditemukan: %', row_data->>'satuan';
    END IF;

    SELECT id INTO target_master_id
    FROM public.master_bahan
    WHERE lower(regexp_replace(btrim(nama_bahan), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_data->>'nama'), '\s+', ' ', 'g'))
      AND satuan_id = target_satuan_id;

    IF target_master_id IS NULL THEN
      INSERT INTO public.master_bahan (nama_bahan, satuan_id, harga_dasar)
      VALUES (btrim(row_data->>'nama'), target_satuan_id, (row_data->>'harga_dasar')::numeric)
      RETURNING id INTO target_master_id;
      inserted_bahan := inserted_bahan + 1;
    ELSE
      UPDATE public.master_bahan
      SET nama_bahan = btrim(row_data->>'nama'),
          harga_dasar = (row_data->>'harga_dasar')::numeric,
          updated_at = now()
      WHERE id = target_master_id;
      updated_bahan := updated_bahan + 1;
    END IF;
  END LOOP;

  FOR row_data IN
    SELECT value FROM jsonb_array_elements(import_payload->'master'->'alat')
  LOOP
    SELECT id INTO target_satuan_id
    FROM public.satuan
    WHERE lower(regexp_replace(btrim(nama_satuan), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_data->>'satuan'), '\s+', ' ', 'g'));

    IF target_satuan_id IS NULL THEN
      RAISE EXCEPTION 'Satuan alat tidak ditemukan: %', row_data->>'satuan';
    END IF;

    SELECT id INTO target_master_id
    FROM public.master_alat
    WHERE lower(regexp_replace(btrim(nama_alat), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_data->>'nama'), '\s+', ' ', 'g'))
      AND satuan_id = target_satuan_id;

    IF target_master_id IS NULL THEN
      INSERT INTO public.master_alat (nama_alat, satuan_id, harga_dasar)
      VALUES (btrim(row_data->>'nama'), target_satuan_id, (row_data->>'harga_dasar')::numeric)
      RETURNING id INTO target_master_id;
      inserted_alat := inserted_alat + 1;
    ELSE
      UPDATE public.master_alat
      SET nama_alat = btrim(row_data->>'nama'),
          harga_dasar = (row_data->>'harga_dasar')::numeric,
          updated_at = now()
      WHERE id = target_master_id;
      updated_alat := updated_alat + 1;
    END IF;
  END LOOP;

  FOR row_data IN
    SELECT value FROM jsonb_array_elements(import_payload->'ahspItems')
  LOOP
    SELECT id INTO target_satuan_id
    FROM public.satuan
    WHERE lower(regexp_replace(btrim(nama_satuan), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_data->>'satuan'), '\s+', ' ', 'g'));

    SELECT id INTO target_kategori_id
    FROM public.kategori_pekerjaan_master
    WHERE lower(regexp_replace(btrim(nama_kategori), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_data->>'kategori'), '\s+', ' ', 'g'));

    IF target_satuan_id IS NULL THEN
      RAISE EXCEPTION 'Satuan AHSP tidak ditemukan: %', row_data->>'satuan';
    END IF;

    IF target_kategori_id IS NULL THEN
      RAISE EXCEPTION 'Kategori AHSP tidak ditemukan: %', row_data->>'kategori';
    END IF;

    SELECT id INTO target_ahsp_id
    FROM public.ahsp_items
    WHERE lower(regexp_replace(btrim(kode_analisa), '\s+', ' ', 'g'))
      = lower(regexp_replace(btrim(row_data->>'kode_analisa'), '\s+', ' ', 'g'));

    IF target_ahsp_id IS NULL THEN
      INSERT INTO public.ahsp_items (
        kode_analisa,
        uraian_pekerjaan,
        kategori_id,
        satuan_id,
        bidang,
        sub_bidang,
        profit_persen_default
      )
      VALUES (
        btrim(row_data->>'kode_analisa'),
        btrim(row_data->>'uraian_pekerjaan'),
        target_kategori_id,
        target_satuan_id,
        COALESCE(NULLIF(row_data->>'bidang', ''), 'CK'),
        NULLIF(btrim(COALESCE(row_data->>'sub_bidang', '')), ''),
        (row_data->>'profit_persen_default')::numeric
      )
      RETURNING id INTO target_ahsp_id;
      inserted_ahsp := inserted_ahsp + 1;
    ELSE
      UPDATE public.ahsp_items
      SET kode_analisa = btrim(row_data->>'kode_analisa'),
          uraian_pekerjaan = btrim(row_data->>'uraian_pekerjaan'),
          kategori_id = target_kategori_id,
          satuan_id = target_satuan_id,
          bidang = COALESCE(NULLIF(row_data->>'bidang', ''), 'CK'),
          sub_bidang = NULLIF(btrim(COALESCE(row_data->>'sub_bidang', '')), ''),
          profit_persen_default = (row_data->>'profit_persen_default')::numeric
      WHERE id = target_ahsp_id;
      updated_ahsp := updated_ahsp + 1;
    END IF;

    retained_detail_ids := ARRAY[]::uuid[];

    FOR detail_data IN
      SELECT value
      FROM jsonb_array_elements(import_payload->'ahspDetails')
      WHERE lower(regexp_replace(btrim(value->>'kode_ahsp'), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(row_data->>'kode_analisa'), '\s+', ' ', 'g'))
      ORDER BY (value->>'urutan')::integer
    LOOP
      SELECT id INTO target_satuan_id
      FROM public.satuan
      WHERE lower(regexp_replace(btrim(nama_satuan), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(detail_data->>'satuan'), '\s+', ' ', 'g'));

      IF target_satuan_id IS NULL THEN
        RAISE EXCEPTION 'Satuan komponen tidak ditemukan: %', detail_data->>'satuan';
      END IF;

      target_component_id := NULL;
      target_detail_id := NULL;

      IF detail_data->>'komponen_tipe' = 'upah' THEN
        SELECT id INTO target_component_id
        FROM public.master_upah
        WHERE lower(regexp_replace(btrim(nama_upah), '\s+', ' ', 'g'))
          = lower(regexp_replace(btrim(detail_data->>'nama_komponen'), '\s+', ' ', 'g'))
          AND satuan_id = target_satuan_id;

        IF target_component_id IS NULL THEN
          RAISE EXCEPTION 'Komponen upah tidak ditemukan: % (%)',
            detail_data->>'nama_komponen', detail_data->>'satuan';
        END IF;

        INSERT INTO public.ahsp_details (ahsp_item_id, komponen_tipe, upah_id, koefisien)
        VALUES (target_ahsp_id, 'upah', target_component_id, (detail_data->>'koefisien')::numeric)
        ON CONFLICT (ahsp_item_id, upah_id) WHERE upah_id IS NOT NULL
        DO UPDATE SET koefisien = EXCLUDED.koefisien
        RETURNING id INTO target_detail_id;
      ELSIF detail_data->>'komponen_tipe' = 'bahan' THEN
        SELECT id INTO target_component_id
        FROM public.master_bahan
        WHERE lower(regexp_replace(btrim(nama_bahan), '\s+', ' ', 'g'))
          = lower(regexp_replace(btrim(detail_data->>'nama_komponen'), '\s+', ' ', 'g'))
          AND satuan_id = target_satuan_id;

        IF target_component_id IS NULL THEN
          RAISE EXCEPTION 'Komponen bahan tidak ditemukan: % (%)',
            detail_data->>'nama_komponen', detail_data->>'satuan';
        END IF;

        INSERT INTO public.ahsp_details (ahsp_item_id, komponen_tipe, bahan_id, koefisien)
        VALUES (target_ahsp_id, 'bahan', target_component_id, (detail_data->>'koefisien')::numeric)
        ON CONFLICT (ahsp_item_id, bahan_id) WHERE bahan_id IS NOT NULL
        DO UPDATE SET koefisien = EXCLUDED.koefisien
        RETURNING id INTO target_detail_id;
      ELSIF detail_data->>'komponen_tipe' = 'alat' THEN
        SELECT id INTO target_component_id
        FROM public.master_alat
        WHERE lower(regexp_replace(btrim(nama_alat), '\s+', ' ', 'g'))
          = lower(regexp_replace(btrim(detail_data->>'nama_komponen'), '\s+', ' ', 'g'))
          AND satuan_id = target_satuan_id;

        IF target_component_id IS NULL THEN
          RAISE EXCEPTION 'Komponen alat tidak ditemukan: % (%)',
            detail_data->>'nama_komponen', detail_data->>'satuan';
        END IF;

        INSERT INTO public.ahsp_details (ahsp_item_id, komponen_tipe, alat_id, koefisien)
        VALUES (target_ahsp_id, 'alat', target_component_id, (detail_data->>'koefisien')::numeric)
        ON CONFLICT (ahsp_item_id, alat_id) WHERE alat_id IS NOT NULL
        DO UPDATE SET koefisien = EXCLUDED.koefisien
        RETURNING id INTO target_detail_id;
      ELSE
        RAISE EXCEPTION 'Jenis komponen AHSP tidak valid: %', detail_data->>'komponen_tipe';
      END IF;

      retained_detail_ids := array_append(retained_detail_ids, target_detail_id);
      processed_details := processed_details + 1;
    END LOOP;

    DELETE FROM public.ahsp_details
    WHERE ahsp_item_id = target_ahsp_id
      AND NOT (id = ANY(retained_detail_ids));
  END LOOP;

  RETURN jsonb_build_object(
    'satuanInserted', inserted_satuan,
    'satuanReused', reused_satuan,
    'kategoriInserted', inserted_kategori,
    'kategoriReused', reused_kategori,
    'masterUpahInserted', inserted_upah,
    'masterUpahUpdated', updated_upah,
    'masterBahanInserted', inserted_bahan,
    'masterBahanUpdated', updated_bahan,
    'masterAlatInserted', inserted_alat,
    'masterAlatUpdated', updated_alat,
    'ahspItemsInserted', inserted_ahsp,
    'ahspItemsUpdated', updated_ahsp,
    'ahspDetailsInserted', processed_details
  );
END;
$$;

REVOKE ALL ON FUNCTION public.import_ahsp_masterfile_unchecked(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_ahsp_masterfile_unchecked(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.import_ahsp_masterfile_unchecked(jsonb) FROM authenticated;

CREATE OR REPLACE FUNCTION public.import_ahsp_masterfile(import_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF public.is_owner_admin() IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Hanya Owner/Admin yang boleh import AHSP.'
      USING ERRCODE = '42501';
  END IF;

  IF import_payload IS NULL OR jsonb_typeof(import_payload) <> 'object' THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid.';
  END IF;

  IF NOT import_payload ?& ARRAY['satuan', 'kategori', 'master', 'ahspItems', 'ahspDetails'] THEN
    RAISE EXCEPTION 'Payload import AHSP tidak lengkap: semua bagian wajib dikirim.';
  END IF;

  IF jsonb_typeof(import_payload->'satuan') <> 'array'
    OR jsonb_typeof(import_payload->'kategori') <> 'array'
    OR jsonb_typeof(import_payload->'master') <> 'object'
    OR jsonb_typeof(import_payload->'ahspItems') <> 'array'
    OR jsonb_typeof(import_payload->'ahspDetails') <> 'array' THEN
    RAISE EXCEPTION 'Payload import AHSP tidak lengkap: bentuk bagian utama tidak valid.';
  END IF;

  IF NOT (import_payload->'master') ?& ARRAY['upah', 'bahan', 'alat']
    OR jsonb_typeof(import_payload->'master'->'upah') <> 'array'
    OR jsonb_typeof(import_payload->'master'->'bahan') <> 'array'
    OR jsonb_typeof(import_payload->'master'->'alat') <> 'array' THEN
    RAISE EXCEPTION 'Payload import AHSP tidak lengkap: master upah, bahan, dan alat wajib berupa array.';
  END IF;

  IF jsonb_array_length(import_payload->'ahspItems') = 0
    OR jsonb_array_length(import_payload->'ahspDetails') = 0 THEN
    RAISE EXCEPTION 'Payload import AHSP tidak lengkap: AHSP item dan detail tidak boleh kosong.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'satuan') unit_row(value)
    WHERE jsonb_typeof(value) <> 'string'
      OR NULLIF(btrim(value #>> '{}'), '') IS NULL
  ) OR EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'kategori') category_row(value)
    WHERE jsonb_typeof(value) <> 'string'
      OR NULLIF(btrim(value #>> '{}'), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: satuan dan kategori wajib berupa teks.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspItems') item
    WHERE jsonb_typeof(item) <> 'object'
      OR NULLIF(btrim(item->>'kode_analisa'), '') IS NULL
      OR NULLIF(btrim(item->>'uraian_pekerjaan'), '') IS NULL
      OR NULLIF(btrim(item->>'kategori'), '') IS NULL
      OR NULLIF(btrim(item->>'satuan'), '') IS NULL
      OR COALESCE(item->>'bidang', 'CK') NOT IN ('CK', 'SDA')
      OR NOT item ? 'profit_persen_default'
      OR NULLIF(btrim(item->>'profit_persen_default'), '') IS NULL
      OR (item->>'profit_persen_default')::numeric::text IN ('NaN', 'Infinity', '-Infinity')
      OR (item->>'profit_persen_default')::numeric < 0
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: data header AHSP tidak lengkap.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspDetails') detail
    WHERE jsonb_typeof(detail) <> 'object'
      OR NULLIF(btrim(detail->>'kode_ahsp'), '') IS NULL
      OR detail->>'komponen_tipe' NOT IN ('upah', 'bahan', 'alat')
      OR NULLIF(btrim(detail->>'nama_komponen'), '') IS NULL
      OR NULLIF(btrim(detail->>'satuan'), '') IS NULL
      OR NOT detail ? 'koefisien'
      OR NULLIF(btrim(detail->>'koefisien'), '') IS NULL
      OR (detail->>'koefisien')::numeric::text IN ('NaN', 'Infinity', '-Infinity')
      OR (detail->>'koefisien')::numeric <= 0
      OR NOT detail ? 'urutan'
      OR NULLIF(btrim(detail->>'urutan'), '') IS NULL
      OR (detail->>'urutan')::integer <= 0
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: data detail AHSP tidak lengkap.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT value FROM jsonb_array_elements(import_payload->'master'->'upah')
      UNION ALL
      SELECT value FROM jsonb_array_elements(import_payload->'master'->'bahan')
      UNION ALL
      SELECT value FROM jsonb_array_elements(import_payload->'master'->'alat')
    ) master_row
    WHERE jsonb_typeof(value) <> 'object'
      OR NULLIF(btrim(value->>'nama'), '') IS NULL
      OR NULLIF(btrim(value->>'satuan'), '') IS NULL
      OR NOT value ? 'harga_dasar'
      OR NULLIF(btrim(value->>'harga_dasar'), '') IS NULL
      OR (value->>'harga_dasar')::numeric::text IN ('NaN', 'Infinity', '-Infinity')
      OR (value->>'harga_dasar')::numeric < 0
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: data master harga tidak lengkap.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspItems') item
    GROUP BY lower(regexp_replace(btrim(item->>'kode_analisa'), '\s+', ' ', 'g'))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: kode_analisa duplikat.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT 'upah'::text AS kind, value FROM jsonb_array_elements(import_payload->'master'->'upah')
      UNION ALL
      SELECT 'bahan', value FROM jsonb_array_elements(import_payload->'master'->'bahan')
      UNION ALL
      SELECT 'alat', value FROM jsonb_array_elements(import_payload->'master'->'alat')
    ) master_row
    GROUP BY
      kind,
      lower(regexp_replace(btrim(value->>'nama'), '\s+', ' ', 'g')),
      lower(regexp_replace(btrim(value->>'satuan'), '\s+', ' ', 'g'))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: pasangan nama dan satuan master duplikat.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspDetails') detail
    GROUP BY
      lower(regexp_replace(btrim(detail->>'kode_ahsp'), '\s+', ' ', 'g')),
      detail->>'komponen_tipe',
      lower(regexp_replace(btrim(detail->>'nama_komponen'), '\s+', ' ', 'g')),
      lower(regexp_replace(btrim(detail->>'satuan'), '\s+', ' ', 'g'))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: identitas detail AHSP duplikat.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspItems') item
    WHERE NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(import_payload->'ahspDetails') detail
      WHERE lower(regexp_replace(btrim(detail->>'kode_ahsp'), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(item->>'kode_analisa'), '\s+', ' ', 'g'))
    )
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: setiap AHSP item wajib memiliki minimal satu detail komponen.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(import_payload->'ahspDetails') detail
    WHERE NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(import_payload->'ahspItems') item
      WHERE lower(regexp_replace(btrim(item->>'kode_analisa'), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(detail->>'kode_ahsp'), '\s+', ' ', 'g'))
    )
  ) THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: detail mengacu ke AHSP item yang tidak dikirim.';
  END IF;

  RETURN public.import_ahsp_masterfile_unchecked(import_payload);
EXCEPTION
  WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid: angka atau urutan tidak valid.'
      USING ERRCODE = '22023';
END;
$$;

REVOKE ALL ON FUNCTION public.import_ahsp_masterfile(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.import_ahsp_masterfile(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.import_ahsp_masterfile(jsonb) TO authenticated;

COMMENT ON FUNCTION public.import_ahsp_masterfile(jsonb) IS
  'Owner/Admin full-file AHSP import using normalized (name, unit) identity and replay-stable detail IDs.';

COMMIT;
