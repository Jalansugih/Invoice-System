# BillingFlow V27 — Full-stack persistence audit

## Temuan utama

1. **Frontend menyimpan dulu ke localStorage lalu beberapa cloud write berjalan fire-and-forget.**
   Akibatnya UI dapat terlihat sukses walaupun Supabase menolak INSERT/UPDATE.
2. **Beberapa service Supabase mengembalikan `false` tanpa membawa error PostgreSQL ke layer UI.**
   Ini membuat penyebab RLS, foreign key, UUID, kolom hilang, atau constraint menjadi sulit terlihat.
3. **Invoice memiliki potensi partial write:** header invoice berhasil, penghapusan item lama berhasil, lalu INSERT item baru gagal. Versi ini me-roll-back header ketika item gagal.
4. **Bank account upsert pada penyimpanan organisasi sebelumnya mengabaikan error.** Versi ini membuat error tersebut menjadi kegagalan sinkronisasi yang dapat dilihat.
5. **Tenant/RLS diperkuat melalui `migration_v27_persistence_hardening.sql`** dengan policy eksplisit untuk tabel bisnis utama menggunakan `get_auth_org_id()`.

## File yang diperbaiki

- `src/lib/storage.ts`
  - customer/product/payment/billing-letter cloud sync ditunggu pada jalur penyimpanan utama.
  - kegagalan sinkronisasi sekarang menghasilkan error yang dapat ditampilkan UI.
  - invoice item failure tidak lagi meninggalkan header invoice setengah jadi di Supabase.
- `src/lib/supabaseService.ts`
  - error Supabase tidak lagi disamarkan menjadi `false` untuk operasi simpan utama.
  - bank account upsert sekarang diperiksa.
  - error invoice/billing-letter diteruskan ke caller.
- `supabase/migration_v27_persistence_hardening.sql`
  - hardening tenant/RLS untuk core business tables.
  - query diagnosis schema dan policy.

## Urutan database

Jalankan migration lama sesuai urutan yang sudah digunakan project, kemudian:

`supabase/migration_v27_persistence_hardening.sql`

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` atau `MIDTRANS_SERVER_KEY` pada environment variable `VITE_*`.

## Validasi

Environment `node_modules` pada arsip yang diterima tidak lengkap untuk TypeScript: `npx tsc --noEmit` berhenti pada banyak `TS2688` untuk paket type definition yang hilang. Jadi **build/lint penuh belum dapat diklaim berhasil** dari arsip ini.

Yang sudah diverifikasi secara statis:
- jalur Supabase CRUD utama ditemukan;
- tenant diambil dari `profiles.organization_id` pada auth bootstrap;
- RLS core tables diperiksa;
- silent cloud writes pada jalur utama diperketat;
- partial invoice write diperketat;
- migration V27 persistence hardening ditambahkan.
