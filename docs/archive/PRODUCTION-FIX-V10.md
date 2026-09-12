# Production Fix V10 — Organization Bootstrap

## Masalah yang diperbaiki
User Supabase Auth yang dibuat sebelum trigger production V9 dapat memiliki `auth.users` tanpa `public.profiles.organization_id`. Auth berhasil, tetapi AuthProvider tidak dapat masuk ke aplikasi.

## Perbaikan
- `supabase/migration_v10_production_org_bootstrap.sql`
  - membuat internal SECURITY DEFINER bootstrap;
  - memperbaiki trigger user baru;
  - menyediakan RPC `bootstrap_current_user_profile()` yang hanya dapat memperbaiki user yang sedang login;
  - melakukan backfill seluruh `auth.users` lama;
  - mempertahankan organization yang sudah valid dan tidak memindahkan tenant.
- `src/components/auth/Auth.tsx`
  - `ensureProfile()` sekarang melakukan self-healing melalui RPC bila profile belum memiliki `organization_id`;
  - tidak membuat organization dari browser dan tidak menerima `organization_id`/`role` dari client.

## Deploy
1. Jalankan `migration_v10_production_org_bootstrap.sql` setelah migration V9 pada Supabase SQL Editor.
2. Pastikan hasil verifikasi `profiles_with_org` sama dengan jumlah user yang memang memakai tenant.
3. Build ulang aplikasi (`npm run build`) dan deploy hasilnya.
4. Login kembali. User lama akan sudah memiliki profile/organization setelah backfill; jika ada kasus khusus, AuthProvider dapat memperbaikinya otomatis.
