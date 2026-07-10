BEGIN;

CREATE OR REPLACE FUNCTION public.can_manage_project_rab(target_proyek_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_app_role() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.proyek p
      WHERE p.id = target_proyek_id
        AND p.jenis_pekerjaan = 'Perencanaan'
        AND COALESCE(p.is_deleted, false) = false
    )
$$;

COMMIT;
