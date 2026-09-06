# Audit Persistence BillingFlow v25

| Modul | Jalur simpan | Status |
|---|---|---|
| Pengaturan/Organisasi | Supabase organizations + bank_accounts | Cloud-first |
| Customer | Supabase customers | Cloud-first |
| Produk/Jasa | Supabase products | Cloud-first |
| Invoice | Atomic RPC / Supabase | Cloud-first |
| Pembayaran | Atomic RPC / Supabase | Cloud-first |
| Surat Tagihan | Supabase billing_letters | Cloud-first |
| Dokumen Arsip | Supabase documents | Generated + cloud sync |
| Quotation/PO/SO/DO/BAST | Supabase business_documents | Cloud-first |
| COA | Atomic RPC accounts | Cloud-first |
| Pengeluaran | Atomic RPC expense | Cloud-first |
| Pembelian/Vendor | Atomic RPC + vendors | Cloud-first |
| Kas/Bank reconciliation feed | local cache | **Belum final** — schema bank_transactions masih draft |
| Demo auth/session | localStorage | Sengaja hanya mode demo |
| UI guide seen flag | localStorage | UI preference, bukan business data |

## Prinsip
1. Jika Supabase aktif, tombol Simpan untuk business/master data utama menunggu hasil cloud write.
2. Jika cloud write gagal, cache lokal tidak dipakai untuk menyamarkan keberhasilan.
3. Setelah cloud commit, local cache diperbarui agar UI tetap sinkron.
4. RLS dan authenticated session tetap menjadi prasyarat.
