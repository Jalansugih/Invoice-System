-- Regression test/documentation for V26.
-- Run after migrations in an authenticated Supabase SQL session.
-- The important case is an invoice item with productId = NULL (custom line).
-- Before V26 this raised: record "v_product" is not assigned yet.
--
-- Example payload fragment: [{"id": "<uuid>", "productId": null,
--   "description": "Jasa custom", "quantity": 1, "unit": "Unit",
--   "unitPrice": 100000, "discount": 0, "taxRate": 11}]
--
-- V26 changes only the PL/pgSQL variable declaration, so existing V24
-- validation/accounting behavior remains intact.

SELECT p.oid::regprocedure AS function_signature
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'create_invoice_atomic';
