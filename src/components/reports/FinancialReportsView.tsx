import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Download, FileDown, FileWarning, Landmark, Printer, RefreshCw, WalletCards } from 'lucide-react';
import { AccountingService, AccountingLine, FinancialStatements } from '../../lib/accountingService';
import { useAuth } from '../auth/Auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { exportToCSV, exportToExcel, formatIndoDate, formatRupiah, printElement } from '../../lib/utils';

type ReportTab = 'profitLoss' | 'balanceSheet' | 'cashFlow' | 'receivables' | 'payables';

const money = (value: number) => formatRupiah(Number(value) || 0);
const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

const LineTable: React.FC<{ lines: AccountingLine[]; totalLabel: string; total: number }> = ({ lines, totalLabel, total }) => (
  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
          <tr><th className="px-5 py-3 text-left">Kode</th><th className="px-5 py-3 text-left">Akun</th><th className="px-5 py-3 text-right">Saldo</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.length === 0 ? (
            <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-400">Belum ada jurnal pada periode ini.</td></tr>
          ) : lines.map(line => (
            <tr key={line.code} className="hover:bg-slate-50">
              <td className="px-5 py-3 font-mono text-xs text-slate-500">{line.code}</td>
              <td className="px-5 py-3 font-medium text-slate-800">{line.name}</td>
              <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums">{money(line.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 border-t border-slate-200">
          <tr><td colSpan={2} className="px-5 py-3 font-bold text-slate-800">{totalLabel}</td><td className="px-5 py-3 text-right font-mono font-bold tabular-nums">{money(total)}</td></tr>
        </tfoot>
      </table>
    </div>
  </div>
);

export const FinancialReportsView: React.FC = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState<ReportTab>('profitLoss');
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(today());
  const [data, setData] = useState<FinancialStatements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      if (endDate < startDate) throw new Error('Tanggal akhir tidak boleh sebelum tanggal mulai.');
      setData(await AccountingService.getFinancialStatements(startDate, endDate, user?.organizationId));
    } catch (e: any) {
      setError(e?.message || 'Laporan akuntansi gagal dimuat.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const integrityOk = data
    ? data.integrity.unbalancedJournals === 0 &&
      data.integrity.unjournalizedInvoices === 0 &&
      data.integrity.unjournalizedPayments === 0 &&
      data.integrity.unmappedBankPayments === 0
    : true;

  const tabs: Array<{ id: ReportTab; label: string; icon: React.ElementType }> = [
    { id: 'profitLoss', label: 'Laba Rugi', icon: BarChart3 },
    { id: 'balanceSheet', label: 'Neraca', icon: Landmark },
    { id: 'cashFlow', label: 'Arus Kas', icon: WalletCards },
    { id: 'receivables', label: 'Piutang', icon: RefreshCw },
    { id: 'payables', label: 'Hutang', icon: RefreshCw },
  ];

  const exportCurrent = () => {
    if (!data) return;
    const rows: Record<string, any>[] = [];
    if (activeReport === 'profitLoss') {
      [...data.profitLoss.revenue, ...data.profitLoss.cogs, ...data.profitLoss.expenses].forEach(x => rows.push({ 'Kode Akun': x.code, 'Nama Akun': x.name, 'Jenis': x.accountType, 'Saldo': x.amount }));
      rows.push({ 'Kode Akun': '', 'Nama Akun': 'LABA BERSIH', 'Jenis': '', 'Saldo': data.profitLoss.netProfit });
    } else if (activeReport === 'balanceSheet') {
      [...data.balanceSheet.assets, ...data.balanceSheet.liabilities, ...data.balanceSheet.equity].forEach(x => rows.push({ 'Kode Akun': x.code, 'Nama Akun': x.name, 'Jenis': x.accountType, 'Saldo': x.amount }));
      rows.push({ 'Kode Akun': '', 'Nama Akun': 'TOTAL ASET', 'Jenis': '', 'Saldo': data.balanceSheet.totalAssets });
      rows.push({ 'Kode Akun': '', 'Nama Akun': 'TOTAL LIABILITAS + EKUITAS', 'Jenis': '', 'Saldo': data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquity });
    } else if (activeReport === 'cashFlow') {
      rows.push({ 'Keterangan': 'Saldo awal kas/bank', 'Nominal': data.cashFlow.openingCash });
      rows.push({ 'Keterangan': 'Kas masuk', 'Nominal': data.cashFlow.inflows });
      rows.push({ 'Keterangan': 'Kas keluar', 'Nominal': data.cashFlow.outflows });
      rows.push({ 'Keterangan': 'Arus kas bersih', 'Nominal': data.cashFlow.netCashFlow });
      rows.push({ 'Keterangan': 'Saldo akhir kas/bank', 'Nominal': data.cashFlow.closingCash });
    } else if (activeReport === 'receivables') {
      rows.push({ 'Keterangan': 'Saldo Piutang Usaha', 'Nominal': data.receivables.balance });
    } else {
      rows.push({ 'Keterangan': 'Saldo Hutang Usaha', 'Nominal': data.payables.balance });
    }
    exportToCSV(`Laporan_Akuntansi_${activeReport}_${endDate}`, rows);
  };

  const exportExcel = () => {
    if (!data) return;
    const rows: Record<string, any>[] = [];
    if (activeReport === 'profitLoss') {
      [...data.profitLoss.revenue, ...data.profitLoss.cogs, ...data.profitLoss.expenses].forEach(x => rows.push({ 'Kode Akun': x.code, 'Nama Akun': x.name, 'Jenis': x.accountType, 'Saldo': x.amount }));
      rows.push({ 'Kode Akun': '', 'Nama Akun': 'LABA BERSIH', 'Jenis': '', 'Saldo': data.profitLoss.netProfit });
    } else if (activeReport === 'balanceSheet') {
      [...data.balanceSheet.assets, ...data.balanceSheet.liabilities, ...data.balanceSheet.equity].forEach(x => rows.push({ 'Kode Akun': x.code, 'Nama Akun': x.name, 'Jenis': x.accountType, 'Saldo': x.amount }));
      rows.push({ 'Kode Akun': '', 'Nama Akun': 'TOTAL ASET', 'Jenis': '', 'Saldo': data.balanceSheet.totalAssets });
      rows.push({ 'Kode Akun': '', 'Nama Akun': 'TOTAL LIABILITAS + EKUITAS', 'Jenis': '', 'Saldo': data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquity });
    } else if (activeReport === 'cashFlow') {
      rows.push({ 'Keterangan': 'Saldo awal kas/bank', 'Nominal': data.cashFlow.openingCash }, { 'Keterangan': 'Kas masuk', 'Nominal': data.cashFlow.inflows }, { 'Keterangan': 'Kas keluar', 'Nominal': data.cashFlow.outflows }, { 'Keterangan': 'Arus kas bersih', 'Nominal': data.cashFlow.netCashFlow }, { 'Keterangan': 'Saldo akhir kas/bank', 'Nominal': data.cashFlow.closingCash });
    } else if (activeReport === 'receivables') {
      rows.push({ 'Keterangan': 'Saldo Piutang Usaha', 'Nominal': data.receivables.balance });
    } else {
      rows.push({ 'Keterangan': 'Saldo Hutang Usaha', 'Nominal': data.payables.balance });
    }
    exportToExcel(`Laporan_Keuangan_${activeReport}_${endDate}`, rows);
  };

  const exportPdf = async () => {
    try {
      const { exportElementToPdf } = await import('../../lib/pdfExport');
      await exportElementToPdf({
        elementId: 'printable-report',
        filename: `Laporan_Keuangan_${activeReport}_${endDate}.pdf`,
        marginMm: 10,
        addPageNumbers: true,
      });
    } catch (e: any) {
      alert(e?.message || 'Gagal membuat PDF.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider"><BarChart3 className="w-4 h-4" /> Akuntansi</div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Laporan Keuangan</h2>
          <p className="text-sm text-slate-500 mt-1">Semua angka bersumber dari jurnal Posted. Invoice, penerimaan, pengeluaran, dan pembayaran tidak dihitung ulang di halaman laporan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCurrent} disabled={!data || loading}><Download className="w-4 h-4 mr-1" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={!data || loading}><FileDown className="w-4 h-4 mr-1" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={!data || loading}><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
          <Button variant="outline" size="sm" onClick={() => printElement('printable-report', `Laporan ${tabs.find(t => t.id === activeReport)?.label || ''}`)}><Printer className="w-4 h-4 mr-1" /> Print</Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Input label="Mulai periode" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input label="Sampai tanggal" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <Button onClick={load} disabled={loading} className="h-10">{loading ? 'Memuat...' : 'Terapkan Periode'}</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {data && (
        <div id="printable-report" className="bg-white">
          <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">Laporan Keuangan</h1>
            <p className="text-sm text-slate-600 mt-1">{tabs.find(t => t.id === activeReport)?.label} • Periode {formatIndoDate(startDate)} s.d. {formatIndoDate(endDate)}</p>
          </div>
          <div className={`rounded-xl border p-4 ${integrityOk ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-start gap-3">
              {integrityOk ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <FileWarning className="w-5 h-5 text-amber-600 mt-0.5" />}
              <div className="text-sm">
                <div className="font-semibold text-slate-900">{integrityOk ? 'Ledger sehat' : 'Ada data yang perlu ditindaklanjuti'}</div>
                <div className="text-xs text-slate-600 mt-1">
                  {data.integrity.postedJournals} jurnal Posted • Debit {money(data.integrity.debitTotal)} • Kredit {money(data.integrity.creditTotal)}
                  {!integrityOk && ` • Jurnal tidak balance: ${data.integrity.unbalancedJournals} • Invoice tanpa jurnal: ${data.integrity.unjournalizedInvoices} • Penerimaan tanpa jurnal: ${data.integrity.unjournalizedPayments} • Bank belum dipetakan: ${data.integrity.unmappedBankPayments}`}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['Laba Bersih', data.profitLoss.netProfit, data.profitLoss.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'],
              ['Kas/Bank Akhir', data.cashFlow.closingCash, 'text-slate-900'],
              ['Piutang Usaha', data.receivables.balance, 'text-amber-600'],
              ['Hutang Usaha', data.payables.balance, 'text-rose-600'],
            ].map(([label, value, cls]) => (
              <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
                <div className={`mt-1 text-lg font-bold tabular-nums ${cls}`}>{money(value as number)}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return <button key={tab.id} onClick={() => setActiveReport(tab.id)} className={`text-xs px-4 py-2.5 font-semibold rounded-t-xl flex items-center gap-2 whitespace-nowrap ${activeReport === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Icon className="w-4 h-4" />{tab.label}</button>;
            })}
          </div>

          {activeReport === 'profitLoss' && (
            <div className="space-y-5">
              <LineTable lines={data.profitLoss.revenue} totalLabel="Total Pendapatan" total={data.profitLoss.totalRevenue} />
              <LineTable lines={data.profitLoss.cogs} totalLabel="Total HPP" total={data.profitLoss.totalCogs} />
              <LineTable lines={data.profitLoss.expenses} totalLabel="Total Beban Operasional" total={data.profitLoss.totalExpenses} />
              <div className="rounded-xl border-2 border-slate-900 bg-white p-5 flex justify-between items-center"><span className="font-bold text-slate-900">LABA / (RUGI) BERSIH</span><span className={`text-xl font-bold ${data.profitLoss.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(data.profitLoss.netProfit)}</span></div>
            </div>
          )}

          {activeReport === 'balanceSheet' && (
            <div className="space-y-5">
              <LineTable lines={data.balanceSheet.assets} totalLabel="TOTAL ASET" total={data.balanceSheet.totalAssets} />
              <LineTable lines={data.balanceSheet.liabilities} totalLabel="TOTAL LIABILITAS" total={data.balanceSheet.totalLiabilities} />
              <LineTable lines={data.balanceSheet.equity} totalLabel="TOTAL EKUITAS" total={data.balanceSheet.totalEquity} />
              <div className={`rounded-xl border p-4 flex justify-between ${Math.abs(data.balanceSheet.balanceCheck) < 0.01 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                <span className="font-semibold">Check: Aset − (Liabilitas + Ekuitas)</span><span className="font-mono font-bold">{money(data.balanceSheet.balanceCheck)}</span>
              </div>
            </div>
          )}

          {activeReport === 'cashFlow' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                ['Saldo awal', data.cashFlow.openingCash],
                ['Kas masuk', data.cashFlow.inflows],
                ['Kas keluar', data.cashFlow.outflows],
                ['Arus kas bersih', data.cashFlow.netCashFlow],
                ['Saldo akhir', data.cashFlow.closingCash],
              ].map(([label, value]) => <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-5"><div className="text-xs text-slate-500">{label}</div><div className="mt-2 text-lg font-bold tabular-nums">{money(value as number)}</div></div>)}
            </div>
          )}

          {activeReport === 'receivables' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6"><div className="text-sm text-slate-500">Saldo Piutang Usaha per {formatIndoDate(endDate)}</div><div className="mt-2 text-3xl font-bold text-amber-600">{money(data.receivables.balance)}</div><p className="text-xs text-slate-500 mt-3">Saldo berasal dari akun 1-2000 pada ledger Posted, bukan dari total_outstanding customer.</p></div>
          )}

          {activeReport === 'payables' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6"><div className="text-sm text-slate-500">Saldo Hutang Usaha per {formatIndoDate(endDate)}</div><div className="mt-2 text-3xl font-bold text-rose-600">{money(data.payables.balance)}</div><p className="text-xs text-slate-500 mt-3">Saldo berasal dari akun 2-1000 pada ledger Posted. Pembayaran hutang mengurangi saldo melalui jurnal Dr Hutang → Cr Kas/Bank.</p></div>
          )}
        </div>
      )}
    </div>
  );
};
