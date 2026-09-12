# BillingFlow — Costing & Profit v1

Implemented Costing & Profit as part of **Penjualan/Invoice → Detail**, with no new sidebar menu and no standalone costing module.

## Included
- Costing & Profit tab + Detail action button.
- Pure `calculateCosting()` engine separated from UI/database.
- Default HPP, Ongkir, Tenaga Kerja, Komisi, Iklan, Pajak, Overhead, Cadangan Risiko components.
- Rp / % input with Tender / HPP / Biaya Langsung basis.
- Total cost, profit, margin, markup, BEP, target price, maximum HPP and automatic health status.
- Supabase persistence through `supabase/migration_v21_costing.sql`.
- One active costing per invoice via unique invoice relation; component rows cascade safely.
- Tenant-isolated RLS and composite invoice/org foreign-key protection.
- Audit entry through the existing `audit_logs` table.
- Reload/edit persistence: Supabase is the production source of truth.

## Calculation convention
`Biaya Langsung` for percentage-basis calculations means fixed direct costs excluding HPP and excluding percentage-derived components. This avoids circular calculations while keeping the selected basis reproducible.
