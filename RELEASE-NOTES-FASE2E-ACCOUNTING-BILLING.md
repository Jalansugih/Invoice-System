# BillingFlow — FASE 2E: Accounting & Billing Focus

## Product direction
BillingFlow is focused on the operational accounting flow:

1. Accounting engine — journal-first, atomic posting where supported, balanced ledger and integrity checks.
2. Financial reports — Profit & Loss, Balance Sheet, Cash Flow, Receivables and Payables derived from Posted accounting data.
3. Simple transactions — invoice and payment entry prioritize the minimum fields needed to complete a transaction.
4. Payment Gateway — frontend adapter is ready for a trusted backend/Edge Function; gateway secrets must remain server-side.
5. Tax — no separate tax-reporting module in BillingFlow. Tax amounts remain part of transaction/accounting data where required; Coretax is the external reporting destination.
6. PDF / Excel / Print — financial reports support professional print, PDF and Excel-compatible export.
7. Bank Reconciliation — removed from the application navigation and runtime. Bank accounts remain because they are required for cash/bank accounting and payment posting.

## Important gateway contract

Configure:

- `VITE_PAYMENT_GATEWAY_PROVIDER=midtrans`
- `VITE_PAYMENT_GATEWAY_API_URL=https://your-backend.example/api`

The backend endpoint expected by the frontend is:

`POST /payment-links`

It receives invoice metadata and outstanding amount, creates the provider transaction using the server-side secret, and returns:

`{ "paymentUrl": "...", "transactionId": "...", "expiresAt": "..." }`

Do not put a Midtrans Server Key or any gateway secret in `VITE_*` variables.

## Backward compatibility

Legacy tax/reconciliation database tables and migration files are retained as database history where applicable, but their UI/runtime modules are no longer loaded. No destructive DROP migration is included in this phase.
