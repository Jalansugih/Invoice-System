# BillingFlow V26 — Invoice Product Record Fix

## Root cause
`create_invoice_atomic()` declared `v_product` as an untyped PostgreSQL `RECORD`.
When an invoice line was a custom line (`productId = NULL`), the function skipped
the `SELECT ... INTO v_product`, then later evaluated `v_product.price`,
`v_product.code`, `v_product.name`, or `v_product.unit`. PostgreSQL therefore raised:
`record "v_product" is not assigned yet`.

## Fix
`v_product` is now declared as `public.products%ROWTYPE`, which gives the variable
a stable row shape even when no product lookup is performed. Product-backed lines
retain the existing organization/active-product validation.

## Deployment
Run `supabase/migration_v26_invoice_product_record_fix.sql` in Supabase SQL Editor
after the existing V24/V25 migrations. It uses `CREATE OR REPLACE FUNCTION`, so it
updates the existing RPC without changing invoice data.
