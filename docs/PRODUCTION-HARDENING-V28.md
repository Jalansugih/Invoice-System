# Production Hardening v28

- Supabase write failures are no longer converted to `false`/silent success on core delete and fetch paths.
- Master data rejects duplicate customer code/email/NPWP and product code locally; v28 unique indexes enforce the same rules across devices.
- Added role permission matrix and reusable `PermissionGate` for frontend gating.
- Added `.env.example` including Supabase and payment gateway variables.
- Added server-side pagination APIs: `fetchCustomersPage` and `fetchProductsPage` using `range()` + exact count.
- Added automated invoice calculation tests and SQL RLS regression checks.
- `npm run lint` is TypeScript-only and must be run after a clean `npm ci`; no production claim is made until it exits 0.
