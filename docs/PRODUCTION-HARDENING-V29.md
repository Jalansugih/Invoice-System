# Production Hardening V29

## Implemented
- Server-side pagination is wired into CustomerList, ProductList, and InvoiceList (25 rows/page) with Supabase `range()` and exact counts. Search is executed server-side when Supabase is authenticated.
- Customer status filters are applied server-side for active and outstanding accounts.
- Invoice create/edit/payment/delete and billing-letter actions now follow `Auth.canPerformAction`; PaymentList, PurchaseList, and SettingsView are gated the same way.
- Removed the duplicate `permissions.ts` / `PermissionGate.tsx` permission system.
- Supabase accounting report errors are no longer silently converted to local data; local reports are explicitly marked with `source: local` and the UI displays a warning.
- ExpenseService no longer falls back to local data when a configured Supabase read fails.
- Settings organization save now awaits Supabase and surfaces the original error.
- Removed unused Express runtime/development dependencies and production archive directories.
- `verify-production.mjs` now checks wiring, not only file existence.

## Verification
- Invoice calculation tests: 2/2 passed using Node 22 TypeScript stripping.
- Wiring verification passed before TypeScript dependency resolution.
- Full `npm run lint` / `npm run build` must be run after `npm ci` in an environment with all package dependencies installed; the current build container has no `node_modules`, so dependency-resolution errors are not source-code failures.
