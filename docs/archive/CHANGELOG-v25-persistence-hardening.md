# BillingFlow v25 — Supabase Persistence Hardening

## Tujuan
Memastikan input/master data utama tidak dianggap tersimpan sebelum Supabase berhasil menulis data saat aplikasi berjalan dalam mode Supabase.

## Perubahan frontend
- Organization / Pengaturan: save sekarang cloud-first dan menunggu hasil Supabase.
- Rekening bank pada Pengaturan: kegagalan upsert bank account tidak lagi diabaikan.
- Customer: create/update/delete menunggu Supabase; cache localStorage diperbarui setelah cloud berhasil.
- Product: create/update/delete menunggu Supabase; cache localStorage diperbarui setelah cloud berhasil.
- Vendor: create/update menunggu Supabase.
- Billing Letter: create/update/delete menunggu Supabase.
- Business Documents (Quotation/PO/SO/Surat Jalan/BAST): create/update menunggu Supabase.
- Invoice status: perubahan status menunggu atomic Supabase save.
- Error pada write cloud ditampilkan ke caller; tidak lagi silent-success melalui local cache.

## Perubahan backend
- `SupabaseService.saveOrganization()` sekarang memeriksa error `bank_accounts` upsert.
- `migration_v25_persistence_and_reports_hardening.sql` membawa kembali versi `get_financial_statements(date,date)` yang bebas dari nested aggregate PostgreSQL.

## Catatan
- localStorage tetap dipakai sebagai cache baca cepat/offline. Dalam mode Supabase, write data utama tidak boleh dianggap berhasil sebelum cloud write berhasil.
- Bank reconciliation feed lama masih memiliki desain schema draft yang belum dikunci; jangan dianggap sebagai persistent cloud input sampai migration final bank_transactions diterapkan.
