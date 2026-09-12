# v11 — Phase 1 Document Engine

Fokus: mengurangi input ulang dan membuat seluruh dokumen transaksi saling terhubung.

## Perubahan

- Partial delivery: PO dapat dibuat menjadi beberapa Surat Jalan; quantity tersisa dihitung otomatis.
- Partial BAST: Surat Jalan dapat dibuat menjadi beberapa BAST; quantity yang belum dibuat BAST tetap tersedia.
- Partial invoicing: BAST dapat ditagihkan bertahap dengan memilih quantity invoice.
- Pencegahan over-delivery/over-BAST/over-invoice berdasarkan quantity yang sudah digunakan.
- Transaction Timeline: satu transaksi dapat ditelusuri dari dokumen sumber sampai turunannya.
- Document Hub sekarang ikut menampilkan Business Documents (Quotation, PO, Sales Order, Surat Jalan, BAST).
- Customer dan item tetap terbawa otomatis saat conversion.
- Invoice dari BAST menggunakan nomor BAST sebagai reference sehingga progress invoice dapat dihitung.

## Catatan arsitektur

- Relasi antar Business Document menggunakan `parentDocumentId`.
- Invoice tetap menggunakan `referenceNumber`/`poNumber` untuk menjaga kompatibilitas schema invoice yang sudah ada.
- Quantity progress dihitung dari child documents/invoices agar tidak perlu menambah kolom database baru pada fase ini.

## Validasi

- Struktur ZIP diverifikasi setelah packaging.
- `npm ci` dicoba untuk lint/build, namun environment eksekusi mengalami timeout sebelum dependency selesai terpasang. Karena itu production build belum dapat dinyatakan lulus dari environment ini.
