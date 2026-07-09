SELECT
  table_name,
  has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT') AS can_select
FROM (
  VALUES
    ('ahsp_items'),
    ('ahsp_details'),
    ('satuan'),
    ('kategori_pekerjaan_master'),
    ('master_upah'),
    ('master_bahan'),
    ('master_alat'),
    ('proyek'),
    ('perusahaan'),
    ('dinas_skpd'),
    ('override_log'),
    ('rab_maker'),
    ('rab_maker_sections'),
    ('rab_maker_items'),
    ('rab_maker_item_details')
) AS t(table_name);
