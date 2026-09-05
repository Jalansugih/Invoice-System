import React, { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Plus, Search, Pencil, Ban, CheckCircle2, AlertCircle } from 'lucide-react';
import { Account, AccountType, NormalBalance } from '../../types';
import { CoaService, AccountInput } from '../../lib/coaService';
import { useAuth } from '../auth/Auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'ASSET', label: 'Aset (Asset)' },
  { value: 'LIABILITY', label: 'Kewajiban (Liability)' },
  { value: 'EQUITY', label: 'Modal (Equity)' },
  { value: 'REVENUE', label: 'Pendapatan (Revenue)' },
  { value: 'COGS', label: 'Harga Pokok Penjualan (COGS)' },
  { value: 'EXPENSE', label: 'Beban (Expense)' },
];

const TYPE_LABEL: Record<AccountType, string> = {
  ASSET: 'Aset', LIABILITY: 'Kewajiban', EQUITY: 'Modal', REVENUE: 'Pendapatan', COGS: 'HPP', EXPENSE: 'Beban',
};

const TYPE_BADGE: Record<AccountType, 'info' | 'warning' | 'purple' | 'success' | 'default' | 'danger'> = {
  ASSET: 'info', LIABILITY: 'warning', EQUITY: 'purple', REVENUE: 'success', COGS: 'danger', EXPENSE: 'default',
};

// Normal balance is determined by account type in standard accounting —
// the form derives it automatically so a user can't create an
// inconsistent account (e.g. an Asset with a CREDIT normal balance).
const DEFAULT_NORMAL_BALANCE: Record<AccountType, NormalBalance> = {
  ASSET: 'DEBIT', LIABILITY: 'CREDIT', EQUITY: 'CREDIT', REVENUE: 'CREDIT', COGS: 'DEBIT', EXPENSE: 'DEBIT',
};

const emptyForm: AccountInput = { code: '', name: '', type: 'ASSET', normalBalance: 'DEBIT', isActive: true };

export const ChartOfAccountsView: React.FC = () => {
  const { user, canPerformAction } = useAuth();
  const canManage = canPerformAction('edit_all');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AccountType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AccountInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setLoadError('');
    try {
      const data = await CoaService.list(user?.organizationId);
      setAccounts(data.sort((a, b) => a.code.localeCompare(b.code)));
    } catch (e: any) {
      setLoadError(e?.message || 'Gagal memuat Kategori Akun (COA)');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [user?.organizationId]);

  const filtered = useMemo(() => accounts.filter(a => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || `${a.code} ${a.name}`.toLowerCase().includes(q);
    const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? a.isActive : !a.isActive);
    return matchesQuery && matchesType && matchesStatus;
  }), [accounts, query, typeFilter, statusFilter]);

  const counts = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter(a => a.isActive).length,
    inactive: accounts.filter(a => !a.isActive).length,
  }), [accounts]);

  const openCreate = () => { setForm(emptyForm); setFormError(''); setOpen(true); };
  const openEdit = (a: Account) => { setForm({ id: a.id, code: a.code, name: a.name, type: a.type, normalBalance: a.normalBalance, isActive: a.isActive }); setFormError(''); setOpen(true); };

  const submit = async () => {
    setSaving(true); setFormError('');
    try {
      await CoaService.save(form, user?.organizationId);
      setOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e?.message || 'Akun gagal disimpan');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (a: Account) => {
    const nextActive = !a.isActive;
    if (nextActive === false && !confirm(`Nonaktifkan akun "${a.code} — ${a.name}"? Histori jurnal yang sudah ada tidak akan hilang, akun hanya tidak muncul lagi untuk transaksi baru.`)) return;
    setBusyId(a.id);
    try {
      await CoaService.setActive(a.id, nextActive, user?.organizationId);
      await load();
    } catch (e: any) {
      setLoadError(e?.message || 'Gagal mengubah status akun');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider"><BookOpenCheck className="w-4 h-4" /> Akuntansi</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Kategori Akun (COA)</h1>
          <p className="text-sm text-slate-500 mt-1">Daftar akun ini adalah sumber data tunggal untuk Jurnal, Buku Besar, Neraca Saldo, dan seluruh laporan keuangan.</p>
        </div>
        {canManage && <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Akun Baru</Button>}
      </div>

      {!canManage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
          Anda hanya memiliki akses lihat. Pembuatan dan perubahan akun dibatasi untuk peran Owner, Admin, dan Finance.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[['Total Akun', counts.total], ['Aktif', counts.active], ['Nonaktif', counts.inactive]].map(([label, value]) => (
          <div key={label as string} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <div className="mt-2 text-lg font-bold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      {loadError && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {loadError}</div>}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3">
          <div className="flex-1"><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari kode atau nama akun..." leftIcon={<Search className="w-4 h-4" />} /></div>
          <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} options={[{ value: 'ALL', label: 'Semua tipe' }, ...ACCOUNT_TYPE_OPTIONS]} />
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} options={[{ value: 'ACTIVE', label: 'Aktif' }, { value: 'INACTIVE', label: 'Nonaktif' }, { value: 'ALL', label: 'Semua status' }]} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left px-5 py-3">Kode</th>
                <th className="text-left px-5 py-3">Nama Akun</th>
                <th className="text-left px-5 py-3">Tipe</th>
                <th className="text-left px-5 py-3">Saldo Normal</th>
                <th className="text-left px-5 py-3">Status</th>
                {canManage && <th className="text-right px-5 py-3">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500">Memuat data akun...</td></tr>}
              {!loading && filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono font-semibold text-blue-600">{a.code}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{a.name}</td>
                  <td className="px-5 py-4"><Badge variant={TYPE_BADGE[a.type]} size="sm">{TYPE_LABEL[a.type]}</Badge></td>
                  <td className="px-5 py-4 text-slate-600">{a.normalBalance === 'DEBIT' ? 'Debit' : 'Kredit'}</td>
                  <td className="px-5 py-4">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold', a.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {a.isActive ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />} {a.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant={a.isActive ? 'secondary' : 'outline'} size="sm" disabled={busyId === a.id} onClick={() => toggleActive(a)} className={a.isActive ? 'text-rose-700' : 'text-emerald-700'}>
                          {busyId === a.id ? '...' : a.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!loading && !filtered.length && <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500">Tidak ada akun yang sesuai filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={open} onClose={() => !saving && setOpen(false)} title={form.id ? 'Edit Akun' : 'Akun Baru'} maxWidth="lg">
        <div className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{formError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Kode Akun" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="cth. 1-1000" />
            <Input label="Nama Akun" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="cth. Kas" />
          </div>
          <Select
            label="Tipe Akun"
            value={form.type}
            onChange={e => { const type = e.target.value as AccountType; setForm(f => ({ ...f, type, normalBalance: DEFAULT_NORMAL_BALANCE[type] })); }}
            options={ACCOUNT_TYPE_OPTIONS}
          />
          <div className="text-xs text-slate-500">Saldo normal otomatis mengikuti tipe akun: <b>{form.normalBalance === 'DEBIT' ? 'Debit' : 'Kredit'}</b> — konsisten dengan kaidah akuntansi standar.</div>
          {form.id && (
            <Select label="Status" value={form.isActive ? '1' : '0'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === '1' }))} options={[{ value: '1', label: 'Aktif' }, { value: '0', label: 'Nonaktif' }]} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={submit} disabled={saving || !form.code.trim() || !form.name.trim()}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
