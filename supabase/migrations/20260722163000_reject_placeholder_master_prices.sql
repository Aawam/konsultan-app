-- Existing Rp0/Rp1 master rows remain visible until their real rates are entered.
-- NOT VALID still enforces the rule for all new inserts and updates.

BEGIN;

ALTER TABLE public.master_upah
  ADD CONSTRAINT master_upah_harga_dasar_not_placeholder
  CHECK (harga_dasar > 1) NOT VALID;

ALTER TABLE public.master_bahan
  ADD CONSTRAINT master_bahan_harga_dasar_not_placeholder
  CHECK (harga_dasar > 1) NOT VALID;

ALTER TABLE public.master_alat
  ADD CONSTRAINT master_alat_harga_dasar_not_placeholder
  CHECK (harga_dasar > 1) NOT VALID;

COMMIT;
