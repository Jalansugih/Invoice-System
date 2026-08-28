-- =========================================================================
-- BILLINGFLOW — MIGRATION V6: Perbaikan RLS "chicken-and-egg" di organizations
-- Jalankan ini SETELAH supabase/migrations/initial_schema.sql (dan v4/v5 jika
-- sudah dipakai), di Supabase SQL Editor.
--
-- BUG YANG DIPERBAIKI:
-- "Organizations multi-tenant policy" (initial_schema.sql) memakai:
--     WITH CHECK (id = get_auth_org_id())
-- get_auth_org_id() membaca organization_id dari public.profiles milik
-- auth.uid(). Untuk user BARU, baris profiles itu belum ada -> get_auth_org_id()
-- mengembalikan NULL -> INSERT organizations pertama SELALU ditolak RLS.
-- Karena profiles.organization_id juga REFERENCES organizations(id), maka
-- INSERT ke profiles pun ikut gagal (foreign key ke organisasi yang gagal
-- dibuat). Akibatnya: signup/login pertama tidak pernah benar-benar
-- membuat baris organizations & profiles di Supabase, dan SEMUA data
-- turunannya (customers, invoices, products, dst - yang RLS-nya memeriksa
-- organization_id = get_auth_org_id()) ikut tidak pernah bisa tersimpan,
-- karena get_auth_org_id() akan selalu NULL. src/lib/storage.ts membungkus
-- setiap panggilan sync dalam try/catch yang hanya console.error, sehingga
-- kegagalan ini tidak terlihat sebagai error keras di UI.
-- =========================================================================

DROP POLICY IF EXISTS "Organizations multi-tenant policy" ON public.organizations;

-- Baca / update / hapus hanya organisasi milik sendiri (perilaku lama tetap sama)
CREATE POLICY "Organizations: view own org"
ON public.organizations FOR SELECT
USING (id = public.get_auth_org_id());

CREATE POLICY "Organizations: update own org"
ON public.organizations FOR UPDATE
USING (id = public.get_auth_org_id())
WITH CHECK (id = public.get_auth_org_id());

CREATE POLICY "Organizations: delete own org"
ON public.organizations FOR DELETE
USING (id = public.get_auth_org_id());

-- INSERT dibuka untuk siapa pun yang sudah login (bukan lagi bergantung pada
-- get_auth_org_id(), karena baris profiles-nya justru belum ada saat ini
-- terjadi). Ini persis pola bootstrap yang sudah dipakai di
-- migration_v2_rls_sync.sql ("Authenticated users can create an organization").
CREATE POLICY "Organizations: authenticated can bootstrap"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);
