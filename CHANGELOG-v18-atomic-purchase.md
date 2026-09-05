# V18 — Atomic Purchase Accounting

- Purchase posting is atomic in Supabase: Purchase → Inventory Movement → Moving Average Cost → Accounts Payable → Journal.
- Added atomic purchase payment: AP → Cash/Bank with purchase payment journal.
- Added purchase/vendor cloud hydration.
- Local fallback now snapshots inventory before posting and rolls back on failure.
- Purchase UI now supports vendor selection, due date, search, payable balance, and atomic-posting indicator.
- Next phase should be PO → Goods Receipt/Surat Jalan → Purchase Invoice → Retur Pembelian, reusing the same ledger primitives.
