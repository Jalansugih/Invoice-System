# BillingFlow / RajaKas Invoice — Supabase v8

## Urutan
1. Jalankan seluruh migration lama yang sudah digunakan project.
2. Jalankan `supabase/migration_v7_document_foundation.sql` jika belum pernah dijalankan.
3. Jalankan `supabase/migration_v8_business_documents.sql`.

`supabase/migration.sql` juga sudah diperbarui dan memuat fondasi v8 sehingga dapat dipakai sebagai consolidated migration untuk database baru.

## Tabel baru
`public.business_documents`

Menyimpan Quotation, PO Customer, Sales Order, Surat Jalan, dan BAST dengan:
- tenant isolation melalui `organization_id`
- UUID primary key
- nomor dokumen unik per organisasi
- `parent_document_id` untuk rantai dokumen
- line items JSONB
- subtotal, pajak, grand total
- status lifecycle

## Verifikasi SQL setelah migrasi
```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'business_documents'
order by ordinal_position;

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'business_documents';
```
