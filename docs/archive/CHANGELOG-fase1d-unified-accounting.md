# BillingFlow — FASE 1D Unified Accounting

## Tujuan
FASE 1D menjadikan `journal_entries` + `journal_lines` sebagai **single source of truth** untuk Laba Rugi, Neraca, Arus Kas, Piutang, dan Hutang.

## Perubahan
- Invoice Posted otomatis membuat jurnal:
  - Dr Piutang Usaha
  - Cr Pendapatan Penjualan
  - Cr Pendapatan Lain-lain untuk biaya tambahan
  - Cr PPN Keluaran
- Penerimaan pembayaran otomatis membuat jurnal:
  - Dr Kas/Bank
  - Cr Piutang Usaha
- Pengeluaran dan pembayaran hutang tetap menggunakan jurnal FASE 1C.
- Rekening bank dipetakan ke akun ledger melalui `accounts.bank_account_id`.
- Data invoice/payment lama di-backfill bila dapat dipetakan.
- `get_financial_statements()` membaca ledger Posted untuk seluruh laporan.
- Laporan menampilkan integrity check dan tidak lagi menggunakan total UI/customer sebagai sumber angka laporan.

## Migrasi
Jalankan setelah V12 dan V13:

`supabase/migration_v14_unified_accounting.sql`

## Catatan integritas
Jika ada pembayaran lama non-tunai yang tidak memiliki `bank_account_id` dan tidak dapat dicocokkan dengan `account_number`, migration tidak memaksakan angka ke Kas/Bank. Pembayaran tersebut ditandai sebagai perlu pemetaan pada integrity check.

## Validasi
Build final tetap harus dijalankan setelah dependency proyek ter-install normal (`npm ci` atau `npm install`).
