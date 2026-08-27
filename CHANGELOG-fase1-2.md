# Fase 1–2: Fondasi Data-Layer + Product CRUD → Supabase

## Bug kritis yang ditemukan & diperbaiki

**Semua ID entity di-generate sebagai string biasa** (`` `prod-${Date.now()}` ``, `` `cust-${Date.now()}` ``, dst), padahal **setiap kolom `id` di skema Postgres bertipe `UUID`**. Akibatnya:

- Setiap upsert ke Supabase gagal dengan error `invalid input syntax for type uuid`.
- Kegagalan ini **tidak terlihat sama sekali di UI** karena setiap sync call cuma dibungkus `try/catch` yang isinya `console.error(...)`.
- Ini terjadi bahkan pada modul yang statusnya "🟢 sudah terintegrasi" (Customer, Invoice, Payment) — jadi sinkronisasi cloud kemungkinan **sudah gagal dari awal** untuk data yang dibuat lewat form UI.

Sudah diperbaiki dengan helper `generateId()` (pakai `crypto.randomUUID()`) untuk: Customer, Product, Invoice, Payment, Billing Letter, Document, Audit Log.

Untuk **data lama** yang sudah terlanjur punya ID tidak valid, ditambahkan `StorageService.repairLegacyProductIds()` yang otomatis jalan setiap login/hydrate — meregenerasi ID produk lama ke UUID valid dan mengoreksi referensi `productId` di item invoice yang terkait.

## Fondasi baru: sync-status tracking

Sebelumnya, kalau sinkron ke Supabase gagal, itu hilang begitu saja di console browser. Sekarang ada sistem pelacakan generik di `StorageService`:

- `getSyncFailures()` / `subscribeSyncStatus()` — komponen bisa tahu entity mana yang gagal sinkron.
- `retryFailedSyncs()` — coba sinkron ulang semua yang gagal.
- Dipakai di `ProductList.tsx`: muncul badge kuning "N produk belum tersinkron ke cloud" dengan tombol retry, kalau ada kegagalan.

Pola ini jadi template untuk modul berikutnya (Billing Letter, Document, Audit Log, Bank Reconciliation) — tinggal daftarkan table-nya di `retryFailedSyncs()`.

## Product CRUD → sekarang benar-benar tersambung ke Supabase

- `saveProduct()` dan `deleteProduct()` di `storage.ts` sekarang memanggil `SupabaseService.saveProduct` / `deleteProduct` (fungsi ini ternyata **sudah ada** di `supabaseService.ts` sejak awal, hanya belum pernah dipanggil — jadi Fase ini sebagian besar soal *menyambungkan*, bukan menulis dari nol).
- `hydrateFromSupabase()` (dipanggil saat login) sekarang juga menarik data produk dari cloud, sejajar dengan Customer/Invoice/Payment.
- Tombol "Migrate to Cloud" di Settings sekarang menjalankan `repairLegacyProductIds()` dulu sebelum push, supaya data lama ikut termigrasi dengan benar.

## Sudah diverifikasi

- ✅ `tsc --noEmit` bersih, tanpa error.
- ✅ `vite build` sukses (ada warning ukuran bundle >500KB — di luar scope fase ini, tapi dicatat untuk fase produksi nanti).

## Belum termasuk di fase ini (untuk fase berikutnya)

- Billing Letter, Document, Audit Log, Bank Reconciliation: fungsi Supabase-nya **sudah ada** di `supabaseService.ts` (`fetchBillingLetters`, `saveDocument`, `fetchAuditLogs`, dll) tapi juga belum dipanggil dari `storage.ts` — pola yang sama persis bisa dipakai untuk menyambungkannya, jauh lebih cepat dari perkiraan awal.
- ID untuk Bank Transaction (`bt-...`) belum diperbaiki — di luar scope Product, akan ditangani saat giliran fase Bank Reconciliation.
- Tax/Coretax masih perlu desain skema tabel baru dari nol.
- Transactional integrity (invoice + stok produk + audit log sebagai satu operasi atomic) masih fase terpisah.
