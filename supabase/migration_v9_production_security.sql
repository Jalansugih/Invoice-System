-- =========================================================================
-- BILLINGFLOW V9 — PRODUCTION SECURITY HARDENING
-- Jalankan SETELAH migration.sql / v8 pada Supabase SQL Editor.
--
-- Tujuan:
-- 1. Mencegah user baru memilih organization_id milik tenant lain.
-- 2. Mencegah signup mengangkat role sendiri menjadi admin/owner.
-- 3. Memindahkan bootstrap organization/profile ke trigger database.
-- 4. Mengunci update profil agar user tidak bisa mengganti role/org sendiri.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := gen_random_uuid();
  v_org_name TEXT;
  v_full_name TEXT;
BEGIN
  v_org_name := COALESCE(NULLIF(trim(new.raw_user_meta_data->>'organization_name'), ''), 'Perusahaan Baru');
  v_full_name := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(COALESCE(new.email, 'user'), '@', 1)
  );

  -- Never trust organization_id or role supplied by the browser.
  INSERT INTO public.organizations (id, name, email, created_at, updated_at)
  VALUES (v_org_id, v_org_name, new.email, NOW(), NOW());

  INSERT INTO public.profiles (id, organization_id, name, email, role, created_at, updated_at)
  VALUES (new.id, v_org_id, v_full_name, new.email, 'owner', NOW(), NOW());

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles: a normal user can read/update only safe personal fields.
-- Role and organization membership are NOT writable from the client.
DROP POLICY IF EXISTS "Profiles isolation policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Profiles: members can read same tenant"
ON public.profiles FOR SELECT
USING (organization_id = public.get_auth_org_id());

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_auth_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated;

CREATE POLICY "Profiles: user can update safe fields"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND organization_id = public.get_auth_org_id()
  AND role = public.get_auth_role()
);

-- Client INSERT is disabled. The auth trigger is SECURITY DEFINER.
DROP POLICY IF EXISTS "Profiles: client insert disabled" ON public.profiles;

-- Organizations: remove insecure bootstrap INSERT from authenticated users.
DROP POLICY IF EXISTS "Organizations: authenticated can bootstrap" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create an organization" ON public.organizations;

-- Only the trigger/service role may create organizations.
-- No INSERT policy for authenticated users is intentional.

-- Prevent SECURITY DEFINER helper from being executable by anonymous users.
REVOKE ALL ON FUNCTION public.get_auth_org_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_org_id() TO authenticated;

-- Trigger function should not be callable by clients.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Verify RLS remains enabled.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
