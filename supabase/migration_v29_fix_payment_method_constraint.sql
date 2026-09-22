-- Migration v29: align payments.payment_method with the application.
-- Fixes production databases where payments_payment_method_check does not
-- yet allow the application value `giro_cek`.

BEGIN;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (
    payment_method IN (
      'bank_transfer',
      'cash',
      'qris',
      'virtual_account',
      'giro_cek',
      'e_wallet',
      'other'
    )
  );

COMMIT;

-- Verification (run separately if desired):
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.payments'::regclass
--   AND conname = 'payments_payment_method_check';
