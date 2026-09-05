-- BILLINGFLOW V22 — CHART OF ACCOUNTS (COA) MANAGEMENT
-- Run after V12 (accounts/journal_entries/journal_lines already exist).
-- Fixes: "coa" menu was a client-side FeaturePlaceholderView backed by a
-- HARDCODED array in accountingService.ts, not the real `accounts` table.
--
-- Design decisions (intentional):
-- 1. No direct INSERT/UPDATE RLS policy is added on public.accounts.
--    All writes go through SECURITY DEFINER RPCs below, matching the
--    pattern already used for purchases/payments (v17-v19). This keeps
--    the attack surface identical to the rest of the app instead of
--    opening a new direct-write policy that would need its own audit.
-- 2. Accounts are never hard-deleted (accounts.id is referenced by
--    journal_lines with ON DELETE RESTRICT, and by expense_items /
--    expense_transactions). Only activate/deactivate is exposed —
--    standard accounting practice: retire an account, don't erase it.
-- 3. Only owner/admin/finance may create, edit, or (de)activate accounts.
--    staff/viewer can still SELECT (existing "accounts tenant read" policy).

CREATE OR REPLACE FUNCTION public.upsert_account_atomic(
  p_id UUID DEFAULT NULL,
  p_code TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_account_type TEXT DEFAULT NULL,
  p_normal_balance TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID := public.get_auth_org_id();
  v_role TEXT := public.get_auth_role();
  v_code TEXT := trim(COALESCE(p_code, ''));
  v_name TEXT := trim(COALESCE(p_name, ''));
  v_id UUID;
  v_row public.accounts;
BEGIN
  IF v_org IS NULL THEN RAISE EXCEPTION 'Organisasi tidak ditemukan'; END IF;
  IF v_role NOT IN ('owner','admin','finance') THEN
    RAISE EXCEPTION 'Anda tidak memiliki izin untuk mengelola Kategori Akun (COA)';
  END IF;

  IF v_code = '' THEN RAISE EXCEPTION 'Kode akun wajib diisi'; END IF;
  IF v_name = '' THEN RAISE EXCEPTION 'Nama akun wajib diisi'; END IF;
  IF p_account_type NOT IN ('ASSET','LIABILITY','EQUITY','REVENUE','COGS','EXPENSE') THEN
    RAISE EXCEPTION 'Tipe akun tidak valid';
  END IF;
  IF p_normal_balance NOT IN ('DEBIT','CREDIT') THEN
    RAISE EXCEPTION 'Saldo normal tidak valid';
  END IF;

  IF p_id IS NULL THEN
    v_id := gen_random_uuid();
    BEGIN
      INSERT INTO public.accounts (id, organization_id, code, name, account_type, normal_balance, is_active)
      VALUES (v_id, v_org, v_code, v_name, p_account_type, p_normal_balance, COALESCE(p_is_active, TRUE))
      RETURNING * INTO v_row;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Kode akun "%" sudah digunakan', v_code;
    END;
  ELSE
    SELECT * INTO v_row FROM public.accounts WHERE id = p_id AND organization_id = v_org FOR UPDATE;
    IF v_row.id IS NULL THEN RAISE EXCEPTION 'Akun tidak ditemukan'; END IF;
    BEGIN
      UPDATE public.accounts
        SET code = v_code, name = v_name, account_type = p_account_type,
            normal_balance = p_normal_balance, is_active = COALESCE(p_is_active, is_active),
            updated_at = NOW()
        WHERE id = p_id AND organization_id = v_org
        RETURNING * INTO v_row;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Kode akun "%" sudah digunakan', v_code;
    END;
  END IF;

  RETURN jsonb_build_object(
    'id', v_row.id, 'code', v_row.code, 'name', v_row.name,
    'account_type', v_row.account_type, 'normal_balance', v_row.normal_balance,
    'is_active', v_row.is_active
  );
END; $$;

REVOKE ALL ON FUNCTION public.upsert_account_atomic(UUID,TEXT,TEXT,TEXT,TEXT,BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_account_atomic(UUID,TEXT,TEXT,TEXT,TEXT,BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_account_active_atomic(
  p_id UUID,
  p_is_active BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org UUID := public.get_auth_org_id();
  v_role TEXT := public.get_auth_role();
  v_row public.accounts;
BEGIN
  IF v_org IS NULL THEN RAISE EXCEPTION 'Organisasi tidak ditemukan'; END IF;
  IF v_role NOT IN ('owner','admin','finance') THEN
    RAISE EXCEPTION 'Anda tidak memiliki izin untuk mengubah status akun';
  END IF;

  UPDATE public.accounts SET is_active = p_is_active, updated_at = NOW()
    WHERE id = p_id AND organization_id = v_org
    RETURNING * INTO v_row;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Akun tidak ditemukan'; END IF;

  RETURN jsonb_build_object('id', v_row.id, 'is_active', v_row.is_active);
END; $$;

REVOKE ALL ON FUNCTION public.set_account_active_atomic(UUID,BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_account_active_atomic(UUID,BOOLEAN) TO authenticated;

-- Read side: the existing "accounts tenant read" policy (v12) only covers
-- SELECT for authenticated users already scoped to their org, which is
-- correct and unchanged. The COA screen also needs to see INACTIVE
-- accounts (to reactivate them) — that policy already allows this since
-- it has no is_active filter, only the org filter. No RLS change needed
-- here; the earlier "accounts tenant read" already exists from V12.
