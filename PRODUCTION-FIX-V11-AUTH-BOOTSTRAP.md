# BillingFlow V11 — Auth & Organization Bootstrap Fix

## Tujuan
Memperbaiki kasus production ketika `auth.users`, `profiles`, dan `profiles.organization_id` sudah ada tetapi AuthProvider tetap menganggap profil organisasi belum terbentuk.

## Perubahan
- `src/components/auth/Auth.tsx` sekarang menggunakan RPC `bootstrap_current_user_profile()` sebagai jalur authoritative untuk membaca sekaligus memastikan profile/organization milik `auth.uid()`.
- Tidak ada `user_id`, `organization_id`, atau `role` yang dikirim dari browser untuk memilih tenant.
- Jika RPC belum tersedia/gagal, kode masih mencoba SELECT `profiles` sebagai fallback dan menghasilkan detail error yang lebih diagnostik.
- `supabase/migration_v10_production_org_bootstrap.sql` tetap menjadi migration utama untuk backfill user lama dan trigger user baru.

## Deployment
1. Di Supabase SQL Editor, jalankan migration V9 lalu V10 jika belum pernah dijalankan.
2. Deploy source aplikasi V11 ini.
3. Logout lalu login kembali.
4. Verifikasi:
   ```sql
   SELECT COUNT(*) AS auth_users,
          (SELECT COUNT(*) FROM public.profiles) AS profiles,
          (SELECT COUNT(*) FROM public.profiles WHERE organization_id IS NOT NULL) AS profiles_with_org
   FROM auth.users;
   ```

## Catatan keamanan
RPC hanya menggunakan `auth.uid()` dari sesi Supabase. Browser tidak dapat menentukan user lain, tenant lain, atau menaikkan role. Profile yang sudah mempunyai `organization_id` tidak dipindahkan.
