# Payment database fix

Tanggal: 2026-09-22

Perbaikan pada alur pembayaran:

1. Jika Supabase dikonfigurasi, `StorageService.recordPayment()` sekarang wajib memakai RPC `record_payment_atomic` dan tidak boleh fallback ke localStorage.
2. Session Supabase yang hilang/expired menghasilkan error yang jelas.
3. Error object Supabase diformat menjadi `message | details | hint | code`, bukan `[object Object]`.
4. ID rekening lokal seperti `bank-001` tidak lagi dikirim ke parameter RPC `p_bank_account_id` yang bertipe UUID. Nama bank dan nomor rekening tetap dikirim dari konfigurasi lokal; ID hanya dikirim bila benar-benar UUID.
5. Saat Supabase aktif dan tidak ada session, AuthProvider tidak lagi menghidupkan kembali demo/stale user dari localStorage.
6. Mode local/demo tetap tersedia ketika Supabase memang tidak dikonfigurasi.

Catatan deployment:
- Pastikan migration `supabase/migration_v5_atomic_payment.sql` sudah dijalankan di project Supabase.
- Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah tersedia di Vercel.
- Build/lint di environment ini belum dapat diselesaikan karena instalasi dependency npm di sandbox terhenti/time-out; source changes sudah diterapkan.

## Migration v29 — payment method constraint

The production database reported:

`new row for relation "payments" violates check constraint "payments_payment_method_check"`

with `payment_method = giro_cek`.

The application already treats `giro_cek` as a valid payment method, so this is a database-schema mismatch. The migration
`supabase/migration_v29_fix_payment_method_constraint.sql` drops and recreates the constraint with the application's supported
values, including `giro_cek`.

Run this migration against the same Supabase project used by Vercel before retrying the failed payment.
