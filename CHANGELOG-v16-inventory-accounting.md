# BillingFlow V16 — Inventory Accounting / Moving Average

## Selesai
- Akun Persediaan `1-3000`.
- Akun keuntungan/kerugian penyesuaian persediaan.
- Moving Average Cost untuk stok masuk.
- Stok masuk atomic: Pembelian, Saldo Awal, Retur Penjualan, Penyesuaian Masuk.
- Invoice non-draft otomatis mengurangi stok barang.
- HPP otomatis: Dr HPP → Cr Persediaan.
- Stok negatif ditolak secara atomic.
- Pembatalan/re-post invoice membuat reversal stok dan jurnal.
- Perubahan item invoice direkonsiliasi lewat `repost_invoice_inventory`.
- Penyesuaian stok menghasilkan jurnal.
- `recalculate_inventory_product` tersedia untuk audit/rebuild.
- UI Produk mendapat aksi Stok Masuk + input qty, HPP/unit, jenis movement, catatan.
- Offline/demo accounting ikut menghitung inventory movement.

## Catatan produksi
Historical invoice tidak otomatis direpost. Sebelum merepost invoice lama, isi/verifikasi saldo awal persediaan terlebih dahulu agar HPP historis tidak gagal karena stok tidak tersedia.

## Migration
Jalankan `supabase/migration_v16_inventory_accounting.sql` setelah V15.
