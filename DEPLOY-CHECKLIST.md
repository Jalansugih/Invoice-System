# BillingFlow — Production Deploy Checklist

## 1. Local
- [ ] Node.js 20+
- [ ] `npm ci`
- [ ] `.env.local` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `npm run lint`
- [ ] `npm run build`

## 2. Supabase
- [ ] Run `supabase/migrations/initial_schema.sql`
- [ ] Run subsequent migrations in order
- [ ] Run `supabase/migration_v21_costing.sql`
- [ ] Run `supabase/migration_v22_invoice_integrity.sql`
- [ ] Confirm RLS is enabled for production tables
- [ ] Confirm RPCs used by the application exist

## 3. Vercel
Public/client variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_ENV`
- `MIDTRANS_EXPIRY_MINUTES` (optional)

Build command: `npm run build`
Output directory: `dist`

## 4. Payment webhook
Set Midtrans notification URL to:
`https://YOUR-DOMAIN/api/payment-webhook`

## 5. Smoke test
1. Open production URL.
2. Login with Supabase Auth.
3. Create customer.
4. Create product.
5. Create invoice.
6. Record payment.
7. Open financial reports.
8. Open Costing & Profit.
9. If using Midtrans, create a payment link and test webhook in sandbox.
