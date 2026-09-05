# Validation — FASE 1D

Tanggal: 2026-09-04

## Pemeriksaan yang dilakukan
- Struktur ZIP diekstrak dan file FASE 1B/1C ditinjau.
- `FinancialReportsView.tsx` diganti agar laporan utama membaca `AccountingService`.
- `accountingService.ts` ditambahkan sebagai adapter sumber laporan.
- `migration_v14_unified_accounting.sql` ditambahkan.
- `ExpenseService` diperbaiki agar `paidAmount` tidak double-count pada pengeluaran PAID yang memiliki payment rows.
- Riwayat pembayaran pengeluaran dan nomor jurnal pembayaran ditampilkan pada detail Pengeluaran.
- Total kartu "Belum Lunas" menggunakan sisa hutang, bukan total transaksi.

## Build / TypeScript
Build belum dapat dinyatakan lulus karena dependency proyek tidak lengkap di environment ini.

`npm ci --offline --ignore-scripts` gagal karena paket `yallist` tidak tersedia di cache lokal.
`tsc --noEmit` dapat dijalankan menggunakan TypeScript global, tetapi menghasilkan error dependency seperti `react`, `lucide-react`, `@supabase/supabase-js`, dll. yang tidak tersedia.

Jadi status final: **kode perubahan sudah diterapkan, tetapi build final wajib divalidasi setelah `npm ci`/`npm install` berhasil.**

## Supabase
Jalankan migration secara berurutan setelah V12 dan V13:
1. `supabase/migration_v12_expenses_accounting.sql`
2. `supabase/migration_v13_expense_payments.sql`
3. `supabase/migration_v14_unified_accounting.sql`

Setelah migration:
- buat invoice baru -> harus muncul jurnal `invoice`;
- terima pembayaran -> harus muncul jurnal `payment`;
- buat pengeluaran kredit -> harus muncul jurnal `expense` dan hutang;
- bayar hutang -> harus muncul jurnal `expense_payment` dengan Dr Hutang Usaha / Cr Kas atau Bank;
- buka Laporan Keuangan -> angka berasal dari ledger Posted;
- integrity check harus menunjukkan 0 jurnal tidak balance dan 0 transaksi tanpa jurnal.


## FASE 2A — Produk & Inventaris (2026-09-04)
- Master produk kini mendukung HPP, stok minimum, tracking inventory, dan stok saat ini.
- Penyesuaian stok menggunakan RPC atomic di Supabase ketika koneksi cloud tersedia; fallback lokal tetap tersedia untuk mode offline/demo.
- `inventory_movements` menyimpan audit pergerakan stok.
- Belum ada pengurangan stok otomatis dari invoice untuk menghindari salah saji HPP sebelum metode costing dan retur ditetapkan.

### Validasi environment
- `npm install` tidak selesai karena environment mengalami konflik/ketidaklengkapan `node_modules`; build final tetap harus dijalankan di environment development setelah dependency bersih terpasang.
