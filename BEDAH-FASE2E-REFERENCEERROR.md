# Bedah FASE 2E — ReferenceError / is not defined

## Hasil
- `Landmark` pada `UserGuideModal.tsx` sudah dipastikan ter-import dari `lucide-react`.
- Seluruh penggunaan ikon Lucide yang ditambahkan pada FASE 2E diperiksa terhadap import lokal.
- Tidak ditemukan relative import `src` yang menunjuk ke file/index yang tidak ada.
- Semua item navigasi Sidebar memiliki renderer di `App.tsx` setelah penambahan `payment_gateway` ke `validTabs`.
- Referensi UI lama ke Bank Reconciliation dan Tax Reporting pada navigasi/runtime sudah tidak aktif.

## Hardening tambahan
- `App.tsx`: `payment_gateway` ditambahkan ke daftar route valid agar navigasi tidak kembali ke Dashboard saat URL disinkronkan.
- `Auth.tsx`: bootstrap profil pada callback `onAuthStateChange` dibungkus `try/catch` agar kegagalan RPC/RLS tidak menjadi uncaught browser exception.
- `DashboardView.tsx`: deskripsi dashboard dibersihkan dari referensi rekonsiliasi bank/pelaporan pajak.

## Validasi environment
TypeScript/Vite belum dapat dijalankan penuh di environment pemeriksaan karena `node_modules` pada arsip kerja tidak lengkap. Pemeriksaan source-level dilakukan untuk import relatif, ikon Lucide, route navigation, dan referensi modul FASE 2E.
