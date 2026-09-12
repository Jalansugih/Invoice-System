# V22 — Invoice Calculation & Frontend-Backend Integrity Fix

## Masalah yang ditemukan (hasil audit)
1. Rumus `quantity x unitPrice - discount` diketik ulang manual di beberapa
   file (`InvoiceFormModal.tsx`, `storage.ts`, `BusinessDocumentsView.tsx`)
   dengan pembulatan yang tidak konsisten.
2. `src/lib/actions/invoice-actions.ts` mengklaim melakukan "server-side
   calculation to prevent price tampering", tapi tidak pernah dipanggil dari
   UI manapun — dead code. Alur simpan invoice yang sebenarnya berjalan
   (`StorageService.saveInvoice`) langsung memakai `item.amount` yang
   dikirim client tanpa verifikasi ulang.
3. Tidak ada validasi di level database: RLS policy pada `invoices` /
   `invoice_items` hanya memeriksa isolasi `organization_id`, bukan
   kebenaran nilai `amount` / `unit_price` / `grand_total`.

## Perbaikan
- **`src/lib/invoiceCalc.ts`** (baru) — satu sumber rumus perhitungan
  (`calcLineAmount`, `calcInvoiceTotals`), dipakai oleh form dan storage.
- **`src/components/invoices/InvoiceFormModal.tsx`** — pakai
  `invoiceCalc.ts`, tidak lagi menghitung manual.
- **`src/lib/storage.ts` (`saveInvoice`)** — sekarang menghitung ulang
  `amount` setiap item dari `quantity * unitPrice - discount` (tidak lagi
  mempercayai `amount` yang dikirim pemanggil), dan menimpa `unitPrice`
  dengan harga produk master saat `productId` diisi.
- **`supabase/migration_v22_invoice_integrity.sql`** (baru) — trigger
  database yang menegakkan ulang hal yang sama di level Postgres, terlepas
  dari jalur mana yang menulis ke tabel `invoices` / `invoice_items`:
  1. `calc_invoice_item_amount()` — validasi & hitung ulang tiap baris item.
  2. `protect_invoice_financials()` — hitung ulang subtotal/diskon/pajak/
     grand total invoice dari baris item yang benar-benar ada di database.
  3. `trg_sync_invoice_totals()` — memicu perhitungan ulang header invoice
     setiap kali baris item berubah.

## Cara deploy
1. Jalankan `supabase/migration_v22_invoice_integrity.sql` di Supabase SQL
   Editor (setelah migration_v21).
2. Deploy ulang frontend seperti biasa (`npm run build` / `vercel deploy`).

## Yang belum dikerjakan (rekomendasi lanjutan)
- `BusinessDocumentsView.tsx` (quotation/SO/BAST) belum dipindah ke
  `invoiceCalc.ts` — masih pakai rumus manual sendiri, sebaiknya
  disatukan juga di iterasi berikutnya.
- Belum ada tsc/build check untuk perubahan ini karena sandbox audit tidak
  punya akses jaringan untuk `npm install` — mohon jalankan
  `npm run build` di lingkungan pengembangan sebelum deploy ke produksi.
