# BillingFlow v20 — Report Fix & UX Hardening

## Perubahan
- Memperbaiki `get_financial_statements()` agar tidak melakukan nested aggregate PostgreSQL (`jsonb_agg` + `sum`).
- Mempertahankan formula accounting, posted journal sebagai source of truth, organization isolation, dan RLS.
- Menambahkan migration `supabase/migration_v20_reports_ux_hardening.sql`.
- Memperbarui sidebar menjadi struktur Master Data → Transaksi → Keuangan → Laporan → Pengguna & Hak Akses → Pengaturan.
- Menambahkan routing laporan: Ringkasan Keuangan, Laba Rugi, Neraca, Arus Kas, Buku Besar, Laporan Pajak, Laporan Stok.
- Menyederhanakan halaman laporan: ringkasan bisnis, kartu KPI, periode cepat, progressive disclosure untuk pemeriksaan data, empty/error/loading state yang lebih ramah.
- Fitur existing yang belum memiliki modul khusus tidak dihapus; diberi halaman placeholder yang aman.

## Catatan deploy
Jalankan migration v20 di Supabase setelah deployment aplikasi agar RPC `get_financial_statements()` di database production ikut diperbaiki.
