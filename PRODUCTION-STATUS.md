# Production readiness status

This package has been hardened for a Vercel + Supabase production deployment.

### Fixed
- No fake Supabase URL or dummy anon key is shipped.
- Production fails closed when Supabase environment variables are missing.
- Demo/offline login is limited to Vite development mode.
- Signup no longer trusts a browser-supplied `organization_id`.
- Signup no longer trusts a browser-supplied privileged role.
- Organization/profile bootstrap is moved to a database trigger.
- Profile RLS prevents changing tenant membership or escalating role.
- Vercel security headers and immutable asset caching are configured.
- `.gitignore` and `.env.example` are included.
- A prebuild environment check prevents accidental deployment without Supabase config.

### Required before going live
1. Run `supabase/migration_v9_production_security.sql`.
2. Set Vercel Production variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Configure Supabase Auth redirect URLs for the final domain.
4. Test two separate tenant accounts and verify cross-tenant access is denied.
5. Do not expose `service_role` anywhere in frontend/Vercel public variables.
6. Tax-specific records and bank reconciliation are still partly localStorage-backed in this version. Those modules require their dedicated Supabase persistence layer before being considered fully production-authoritative.

The code was statically audited in this environment. A complete `npm run build` could not be executed here because the uploaded archive does not include `node_modules` and dependency installation exceeded the execution environment timeout. Run the build in the project/Vercel environment after setting the variables.
