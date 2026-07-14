-- ============================================================
-- KONSULTAN APP - RAB APPROVAL / FINAL LOCK MODEL
-- Purpose:
-- Treat rab_maker.status = validated as approved and status = final as locked.
-- Add finalization actor metadata and RPCs for owner/admin status transitions.
-- ============================================================

BEGIN;

ALTER TABLE public.rab_maker
ADD COLUMN IF NOT EXISTS finalized_by uuid REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS rab_maker_status_idx ON public.rab_maker(status);
CREATE INDEX IF NOT EXISTS rab_maker_validated_at_idx ON public.rab_maker(validated_at);
CREATE INDEX IF NOT EXISTS rab_maker_finalized_at_idx ON public.rab_maker(finalized_at);

CREATE OR REPLACE FUNCTION public.prevent_locked_rab_maker_child_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_maker_id uuid;
  new_maker_id uuid;
  maker_status public.rab_status;
BEGIN
  IF TG_TABLE_NAME = 'rab_maker_item_details' THEN
    SELECT rmi.rab_maker_id
    INTO target_maker_id
    FROM public.rab_maker_items rmi
    WHERE rmi.id = CASE
      WHEN TG_OP = 'INSERT' THEN NEW.rab_maker_item_id
      ELSE OLD.rab_maker_item_id
    END;
  ELSIF TG_OP = 'INSERT' THEN
    target_maker_id := NEW.rab_maker_id;
  ELSE
    target_maker_id := OLD.rab_maker_id;
  END IF;

  SELECT rm.status
  INTO maker_status
  FROM public.rab_maker rm
  WHERE rm.id = target_maker_id;

  IF maker_status IN ('validated'::public.rab_status, 'final'::public.rab_status) THEN
    RAISE EXCEPTION 'RAB sudah disetujui/final dan tidak bisa diubah.'
      USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'rab_maker_item_details' THEN
      SELECT rmi.rab_maker_id
      INTO new_maker_id
      FROM public.rab_maker_items rmi
      WHERE rmi.id = NEW.rab_maker_item_id;
    ELSE
      new_maker_id := NEW.rab_maker_id;
    END IF;

    IF new_maker_id IS DISTINCT FROM target_maker_id THEN
      SELECT rm.status
      INTO maker_status
      FROM public.rab_maker rm
      WHERE rm.id = new_maker_id;

      IF maker_status IN ('validated'::public.rab_status, 'final'::public.rab_status) THEN
        RAISE EXCEPTION 'RAB sudah disetujui/final dan tidak bisa diubah.'
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_locked_rab_maker_sections_change ON public.rab_maker_sections;
CREATE TRIGGER prevent_locked_rab_maker_sections_change
BEFORE INSERT OR UPDATE OR DELETE ON public.rab_maker_sections
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_rab_maker_child_change();

DROP TRIGGER IF EXISTS prevent_locked_rab_maker_items_change ON public.rab_maker_items;
CREATE TRIGGER prevent_locked_rab_maker_items_change
BEFORE INSERT OR UPDATE OR DELETE ON public.rab_maker_items
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_rab_maker_child_change();

DROP TRIGGER IF EXISTS prevent_locked_rab_maker_item_details_change ON public.rab_maker_item_details;
CREATE TRIGGER prevent_locked_rab_maker_item_details_change
BEFORE INSERT OR UPDATE OR DELETE ON public.rab_maker_item_details
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_rab_maker_child_change();

CREATE OR REPLACE FUNCTION public.approve_rab_maker(target_proyek_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  maker_row record;
BEGIN
  IF NOT public.is_owner_admin() THEN
    RAISE EXCEPTION 'Hanya Owner/Admin yang boleh menyetujui RAB.'
      USING ERRCODE = '42501';
  END IF;

  SELECT rm.id, rm.proyek_id, rm.status
  INTO maker_row
  FROM public.rab_maker rm
  WHERE rm.proyek_id = target_proyek_id
    AND public.can_manage_project_rab(rm.proyek_id)
  FOR UPDATE;

  IF maker_row.id IS NULL THEN
    RAISE EXCEPTION 'RAB Maker belum dibuat.'
      USING ERRCODE = 'P0002';
  END IF;

  IF maker_row.status = 'final'::public.rab_status THEN
    RAISE EXCEPTION 'RAB final tidak bisa disetujui ulang.'
      USING ERRCODE = 'P0001';
  END IF;

  IF maker_row.status = 'validated'::public.rab_status THEN
    RETURN maker_row.id;
  END IF;

  UPDATE public.rab_maker
  SET status = 'validated'::public.rab_status,
      validated_by = auth.uid(),
      validated_at = now()
  WHERE id = maker_row.id;

  INSERT INTO public.rab_audit_log (
    proyek_id,
    user_id,
    aksi,
    metadata,
    rab_maker_id
  )
  VALUES (
    maker_row.proyek_id,
    auth.uid(),
    'rab_approved',
    jsonb_build_object('previous_status', maker_row.status, 'new_status', 'validated'),
    maker_row.id
  );

  RETURN maker_row.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_rab_maker(target_proyek_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  maker_row record;
BEGIN
  IF NOT public.is_owner_admin() THEN
    RAISE EXCEPTION 'Hanya Owner/Admin yang boleh memfinalkan RAB.'
      USING ERRCODE = '42501';
  END IF;

  SELECT rm.id, rm.proyek_id, rm.status
  INTO maker_row
  FROM public.rab_maker rm
  WHERE rm.proyek_id = target_proyek_id
    AND public.can_manage_project_rab(rm.proyek_id)
  FOR UPDATE;

  IF maker_row.id IS NULL THEN
    RAISE EXCEPTION 'RAB Maker belum dibuat.'
      USING ERRCODE = 'P0002';
  END IF;

  IF maker_row.status = 'final'::public.rab_status THEN
    RETURN maker_row.id;
  END IF;

  IF maker_row.status <> 'validated'::public.rab_status THEN
    RAISE EXCEPTION 'RAB harus disetujui sebelum difinalkan.'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.rab_maker
  SET status = 'final'::public.rab_status,
      finalized_by = auth.uid(),
      finalized_at = now()
  WHERE id = maker_row.id;

  INSERT INTO public.rab_audit_log (
    proyek_id,
    user_id,
    aksi,
    metadata,
    rab_maker_id
  )
  VALUES (
    maker_row.proyek_id,
    auth.uid(),
    'rab_finalized',
    jsonb_build_object('previous_status', maker_row.status, 'new_status', 'final'),
    maker_row.id
  );

  RETURN maker_row.id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_rab_maker(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_rab_maker(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_rab_maker(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_rab_maker(uuid) TO authenticated;

COMMIT;
