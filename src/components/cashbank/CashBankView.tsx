import React, { useMemo, useState } from 'react';
import { Landmark, RefreshCw, CheckCircle2, Search } from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import { BankTransaction } from '../../types';

export const CashBankView: React.FC = () => {
  const org = StorageService.getOrganization();
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState('');

  const transactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return StorageService.getBankTransactions()
      .filter(t => !q || `${t.bankName} ${t.accountNumber} ${t.description} ${t.referenceNumber}`.toLowerCase().includes(q))
      .slice(0, 100);
  }, [query, refresh]);

  const summary = useMemo(() => {
    const all = StorageService.getBankTransactions();
    return {
      inflow: all.filter(t => t.type === 'CR').reduce((s,t) => s + Number(t.amount || 0), 0),
      outflow: all.filter(t => t.type === 'DB').reduce((s,t) => s + Number(t.amount || 0), 0),
      reconciled: all.filter(t => t.status === 'reconciled').length,
      unmatched: all.filter(t => t.status === 'unmatched' || t.status === 'matched').length,
    };
  }, [refresh]);

  const reconcile = async (tx: BankTransaction) => {
    if (!tx.matchedInvoiceId) return;
    try {
      await StorageService.reconcileTransaction(tx.id, tx.matchedInvoiceId);
      setRefresh(v => v + 1);
    } catch (e: any) {
      alert(e?.message || 'Gagal merekonsiliasi transaksi.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Landmark className="w-4 h-4" /> Keuangan
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Kas & Bank</h2>
          <p className="text-sm text-slate-500 mt-1">Rekening, mutasi, dan status rekonsiliasi penerimaan.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefresh(v => v + 1)}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="text-xs text-slate-500">Total Kas Masuk</div><div className="text-xl font-bold mt-1">{formatRupiah(summary.inflow)}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="text-xs text-slate-500">Total Kas Keluar</div><div className="text-xl font-bold mt-1">{formatRupiah(summary.outflow)}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="text-xs text-slate-500">Rekonsiliasi</div><div className="text-xl font-bold mt-1">{summary.reconciled} <span className="text-sm font-normal text-slate-400">terverifikasi</span></div></div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-900 mb-3">Rekening Bank</h3>
        {org.bankAccounts.length === 0 ? (
          <div className="text-sm text-slate-500">Belum ada rekening bank. Tambahkan rekening dari pengaturan perusahaan.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {org.bankAccounts.map(b => (
              <div key={b.id} className="rounded-lg border border-slate-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Landmark className="w-5 h-5" /></div>
                <div className="min-w-0"><div className="font-semibold text-slate-900">{b.bankName}</div><div className="text-xs text-slate-500">{b.accountNumber} · {b.accountHolder}</div></div>
                {b.isDefault && <span className="ml-auto text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold">Utama</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari bank, rekening, deskripsi, referensi..." className="pl-9" /></div>
          <span className="text-xs text-slate-400">{summary.unmatched} belum direkonsiliasi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3 text-left">Tanggal</th><th className="px-4 py-3 text-left">Bank</th><th className="px-4 py-3 text-left">Keterangan</th><th className="px-4 py-3 text-right">Nominal</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3"></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Belum ada mutasi bank.</td></tr> : transactions.map(t => (
                <tr key={t.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{formatIndoDate(t.transactionDate)}</td>
                  <td className="px-4 py-3">{t.bankName}<div className="text-xs text-slate-400">{t.accountNumber}</div></td>
                  <td className="px-4 py-3 max-w-md">{t.description}<div className="text-xs text-slate-400">{t.referenceNumber}</div></td>
                  <td className={`px-4 py-3 text-right font-semibold ${t.type === 'CR' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'CR' ? '+' : '-'}{formatRupiah(t.amount)}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold">{t.status}</span></td>
                  <td className="px-4 py-3 text-right">{t.matchedInvoiceId && t.status !== 'reconciled' && <Button size="sm" onClick={() => reconcile(t)}><CheckCircle2 className="w-4 h-4 mr-1" /> Rekonsiliasi</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
