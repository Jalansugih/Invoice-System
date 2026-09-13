-- v28: production hardening for duplicate master data.
-- Client validation gives immediate feedback; these constraints close the
-- cross-device race window at the database boundary.
create unique index if not exists customers_org_code_unique on public.customers (organization_id, lower(trim(code))) where code is not null and trim(code) <> '';
create unique index if not exists customers_org_email_unique on public.customers (organization_id, lower(trim(email))) where email is not null and trim(email) <> '';
create unique index if not exists customers_org_npwp_unique on public.customers (organization_id, regexp_replace(npwp, '\\D', '', 'g')) where npwp is not null and regexp_replace(npwp, '\\D', '', 'g') <> '';
create unique index if not exists products_org_code_unique on public.products (organization_id, lower(trim(code))) where code is not null and trim(code) <> '';
