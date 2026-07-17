BEGIN;

CREATE OR REPLACE FUNCTION public.get_proyek_teknis_page(
  target_page integer DEFAULT 1,
  target_page_size integer DEFAULT 25,
  target_tahun_anggaran integer DEFAULT NULL,
  target_jenis_pekerjaan text DEFAULT NULL,
  target_status_proyek text DEFAULT NULL,
  target_perusahaan_id uuid DEFAULT NULL,
  target_progress text DEFAULT NULL,
  target_search text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  WITH normalized_input AS (
    SELECT
      GREATEST(COALESCE(target_page, 1), 1) AS requested_page,
      LEAST(GREATEST(COALESCE(target_page_size, 25), 1), 100) AS page_size,
      NULLIF(left(btrim(target_search), 100), '') AS search_term
  ),
  input AS (
    SELECT
      requested_page,
      page_size,
      search_term,
      CASE
        WHEN search_term IS NULL THEN NULL
        ELSE '%' || replace(replace(replace(search_term, '\', '\\'), '%', '\%'), '_', '\_') || '%'
      END AS search_pattern
    FROM normalized_input
  ),
  filtered AS (
    SELECT
      p.id,
      p.nama_proyek,
      p.paket_pekerjaan_induk,
      p.nomor_kontrak,
      p.jenis_pekerjaan,
      p.kategori_pekerjaan,
      p.tahun_anggaran,
      p.sumber_dana,
      p.dinas,
      p.lokasi_kecamatan,
      p.nama_ppk,
      p.perusahaan_id,
      pr.nama_perusahaan AS perusahaan_nama,
      pr.adalah_perusahaan_sendiri AS perusahaan_adalah_perusahaan_sendiri,
      p.tanggal_mulai,
      p.tanggal_selesai,
      p.durasi_hari,
      p.tahap_progress,
      p.persentase_progress,
      p.pernah_dioverride,
      p.status_proyek,
      p.jalur_masuk,
      p.created_at,
      p.updated_at,
      p.is_deleted
    FROM public.proyek p
    CROSS JOIN input i
    LEFT JOIN public.perusahaan pr ON pr.id = p.perusahaan_id
    WHERE COALESCE(p.is_deleted, false) = false
      AND (target_tahun_anggaran IS NULL OR p.tahun_anggaran = target_tahun_anggaran)
      AND (target_jenis_pekerjaan IS NULL OR p.jenis_pekerjaan = target_jenis_pekerjaan)
      AND (target_status_proyek IS NULL OR p.status_proyek = target_status_proyek)
      AND (target_perusahaan_id IS NULL OR p.perusahaan_id = target_perusahaan_id)
      AND (
        target_progress IS NULL
        OR target_progress = 'selesai' AND p.persentase_progress = 100
        OR target_progress = 'belum_mulai'
          AND p.tahap_progress IS NULL
          AND COALESCE(p.persentase_progress, 0) = 0
        OR target_progress = 'berjalan'
          AND NOT (p.tahap_progress IS NULL AND COALESCE(p.persentase_progress, 0) = 0)
          AND COALESCE(p.persentase_progress, 0) <> 100
        OR target_progress = 'perlu_update' AND (
          NULLIF(btrim(p.nama_proyek), '') IS NULL
          OR NULLIF(btrim(p.jenis_pekerjaan), '') IS NULL
          OR NULLIF(btrim(p.kategori_pekerjaan), '') IS NULL
          OR p.tahun_anggaran IS NULL OR p.tahun_anggaran <= 0
          OR NULLIF(btrim(p.sumber_dana), '') IS NULL
          OR NULLIF(btrim(p.dinas), '') IS NULL
          OR p.perusahaan_id IS NULL
          OR NULLIF(btrim(p.lokasi_kecamatan), '') IS NULL
          OR NULLIF(btrim(p.nama_ppk), '') IS NULL
          OR p.tanggal_mulai IS NULL
          OR p.tanggal_selesai IS NULL
          OR NULLIF(btrim(p.status_proyek), '') IS NULL
          OR NULLIF(btrim(p.tahap_progress), '') IS NULL
        )
      )
      AND (
        i.search_pattern IS NULL
        OR p.nama_proyek ILIKE i.search_pattern ESCAPE '\'
        OR p.dinas ILIKE i.search_pattern ESCAPE '\'
        OR p.lokasi_kecamatan ILIKE i.search_pattern ESCAPE '\'
        OR p.status_proyek ILIKE i.search_pattern ESCAPE '\'
        OR p.tahap_progress ILIKE i.search_pattern ESCAPE '\'
      )
  ),
  pagination AS (
    SELECT
      count(f.id)::integer AS total,
      i.requested_page,
      i.page_size,
      GREATEST(1, CEIL(count(f.id)::numeric / i.page_size)::integer) AS page_count
    FROM input i
    LEFT JOIN filtered f ON true
    GROUP BY i.requested_page, i.page_size
  ),
  effective_pagination AS (
    SELECT
      total,
      LEAST(requested_page, page_count) AS page,
      page_size,
      page_count
    FROM pagination
  ),
  paged AS (
    SELECT f.*
    FROM filtered f
    ORDER BY f.tahun_anggaran DESC, f.nama_proyek ASC
    LIMIT (SELECT page_size FROM effective_pagination)
    OFFSET (
      SELECT (page - 1) * page_size
      FROM effective_pagination
    )
  )
  SELECT jsonb_build_object(
    'rows', COALESCE(
      (SELECT jsonb_agg(to_jsonb(paged) ORDER BY paged.tahun_anggaran DESC, paged.nama_proyek ASC) FROM paged),
      '[]'::jsonb
    ),
    'total', p.total,
    'page', p.page,
    'pageSize', p.page_size,
    'pageCount', p.page_count
  )
  FROM effective_pagination p;
$$;

REVOKE ALL ON FUNCTION public.get_proyek_teknis_page(integer, integer, integer, text, text, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_proyek_teknis_page(integer, integer, integer, text, text, uuid, text, text) TO authenticated;

COMMIT;
