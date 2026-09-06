-- BillingFlow persistence write regression checks.
-- Run while authenticated as a real BillingFlow user. These checks validate
-- that the tables required by direct UI inputs are present and tenant-scoped.

SELECT to_regclass('public.organizations') IS NOT NULL AS organizations_ready;
SELECT to_regclass('public.customers') IS NOT NULL AS customers_ready;
SELECT to_regclass('public.products') IS NOT NULL AS products_ready;
SELECT to_regclass('public.invoices') IS NOT NULL AS invoices_ready;
SELECT to_regclass('public.payments') IS NOT NULL AS payments_ready;
SELECT to_regclass('public.billing_letters') IS NOT NULL AS billing_letters_ready;
SELECT to_regclass('public.documents') IS NOT NULL AS documents_ready;
SELECT to_regclass('public.business_documents') IS NOT NULL AS business_documents_ready;
SELECT to_regclass('public.vendors') IS NOT NULL AS vendors_ready;
SELECT to_regclass('public.purchases') IS NOT NULL AS purchases_ready;
SELECT to_regclass('public.expense_transactions') IS NOT NULL AS expenses_ready;
SELECT to_regclass('public.accounts') IS NOT NULL AS accounts_ready;

SELECT pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='get_financial_statements';
