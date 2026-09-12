# FASE 2A — Produk & Inventaris

- Menambahkan tracking persediaan, HPP, stok minimum, dan stok saat ini pada master produk.
- Menambahkan inventory_movements dan RPC penyesuaian stok atomic + tenant isolation.
- UI Produk menampilkan stok/non-stok dan penyesuaian stok.
- Jasa tetap non-stok secara default; tidak ada saldo stok sintetis.
- Pengurangan stok otomatis dari invoice belum diaktifkan sebelum workflow gudang/retur dikunci.

## Batas aman fase ini

Stok belum otomatis berkurang ketika invoice diposting. Pengurangan otomatis baru aman setelah metode penilaian persediaan (FIFO/average), retur, dan pembatalan invoice ditetapkan.
