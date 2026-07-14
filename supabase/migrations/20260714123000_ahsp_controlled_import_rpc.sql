-- ============================================================
-- KONSULTAN APP - CONTROLLED AHSP IMPORT RPC
--
-- Purpose:
-- Import a validated AHSP masterfile payload in one database statement.
-- PostgreSQL rolls back the full function call if any validation, FK, or
-- constraint error is raised.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.import_ahsp_masterfile(import_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  inserted_details integer := 0;
BEGIN
  IF NOT public.is_owner_admin() THEN
    RAISE EXCEPTION 'Hanya Owner/Admin yang boleh import AHSP.';
  END IF;

  IF import_payload IS NULL OR jsonb_typeof(import_payload) <> 'object' THEN
    RAISE EXCEPTION 'Payload import AHSP tidak valid.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.satuan
    GROUP BY lower(trim(nama_satuan))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Database punya satuan duplikat. Rapikan dulu sebelum import.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.kategori_pekerjaan_master
    GROUP BY lower(trim(nama_kategori))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Database punya kategori duplikat. Rapikan dulu sebelum import.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.master_upah
    GROUP BY lower(trim(nama_upah))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Database punya upah duplikat. Rapikan dulu sebelum import.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.master_bahan
    GROUP BY lower(trim(nama_bahan))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Database punya bahan duplikat. Rapikan dulu sebelum import.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.master_alat
    GROUP BY lower(trim(nama_alat))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Database punya alat duplikat. Rapikan dulu sebelum import.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.ahsp_items
    GROUP BY lower(trim(kode_analisa))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Database punya kode AHSP duplikat. Rapikan dulu sebelum import.';
  END IF;

  FOR row_text IN SELECT value FROM jsonb_array_elements_text(COALESCE(import_payload->'satuan', '[]'::jsonb))
  LOOP
    SELECT id INTO target_satuan_id
    FROM public.satuan
    WHERE lower(trim(nama_satuan)) = lower(trim(row_text))
    LIMIT 1;

    IF target_satuan_id IS NULL THEN
      INSERT INTO public.satuan (nama_satuan)
      VALUES (trim(row_text))
      RETURNING id INTO target_satuan_id;
      inserted_satuan := inserted_satuan + 1;
    ELSE
      reused_satuan := reused_satuan + 1;
    END IF;
  END LOOP;

  FOR row_text IN SELECT value FROM jsonb_array_elements_text(COALESCE(import_payload->'kategori', '[]'::jsonb))
  LOOP
    SELECT id INTO target_kategori_id
    FROM public.kategori_pekerjaan_master
    WHERE lower(trim(nama_kategori)) = lower(trim(row_text))
    LIMIT 1;

    IF target_kategori_id IS NULL THEN
      INSERT INTO public.kategori_pekerjaan_master (nama_kategori)
      VALUES (trim(row_text))
      RETURNING id INTO target_kategori_id;
      inserted_kategori := inserted_kategori + 1;
    ELSE
      reused_kategori := reused_kategori + 1;
    END IF;
  END LOOP;

  FOR row_data IN SELECT value FROM jsonb_array_elements(COALESCE(import_payload->'master'->'upah', '[]'::jsonb))
  LOOP
    SELECT id INTO target_satuan_id
    FROM public.satuan
    WHERE lower(trim(nama_satuan)) = lower(trim(row_data->>'satuan'))
    LIMIT 1;

    IF target_satuan_id IS NULL THEN
      RAISE EXCEPTION 'Satuan upah tidak ditemukan: %', row_data->>'satuan';
    END IF;

    SELECT id INTO target_master_id
    FROM public.master_upah
    WHERE lower(trim(nama_upah)) = lower(trim(row_data->>'nama'))
    LIMIT 1;

    IF target_master_id IS NULL THEN
      INSERT INTO public.master_upah (nama_upah, satuan_id, harga_dasar)
      VALUES (trim(row_data->>'nama'), target_satuan_id, COALESCE((row_data->>'harga_dasar')::numeric, 0))
      RETURNING id INTO target_master_id;
      inserted_upah := inserted_upah + 1;
    ELSE
      UPDATE public.master_upah
      SET satuan_id = target_satuan_id,
          harga_dasar = COALESCE((row_data->>'harga_dasar')::numeric, 0),
          updated_at = now()
      WHERE id = target_master_id;
      updated_upah := updated_upah + 1;
    END IF;
  END LOOP;

  FOR row_data IN SELECT value FROM jsonb_array_elements(COALESCE(import_payload->'master'->'bahan', '[]'::jsonb))
  LOOP
    SELECT id INTO target_satuan_id
    FROM public.satuan
    WHERE lower(trim(nama_satuan)) = lower(trim(row_data->>'satuan'))
    LIMIT 1;

    IF target_satuan_id IS NULL THEN
      RAISE EXCEPTION 'Satuan bahan tidak ditemukan: %', row_data->>'satuan';
    END IF;

    SELECT id INTO target_master_id
    FROM public.master_bahan
    WHERE lower(trim(nama_bahan)) = lower(trim(row_data->>'nama'))
    LIMIT 1;

    IF target_master_id IS NULL THEN
      INSERT INTO public.master_bahan (nama_bahan, satuan_id, harga_dasar)
      VALUES (trim(row_data->>'nama'), target_satuan_id, COALESCE((row_data->>'harga_dasar')::numeric, 0))
      RETURNING id INTO target_master_id;
      inserted_bahan := inserted_bahan + 1;
    ELSE
      UPDATE public.master_bahan
      SET satuan_id = target_satuan_id,
          harga_dasar = COALESCE((row_data->>'harga_dasar')::numeric, 0),
          updated_at = now()
      WHERE id = target_master_id;
      updated_bahan := updated_bahan + 1;
    END IF;
  END LOOP;

  FOR row_data IN SELECT value FROM jsonb_array_elements(COALESCE(import_payload->'master'->'alat', '[]'::jsonb))
  LOOP
    SELECT id INTO target_satuan_id
    FROM public.satuan
    WHERE lower(trim(nama_satuan)) = lower(trim(row_data->>'satuan'))
    LIMIT 1;

    IF target_satuan_id IS NULL THEN
      RAISE EXCEPTION 'Satuan alat tidak ditemukan: %', row_data->>'satuan';
    END IF;

    SELECT id INTO target_master_id
    FROM public.master_alat
    WHERE lower(trim(nama_alat)) = lower(trim(row_data->>'nama'))
    LIMIT 1;

    IF target_master_id IS NULL THEN
      INSERT INTO public.master_alat (nama_alat, satuan_id, harga_dasar)
      VALUES (trim(row_data->>'nama'), target_satuan_id, COALESCE((row_data->>'harga_dasar')::numeric, 0))
      RETURNING id INTO target_master_id;
      inserted_alat := inserted_alat + 1;
    ELSE
      UPDATE public.master_alat
      SET satuan_id = target_satuan_id,
          harga_dasar = COALESCE((row_data->>'harga_dasar')::numeric, 0),
          updated_at = now()
      WHERE id = target_master_id;
      updated_alat := updated_alat + 1;
    END IF;
  END LOOP;

  FOR row_data IN SELECT value FROM jsonb_array_elements(COALESCE(import_payload->'ahspItems', '[]'::jsonb))
  LOOP
    SELECT id INTO target_satuan_id
    FROM public.satuan
    WHERE lower(trim(nama_satuan)) = lower(trim(row_data->>'satuan'))
    LIMIT 1;

    SELECT id INTO target_kategori_id
    FROM public.kategori_pekerjaan_master
    WHERE lower(trim(nama_kategori)) = lower(trim(row_data->>'kategori'))
    LIMIT 1;

    IF target_satuan_id IS NULL THEN
      RAISE EXCEPTION 'Satuan AHSP tidak ditemukan: %', row_data->>'satuan';
    END IF;

    IF target_kategori_id IS NULL THEN
      RAISE EXCEPTION 'Kategori AHSP tidak ditemukan: %', row_data->>'kategori';
    END IF;

    SELECT id INTO target_ahsp_id
    FROM public.ahsp_items
    WHERE lower(trim(kode_analisa)) = lower(trim(row_data->>'kode_analisa'))
    LIMIT 1;

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
        trim(row_data->>'kode_analisa'),
        trim(row_data->>'uraian_pekerjaan'),
        target_kategori_id,
        target_satuan_id,
        COALESCE(NULLIF(row_data->>'bidang', ''), 'CK'),
        NULLIF(trim(COALESCE(row_data->>'sub_bidang', '')), ''),
        COALESCE((row_data->>'profit_persen_default')::numeric, 0)
      )
      RETURNING id INTO target_ahsp_id;
      inserted_ahsp := inserted_ahsp + 1;
    ELSE
      UPDATE public.ahsp_items
      SET kode_analisa = trim(row_data->>'kode_analisa'),
          uraian_pekerjaan = trim(row_data->>'uraian_pekerjaan'),
          kategori_id = target_kategori_id,
          satuan_id = target_satuan_id,
          bidang = COALESCE(NULLIF(row_data->>'bidang', ''), 'CK'),
          sub_bidang = NULLIF(trim(COALESCE(row_data->>'sub_bidang', '')), ''),
          profit_persen_default = COALESCE((row_data->>'profit_persen_default')::numeric, 0)
      WHERE id = target_ahsp_id;
      updated_ahsp := updated_ahsp + 1;
    END IF;

    DELETE FROM public.ahsp_details
    WHERE ahsp_item_id = target_ahsp_id;

    FOR detail_data IN
      SELECT value
      FROM jsonb_array_elements(COALESCE(import_payload->'ahspDetails', '[]'::jsonb))
      WHERE lower(trim(value->>'kode_ahsp')) = lower(trim(row_data->>'kode_analisa'))
    LOOP
      target_component_id := NULL;

      IF detail_data->>'komponen_tipe' = 'upah' THEN
        SELECT id INTO target_component_id
        FROM public.master_upah
        WHERE lower(trim(nama_upah)) = lower(trim(detail_data->>'nama_komponen'))
        LIMIT 1;

        IF target_component_id IS NULL THEN
          RAISE EXCEPTION 'Komponen upah tidak ditemukan: %', detail_data->>'nama_komponen';
        END IF;

        INSERT INTO public.ahsp_details (ahsp_item_id, komponen_tipe, upah_id, koefisien)
        VALUES (target_ahsp_id, 'upah', target_component_id, COALESCE((detail_data->>'koefisien')::numeric, 0));
      ELSIF detail_data->>'komponen_tipe' = 'bahan' THEN
        SELECT id INTO target_component_id
        FROM public.master_bahan
        WHERE lower(trim(nama_bahan)) = lower(trim(detail_data->>'nama_komponen'))
        LIMIT 1;

        IF target_component_id IS NULL THEN
          RAISE EXCEPTION 'Komponen bahan tidak ditemukan: %', detail_data->>'nama_komponen';
        END IF;

        INSERT INTO public.ahsp_details (ahsp_item_id, komponen_tipe, bahan_id, koefisien)
        VALUES (target_ahsp_id, 'bahan', target_component_id, COALESCE((detail_data->>'koefisien')::numeric, 0));
      ELSIF detail_data->>'komponen_tipe' = 'alat' THEN
        SELECT id INTO target_component_id
        FROM public.master_alat
        WHERE lower(trim(nama_alat)) = lower(trim(detail_data->>'nama_komponen'))
        LIMIT 1;

        IF target_component_id IS NULL THEN
          RAISE EXCEPTION 'Komponen alat tidak ditemukan: %', detail_data->>'nama_komponen';
        END IF;

        INSERT INTO public.ahsp_details (ahsp_item_id, komponen_tipe, alat_id, koefisien)
        VALUES (target_ahsp_id, 'alat', target_component_id, COALESCE((detail_data->>'koefisien')::numeric, 0));
      ELSE
        RAISE EXCEPTION 'Jenis komponen AHSP tidak valid: %', detail_data->>'komponen_tipe';
      END IF;

      inserted_details := inserted_details + 1;
    END LOOP;
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
    'ahspDetailsInserted', inserted_details
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.import_ahsp_masterfile(jsonb) TO authenticated;

COMMIT;
