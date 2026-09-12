# BillingFlow v21 — Tender Costing & Profit Guard

- Added Costing & Profit tab inside Invoice/Tender detail (no new sidebar menu).
- Supports every costing line as either Rupiah (Rp) or percentage (%).
- Percentage basis can be Nilai Tender, HPP Barang, or Biaya Langsung.
- Automatically calculates HPP, total cost, estimated profit, margin, markup, BEP, target-margin price, and maximum safe HPP.
- Adds RUGI / TIPIS / AMAN status guard.
- Costing is saved locally and synchronized to Supabase when migration v21 is installed.
- Added `supabase/migration_v21_costing.sql` for persistent cloud storage.
