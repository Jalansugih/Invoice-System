import { supabase, isSupabaseConfigured } from './supabase';
import { generateId } from './storage';
import { ACCOUNT_STORAGE_KEY } from './expenseService';
import { localAccounts } from './accountingService';
import { Account, AccountType, NormalBalance } from '../types';

export interface AccountInput {
  id?: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  isActive: boolean;
}

const readLocal = (): Account[] => {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Account[];
  } catch { /* ignore corrupt demo cache */ }
  // First run in local/demo mode: seed from the canonical default list.
  const seeded = localAccounts.map(a => ({ ...a }));
  writeLocal(seeded);
  return seeded;
};
const writeLocal = (accounts: Account[]) => {
  try { localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts)); } catch { /* ignore demo cache errors */ }
};

/**
 * Real Chart of Accounts management.
 *
 * Replaces the "coa" FeaturePlaceholderView. In Supabase mode this reads
 * and writes the actual `accounts` table (via SECURITY DEFINER RPCs
 * upsert_account_atomic / set_account_active_atomic — see
 * supabase/migration_v22_coa_management.sql), not a hardcoded array.
 * In local/demo mode (no Supabase configured) it persists to the same
 * localStorage key ExpenseService already reads, so both stay in sync.
 */
export class CoaService {
  static async list(orgId?: string): Promise<Account[]> {
    if (isSupabaseConfigured && orgId) {
      const { error: ensureError } = await (supabase as any).rpc('ensure_default_accounts');
      if (ensureError) throw ensureError;
      const { data, error } = await (supabase as any)
        .from('accounts')
        .select('*')
        .eq('organization_id', orgId)
        .order('code');
      if (error) throw error;
      return (data || []).map((a: any): Account => ({
        id: a.id, code: a.code, name: a.name, type: a.account_type,
        normalBalance: a.normal_balance, isActive: a.is_active !== false,
      }));
    }
    return readLocal();
  }

  static async save(input: AccountInput, orgId?: string): Promise<Account> {
    const code = input.code.trim();
    const name = input.name.trim();
    if (!code) throw new Error('Kode akun wajib diisi');
    if (!name) throw new Error('Nama akun wajib diisi');

    if (isSupabaseConfigured && orgId) {
      const { data, error } = await (supabase as any).rpc('upsert_account_atomic', {
        p_id: input.id || null,
        p_code: code,
        p_name: name,
        p_account_type: input.type,
        p_normal_balance: input.normalBalance,
        p_is_active: input.isActive,
      });
      if (error) throw new Error(error.message || 'Gagal menyimpan akun');
      return {
        id: data.id, code: data.code, name: data.name, type: data.account_type,
        normalBalance: data.normal_balance, isActive: data.is_active !== false,
      };
    }

    const accounts = readLocal();
    const duplicate = accounts.find(a => a.code === code && a.id !== input.id);
    if (duplicate) throw new Error(`Kode akun "${code}" sudah digunakan`);

    let saved: Account;
    if (input.id) {
      const idx = accounts.findIndex(a => a.id === input.id);
      if (idx === -1) throw new Error('Akun tidak ditemukan');
      saved = { id: input.id, code, name, type: input.type, normalBalance: input.normalBalance, isActive: input.isActive };
      accounts[idx] = saved;
    } else {
      saved = { id: generateId(), code, name, type: input.type, normalBalance: input.normalBalance, isActive: input.isActive };
      accounts.push(saved);
    }
    writeLocal(accounts);
    return saved;
  }

  static async setActive(id: string, isActive: boolean, orgId?: string): Promise<void> {
    if (isSupabaseConfigured && orgId) {
      const { error } = await (supabase as any).rpc('set_account_active_atomic', { p_id: id, p_is_active: isActive });
      if (error) throw new Error(error.message || 'Gagal mengubah status akun');
      return;
    }
    const accounts = readLocal();
    const idx = accounts.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Akun tidak ditemukan');
    accounts[idx] = { ...accounts[idx], isActive };
    writeLocal(accounts);
  }
}
