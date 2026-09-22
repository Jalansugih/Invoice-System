# V30 — Restore payment journal function

The error:

`function public.post_payment_journal(uuid) does not exist` (`42883`)

means the deployed Supabase database is missing the accounting function required by the payment trigger / `record_payment_atomic` RPC.

This release adds:

- `supabase/migration_v30_restore_payment_journal.sql`
- `post_payment_journal(UUID)`
- payment accounting trigger `trg_payments_accounting`
- prerequisite accounting helpers from V14 (`ensure_default_accounts`, `ensure_bank_ledger_account`, `next_accounting_journal_number`, `post_invoice_journal`)
- preservation of the existing atomic payment flow

## Apply in Supabase

Open Supabase SQL Editor and run the contents of:

`supabase/migration_v30_restore_payment_journal.sql`

Then retry the payment. No new invoice is required.

If Supabase reports that a prerequisite table from the accounting foundation is missing, run the project's V12/V13 accounting migrations first, then rerun V30.
