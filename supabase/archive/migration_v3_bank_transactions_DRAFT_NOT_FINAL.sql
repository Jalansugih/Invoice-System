-- =========================================================================
-- BILLINGFLOW — DRAFT MIGRATION: Bank Reconciliation (bank_transactions)
--
-- STATUS: BELUM DIPAKAI / BELUM FINAL. Jangan dijalankan dulu.
--
-- Bank Reconciliation sengaja di-deprioritaskan untuk saat ini. Fitur ini
-- masih 100% localStorage. Sebelum melanjutkan migrasinya, ada keputusan
-- desain yang harus diambil lebih dulu:
--
-- Ditemukan DUA desain skema `bank_transactions` yang saling bertentangan
-- dalam project ini:
--   1. Skema di bawah ini (dibuat saat eksplorasi fase ini), mengikuti
--      bentuk interface `BankTransaction` yang benar-benar dipakai UI saat
--      ini (src/types/index.ts): transactionDate, status enum
--      unmatched/matched/reconciled/ignored, matchedPaymentId,
--      matchedInvoiceId, bankAccountId (FK ke bank_accounts), matchReason,
--      notes, dll.
--   2. Skema BankTransactionRow/Insert/Update yang SUDAH ADA di
--      src/types/database.ts (kemungkinan dibuat lebih dulu oleh developer
--      sebelumnya, sudah lengkap dengan tipe TS-nya): date, type
--      'credit'/'debit', is_reconciled (boolean), reconciled_with_type/
--      id/number, tanpa bankAccountId, tanpa status enum yang sama.
--
-- Keduanya TIDAK COCOK satu sama lain, dan tabelnya sendiri BELUM PERNAH
-- dibuat di database manapun (dicek di migration.sql, migration_v2, dan
-- migrations/initial_schema.sql - tidak ada satupun CREATE TABLE untuk
-- bank_transactions). Sebelum melanjutkan:
--   a) Putuskan mana yang jadi source of truth - kemungkinan besar redesain
--      ulang src/types/database.ts (opsi 2) untuk mengikuti interface UI
--      yang sudah dipakai (opsi 1), karena mengubah UI/business logic yang
--      sudah berjalan jauh lebih mahal daripada mengubah definisi tipe DB
--      yang belum pernah dipakai sama sekali.
--   b) Baru tulis satu migration SQL final yang konsisten dengan keputusan
--      itu, lalu sambungkan StorageService.saveBankTransactions() /
--      addBankTransaction() / deleteBankTransaction() ke Supabase mengikuti
--      pola yang sama seperti Product/Billing Letter/Document.
--
-- Skema di bawah ini adalah draft opsi (1) - referensi awal, BUKAN
-- keputusan final.
-- =========================================================================


CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    transaction_date DATE NOT NULL,
    value_date DATE,
    description TEXT NOT NULL DEFAULT '',
    amount NUMERIC(15,2) NOT NULL,
    type VARCHAR(2) NOT NULL CHECK (type IN ('CR', 'DB')),
    reference_number VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'unmatched'
        CHECK (status IN ('unmatched', 'matched', 'reconciled', 'ignored')),
    matched_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    matched_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    match_confidence INT,
    match_reason TEXT,
    reconciled_at TIMESTAMPTZ,
    reconciled_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_org ON public.bank_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON public.bank_transactions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_matched_invoice ON public.bank_transactions(matched_invoice_id);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Follows the same get_auth_org_id() helper pattern used by the other
-- tables in migration.sql (products, billing_letters, documents, ...).
DROP POLICY IF EXISTS "Bank transactions isolation policy" ON public.bank_transactions;
CREATE POLICY "Bank transactions isolation policy" ON public.bank_transactions
    FOR ALL
    USING (organization_id = public.get_auth_org_id())
    WITH CHECK (organization_id = public.get_auth_org_id());

-- =========================================================================
-- CATATAN untuk fase produksi berikutnya (di luar scope migrasi ini):
--
-- 1. Konsolidasi migration.sql vs migration_v2_rls_sync.sql: keduanya
--    membuat policy RLS terpisah untuk tabel yang sama (invoices, payments,
--    organizations, profiles) dengan pola berbeda (get_auth_org_id() vs
--    subquery langsung). Keduanya tetap "aman" (Postgres meng-OR-kan
--    multiple permissive policies), tapi ini teknis-utang yang sebaiknya
--    dirapikan jadi satu migration konsisten sebelum go-live, supaya tidak
--    membingungkan siapapun yang deploy skema ini di kemudian hari.
--
-- 2. Pertimbangkan UNIQUE constraint pada
--    (organization_id, bank_account_id, transaction_date, reference_number,
--    amount) untuk mencegah baris mutasi yang sama ter-import dobel saat
--    user meng-upload file rekening koran yang sama dua kali. Belum
--    ditambahkan di sini karena reference_number tidak selalu diisi bank,
--    dan constraint yang salah desain bisa menolak transaksi legit yang
--    kebetulan sama persis (misal 2x transfer Rp500.000 di hari yang sama).
-- =========================================================================
