SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'rab_maker',
    'rab_maker_sections',
    'rab_maker_items',
    'rab_maker_item_details'
  )
ORDER BY table_name;

SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'proyek',
    'perusahaan',
    'override_log',
    'dinas_skpd',
    'rab_maker',
    'rab_maker_sections',
    'rab_maker_items',
    'rab_maker_item_details'
  )
ORDER BY tablename, policyname;
