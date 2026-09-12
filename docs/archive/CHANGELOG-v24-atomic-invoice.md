# Changelog v24 — Atomic Invoice Creation

## Hardening

Invoice creation is now persisted through `create_invoice_atomic()` when a real Supabase session is available.

The PostgreSQL function owns the complete transaction:

1. authenticate and resolve organization from the session;
2. lock/validate customer and optional bank account;
3. validate/recalculate line values from the product master;
4. insert invoice header;
5. insert all `invoice_items`;
6. let the existing invoice-accounting trigger post `journal_entries/journal_lines` in the same transaction;
7. recalculate customer invoice/outstanding aggregates;
8. write the audit log.

Any exception rolls the entire transaction back. The previous browser sequence of header INSERT -> items INSERT -> cleanup is no longer used for new invoices.

## Important deployment step

Run:

`supabase/migration_v24_atomic_invoice.sql`

after the existing migrations, especially v14/v23.

## Fallback

Demo/local-only mode without an authenticated Supabase session continues using the local storage path. Existing invoice updates remain on the existing sync path; this hardening targets **new invoice creation**.
