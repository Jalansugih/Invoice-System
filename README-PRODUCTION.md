# BillingFlow — Production Deployment Checklist

## 1. Supabase
1. Create/choose the production Supabase project.
2. Run migrations in order:
   - `supabase/migration.sql`
   - `supabase/migration_v2_rls_sync.sql`
   - `supabase/migration_v4_atomic_sequences.sql`
   - `supabase/migration_v5_atomic_payment.sql`
   - `supabase/migration_v8_business_documents.sql`
   - `supabase/migration_v9_production_security.sql`
   - `supabase/migration_v12_expenses_accounting.sql`
   - `supabase/migration_v13_expense_payments.sql`
   - `supabase/migration_v14_unified_accounting.sql`
3. Enable Google Auth only if needed and configure the production callback URL.
4. Confirm every application table has RLS enabled.
5. Never put the Supabase `service_role` key in Vercel frontend environment variables.

## 2. Vercel
Set these Production Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Redeploy after changing environment variables.

## 3. Local development
Copy `.env.example` to `.env.local` and provide the real project values.
Demo/offline behavior is intentionally limited to Vite development mode.

## 4. Data source of truth
Supabase is the production source of truth for organizations, profiles, customers,
products, invoices, invoice items, payments, billing letters, documents,
business documents, audit logs, and the accounting journal. Browser localStorage is only a UI cache for offline/demo behavior.

Tax-specific datasets and bank reconciliation still contain local-storage paths
in the current codebase and must be migrated to dedicated Supabase tables/RPCs
before those modules are treated as production-authoritative records.

## 5. Security acceptance test
- Create a new account: it must receive a new organization and role `owner`.
- A signup request must NOT be able to select another `organization_id`.
- A signup request must NOT be able to select `admin`, `finance`, `staff`, or `viewer`.
- Login from two tenants must never return the other tenant's records.
- Direct REST calls with another tenant's UUID must return zero rows/deny writes.
- Production login must fail clearly when Supabase env vars are missing; it must not
  silently enter demo mode.

## 6. FASE 1D — Unified Accounting

`journal_entries` + `journal_lines` are the canonical ledger. Laba Rugi, Neraca, Arus Kas, Piutang, and Hutang are generated from Posted journals through `get_financial_statements(start_date, end_date)`. Source-document totals are used only for integrity checks.


## FASE 2E — Accounting & Billing Focus

Tax reporting and Bank Reconciliation are no longer application modules. Coretax remains the external reporting destination. Financial reports are generated from Posted accounting data and can be printed/exported to PDF and Excel-compatible format. Payment Gateway uses a server-side `/payment-links` adapter; gateway secrets never belong in the frontend.
