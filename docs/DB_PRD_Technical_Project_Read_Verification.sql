SELECT has_function_privilege(
  'authenticated',
  'public.get_proyek_teknis(uuid)',
  'EXECUTE'
) AS can_execute;
