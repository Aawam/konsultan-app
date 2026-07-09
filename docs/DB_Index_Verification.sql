-- Read-only index audit for the current low-latency project-list queries.
-- Run with:
-- psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f docs/DB_Index_Verification.sql

WITH expected(index_name) AS (
  VALUES
    ('proyek_perusahaan_id_idx'),
    ('proyek_is_deleted_idx'),
    ('proyek_tahun_anggaran_idx'),
    ('proyek_dinas_idx'),
    ('override_log_proyek_id_idx')
),
present AS (
  SELECT indexname AS index_name, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('proyek', 'override_log')
)
SELECT
  expected.index_name,
  CASE WHEN present.index_name IS NULL THEN 'missing' ELSE 'present' END AS status,
  COALESCE(present.indexdef, '-') AS definition
FROM expected
LEFT JOIN present USING (index_name)
ORDER BY expected.index_name;

-- Optional indexes to consider after production EXPLAIN confirms slow scans:
--
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS proyek_active_year_name_idx
--   ON public.proyek(is_deleted, tahun_anggaran DESC, nama_proyek ASC);
--
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS proyek_active_company_year_idx
--   ON public.proyek(is_deleted, perusahaan_id, tahun_anggaran DESC)
--   WHERE is_deleted = false;
--
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS override_log_project_date_idx
--   ON public.override_log(proyek_id, dilakukan_pada DESC);
