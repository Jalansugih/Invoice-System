# BillingFlow v8 — Test Plan

1. Run `npm install` then `npm run build`.
2. Apply `supabase/migration_v8_business_documents.sql` (or the consolidated `supabase/migration.sql`) after the existing migrations.
3. Login with a real Supabase user whose profile has a valid `organization_id`.
4. Open **Order & Dokumen Transaksi**.
5. Create a Quotation, save it, reopen it, and verify the row is present after refresh.
6. Create a PO and choose the quotation as **Dokumen induk / sumber**.
7. Create a Surat Jalan and BAST and link them to the previous document.
8. Open Preview → Cetak and Preview → PDF; verify A4, header, table, totals, signature, and page numbers.
9. Check Supabase `business_documents`: UUID ids, organization_id, parent_document_id, JSONB items, and RLS isolation.
10. Verify an account from another organization cannot SELECT another tenant's documents.
