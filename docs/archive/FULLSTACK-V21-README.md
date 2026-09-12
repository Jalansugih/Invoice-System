# BillingFlow V21 — Fullstack Reports & Payment Gateway

This release strengthens the original BillingFlow project without replacing its accounting foundation.

## Included

### Reports / documents
- Report print supports A4 and F4/Folio.
- Portrait and landscape are supported.
- Print opens an isolated document instead of printing the application shell.
- Report header includes organization identity, period and NPWP when available.
- Table rows are protected against page breaks.
- PDF export supports A4/F4 and orientation options.

### Payment gateway
- Frontend sends the Supabase access token to the backend.
- `/api/payment-links` creates a Midtrans Snap transaction server-side.
- `/api/payment-webhook` verifies the Midtrans SHA-512 signature and amount.
- `/api/payment-status` reads the gateway transaction for the authenticated organization.
- Gateway secrets are server-only.
- A settlement is converted atomically to a BillingFlow payment, invoice update, accounting journal and receipt document.
- Repeated settlement notifications are idempotent.

## Supabase migration
Run, in order, the project's existing migrations through V20 and then:

`supabase/migration_v21_fullstack_payment_reports.sql`

## Vercel environment variables
Server-only:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MIDTRANS_ENV=sandbox` or `production`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_EXPIRY_MINUTES=1440`

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PAYMENT_GATEWAY_PROVIDER=midtrans`
- `VITE_PAYMENT_GATEWAY_API_URL=/api`

Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `MIDTRANS_SERVER_KEY` as `VITE_*` variables.

## Midtrans webhook
Set the Midtrans notification/webhook URL to:

`https://YOUR-DOMAIN/api/payment-webhook`

## Production test sequence

1. Login to BillingFlow.
2. Create an invoice with a positive outstanding amount.
3. Configure at least one default bank account in the organization.
4. Generate a payment link.
5. Complete a sandbox payment.
6. Confirm the webhook reaches `/api/payment-webhook`.
7. Confirm `payment_gateway_transactions.status = SETTLEMENT`.
8. Confirm `payment_id` is populated.
9. Confirm invoice outstanding becomes zero for a full settlement.
10. Confirm a payment journal exists in `journal_entries` / `journal_lines`.
11. Print a report in A4 and F4, both portrait and landscape.

## Important scope note
The existing project still contains placeholder UI for the dedicated General Ledger and Stock report tabs. V21 hardens the report/document infrastructure and gateway integration; it does not fabricate accounting data for those tabs. Those reports should be implemented from the canonical journal/inventory tables before claiming full accounting-report coverage.
