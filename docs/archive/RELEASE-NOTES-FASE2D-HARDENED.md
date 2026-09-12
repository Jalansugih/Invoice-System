# FASE 2D — Hardened Purchase Accounting

## Included
- Atomic Purchase → Inventory → Moving Average → Accounts Payable → Journal.
- Atomic purchase payment → Accounts Payable → Cash/Bank → Journal.
- Payment idempotency key to prevent duplicate posting on retry.
- Purchase detail with payment history.
- Vendor quick-create from Purchase module.
- Accounting account lookup for payment posting.
- Purchase print document isolated from application chrome.
- Print foundation extended to reports, tax statement, business documents and purchase documents.

## Migration order
Run V18 first, then V19:
- `supabase/migration_v18_atomic_purchase.sql`
- `supabase/migration_v19_purchase_hardening.sql`

## Verification
Run locally:
`npm install`
`npm run lint`
`npm run build`
