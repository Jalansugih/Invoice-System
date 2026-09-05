import React, { useEffect, useState } from 'react';
import {
  BarChart3, CheckCircle2, Download, FileDown, FileWarning, Landmark, Printer,
  RefreshCw, WalletCards, ArrowUpRight, ArrowDownRight, ReceiptText, CreditCard,
  ChevronDown, ChevronRight, Percent, Boxes, BookOpen,
} from 'lucide-react';
import { AccountingService, AccountingLine, FinancialStatements } from '../../lib/accountingService';
import { useAuth } from '../auth/Auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { exportToCSV, exportToExcel, formatIndoDate, formatRupiah, printElement } from '../../lib/utils';
import { StorageService } from '../../lib/storage';

type ReportTab = 'summary' | 'profitLoss' | 'balanceSheet' | 'cashFlow' | 'generalLedger' | 'tax' | 'stock';

const money = (value: number) => formatRupiah(Number(value) || 0);
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };
const today = () => new Date().toISOString().slice(0, 10);

const LineTable: React.FC<{ lines: AccountingLine[]; totalLabel: string; total: number; simple?: boolean }> = ({ lines, totalLabel, total, simple }) => (
  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
          <tr><th className="px-5 py-3 text-left">{simple ? 'Akun' : 'Kode'}</th>{!simple && <th className="px-5 py-3 text-left">Akun</th>}<th className="px-5 py-3 text-right">Saldo</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.length === 0 ? <tr><td colSpan={simple ? 2 : 3} className="px-5 py-10 text-center text-slate-400">Belum ada transaksi pada periode ini.</td></tr> : lines.map(line => (
            <tr key={line.code} className="hover:bg-slate-50">
              <td className="px-5 py-3 font-medium text-slate-800">{simple ? line.name : <span className="font-mono text-xs text-slate-500">{line.code}</span>}</td>
              {!simple && <td className="px-5 py-3 font-medium text-slate-800">{line.name}</td>}
              <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums">{money(line.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 border-t border-slate-200"><tr><td colSpan={simple ? 1 : 2} className="px-5 py-3 font-bold text-slate-800">{totalLabel}</td><td className="px-5 py-3 text-right font-mono font-bold tabular-nums">{money(total)}</td></tr></tfoot>
      </table>
    </div>
  </div>
);

const ReportPlaceholder: React.FC<{ title: string; description: string; icon: React.ElementType }> = ({ title, description, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
    <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
    <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
    <p className="mt-2 max-w-lg mx-auto text-sm text-slate-500">{description}</p>
    <p className="mt-4 text-xs text-slate-400">Gunakan transaksi dan pengaturan yang tersedia untuk melengkapi data laporan.</p>
  </div>
);

export const FinancialReportsView: React.FC<{ initialReport?: ReportTab }> = ({ initialReport = 'summary' }) => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState<ReportTab>(initialReport);
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(today());
  const [data, setData] = useState<FinancialStatements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showIntegrity, setShowIntegrity] = useState(false);
  const [paper, setPaper] = useState<'A4' | 'F4'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => setActiveReport(initialReport), [initialReport]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      if (endDate < startDate) throw new Error('Tanggal akhir tidak boleh sebelum tanggal mulai.');
      setData(await AccountingService.getFinancialStatements(startDate, endDate, user?.organizationId));
    } catch (e: any) {
      console.error('[Reports] gagal memuat laporan:', e);
      // Report loading now falls back to local data automatically, so a
      // thrown error here is almost always a real input problem (e.g. an
      // invalid date range) — show that reason instead of a generic message.
      setError(e?.message || 'Laporan belum dapat dimuat. Silakan coba lagi.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const integrityOk = data ? data.integrity.unbalancedJournals === 0 && data.integrity.unjournalizedInvoices === 0 && data.integrity.unjournalizedPayments === 0 && data.integrity.unmappedBankPayments === 0 : true;
  const tabs: Array<{ id: ReportTab; label: string; icon: React.ElementType }> = [
    { id: 'summary', label: 'Ringkasan Keuangan', icon: BarChart3 },
    { id: 'profitLoss', label: 'Laba Rugi', icon: ReceiptText },
    { id: 'balanceSheet', label: 'Neraca', icon: Landmark },
    { id: 'cashFlow', label: 'Arus Kas', icon: WalletCards },
    { id: 'generalLedger', label: 'Buku Besar', icon: BookOpen },
    { id: 'tax', label: 'Laporan Pajak', icon: Percent },
    { id: 'stock', label: 'Laporan Stok', icon: Boxes },
  ];

  const exportRows = (): Record<string, any>[] => {
    if (!data) return [];
    if (activeReport === 'profitLoss') return [...data.profitLoss.revenue, ...data.profitLoss.cogs, ...data.profitLoss.expenses].map(x => ({ 'Kode Akun': x.code, 'Nama Akun': x.name, 'Jenis': x.accountType, 'Saldo': x.amount })).concat([{ 'Kode Akun': '', 'Nama Akun': 'LABA BERSIH', 'Jenis': '', 'Saldo': data.profitLoss.netProfit }]);
    if (activeReport === 'balanceSheet') return [...data.balanceSheet.assets, ...data.balanceSheet.liabilities, ...data.balanceSheet.equity].map(x => ({ 'Kode Akun': x.code, 'Nama Akun': x.name, 'Jenis': x.accountType, 'Saldo': x.amount })).concat([{ 'Kode Akun': '', 'Nama Akun': 'TOTAL ASET', 'Jenis': '', 'Saldo': data.balanceSheet.totalAssets }, { 'Kode Akun': '', 'Nama Akun': 'TOTAL LIABILITAS + EKUITAS', 'Jenis': '', 'Saldo': data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquity }]);
    return [
      { Keterangan: 'Pendapatan', Nominal: data.profitLoss.totalRevenue },
      { Keterangan: 'Pengeluaran + HPP', Nominal: data.profitLoss.totalCogs + data.profitLoss.totalExpenses },
      { Keterangan: 'Laba Bersih', Nominal: data.profitLoss.netProfit },
      { Keterangan: 'Kas & Bank', Nominal: data.cashFlow.closingCash },
      { Keterangan: 'Piutang', Nominal: data.receivables.balance },
      { Keterangan: 'Hutang', Nominal: data.payables.balance },
    ];
  };
  const exportCurrent = () => data && exportToCSV(`Laporan_${activeReport}_${endDate}`, exportRows());
  const exportExcel = () => data && exportToExcel(`Laporan_${activeReport}_${endDate}`, exportRows());
  const exportPdf = async () => { try { const { exportElementToPdf } = await import('../../lib/pdfExport'); await exportElementToPdf({ elementId: 'printable-report', filename: `Laporan_${activeReport}_${endDate}_${paper}.pdf`, marginMm: 10, addPageNumbers: true, paper, orientation }); } catch (e) { console.error(e); alert('Gagal membuat PDF. Silakan coba lagi.'); } };

  const summaryCards = data ? [
    { label: 'Pendapatan', value: data.profitLoss.totalRevenue, icon: ArrowUpRight, tone: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pengeluaran', value: data.profitLoss.totalCogs + data.profitLoss.totalExpenses, icon: ArrowDownRight, tone: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Laba Bersih', value: data.profitLoss.netProfit, icon: BarChart3, tone: data.profitLoss.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600', bg: data.profitLoss.netProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
    { label: 'Kas & Bank', value: data.cashFlow.closingCash, icon: Landmark, tone: 'text-slate-900', bg: 'bg-blue-50' },
    { label: 'Piutang', value: data.receivables.balance, icon: RefreshCw, tone: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Hutang', value: data.payables.balance, icon: CreditCard, tone: 'text-rose-600', bg: 'bg-rose-50' },
  ] : [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div><div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider"><BarChart3 className="w-4 h-4" /> Laporan</div><h2 className="text-2xl font-bold text-slate-900 mt-1">{tabs.find(t => t.id === activeReport)?.label}</h2><p className="text-sm text-slate-500 mt-1">Lihat kondisi keuangan dengan bahasa sederhana. Detail accounting tersedia saat dibutuhkan.</p></div>
        <div className="flex flex-wrap items-end gap-2"><div className="print:hidden"><label className="block text-[10px] font-semibold text-slate-500 mb-1">Kertas</label><select value={paper} onChange={e => setPaper(e.target.value as 'A4'|'F4')} className="h-9 rounded-lg border border-slate-200 px-3 text-xs bg-white"><option value="A4">A4</option><option value="F4">F4 / Folio</option></select></div><div className="print:hidden"><label className="block text-[10px] font-semibold text-slate-500 mb-1">Orientasi</label><select value={orientation} onChange={e => setOrientation(e.target.value as 'portrait'|'landscape')} className="h-9 rounded-lg border border-slate-200 px-3 text-xs bg-white"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div><Button variant="outline" size="sm" onClick={exportCurrent} disabled={!data || loading}><Download className="w-4 h-4 mr-1" /> CSV</Button><Button variant="outline" size="sm" onClick={exportExcel} disabled={!data || loading}><FileDown className="w-4 h-4 mr-1" /> Excel</Button><Button variant="outline" size="sm" onClick={exportPdf} disabled={!data || loading}><FileDown className="w-4 h-4 mr-1" /> PDF</Button><Button variant="outline" size="sm" onClick={() => printElement('printable-report', `Laporan ${tabs.find(t => t.id === activeReport)?.label || ''}`, { paper, orientation })} disabled={!data}><Printer className="w-4 h-4 mr-1" /> Cetak {paper}</Button></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col lg:flex-row lg:items-end gap-3"><div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="Mulai periode" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /><Input label="Sampai tanggal" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div><Button onClick={load} disabled={loading} className="h-10">{loading ? 'Memuat...' : 'Terapkan Periode'}</Button></div><div className="flex flex-wrap gap-2 mt-3"><span className="text-xs text-slate-400 self-center mr-1">Periode cepat:</span>{[['Bulan Ini', monthStart(), today()], ['Hari Ini', today(), today()]].map(([label, s, e]) => <button key={label} onClick={() => { setStartDate(s); setEndDate(e); }} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600">{label}</button>)}</div></div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-4"><div><div className="font-semibold text-rose-800">Laporan belum bisa ditampilkan</div><div className="text-sm text-rose-700 mt-1">{error}</div></div><Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Coba Lagi</Button></div>}

      {data && <div id="printable-report" className="printable-document space-y-5 bg-white p-0">
        {(() => {
          const org = StorageService.getOrganization();
          const addressLine = [org.address, org.city, org.province, org.postalCode].filter(Boolean).join(', ');
          const contactLine = [org.phone && `Telp: ${org.phone}`, org.email && `Email: ${org.email}`, org.website].filter(Boolean).join(' | ');
          return (
            <div className="avoid-page-break">
              {/* Kop Surat */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b-2 border-slate-900 pb-4">
                <div className="flex items-start gap-3 max-w-xl">
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt={org.name} className="h-12 w-auto max-w-[160px] object-contain shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg print:bg-blue-600 print:text-white">
                      {org.name ? org.name.slice(0, 2).toUpperCase() : 'BF'}
                    </div>
                  )}
                  <div>
                    <div className="text-lg font-black text-slate-900 leading-tight">{org.name}</div>
                    {org.tagline && <div className="text-xs text-slate-500 font-medium">{org.tagline}</div>}
                    {addressLine && <div className="text-xs text-slate-600 mt-1 leading-relaxed">{addressLine}</div>}
                    {contactLine && <div className="text-xs text-slate-600">{contactLine}</div>}
                    {org.npwp && <div className="text-xs text-slate-600">NPWP: <span className="font-mono">{org.npwp}</span></div>}
                  </div>
                </div>
                <div className="sm:text-right shrink-0">
                  <div className="text-base font-black uppercase text-slate-900">{tabs.find(t => t.id === activeReport)?.label}</div>
                  <div className="text-xs text-slate-500 mt-1">Periode {formatIndoDate(startDate)} s/d {formatIndoDate(endDate)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Dicetak {formatIndoDate(today())}</div>
                </div>
              </div>
            </div>
          );
        })()}
        <div className={`rounded-xl border p-4 ${integrityOk ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <button onClick={() => setShowIntegrity(v => !v)} className="w-full flex items-center gap-3 text-left"><div className={`w-9 h-9 rounded-lg flex items-center justify-center ${integrityOk ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{integrityOk ? <CheckCircle2 className="w-5 h-5" /> : <FileWarning className="w-5 h-5" />}</div><div className="flex-1"><div className="font-semibold text-slate-900">{integrityOk ? 'Data laporan siap digunakan' : 'Ada beberapa data yang perlu diperiksa'}</div><div className="text-xs text-slate-600 mt-0.5">{data.integrity.postedJournals} transaksi accounting telah diposting.</div></div>{showIntegrity ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}</button>
          {showIntegrity && <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs"><div>Jurnal tidak seimbang: <b>{data.integrity.unbalancedJournals}</b></div><div>Invoice belum tercatat: <b>{data.integrity.unjournalizedInvoices}</b></div><div>Pembayaran belum tercatat: <b>{data.integrity.unjournalizedPayments}</b></div><div>Bank belum dipetakan: <b>{data.integrity.unmappedBankPayments}</b></div></div>}
        </div>

        {activeReport === 'summary' && <>
          <div><h3 className="text-lg font-bold text-slate-900">Bagaimana kondisi keuangan bisnis Anda?</h3><p className="text-sm text-slate-500 mt-1">Ringkasan untuk periode {formatIndoDate(startDate)} sampai {formatIndoDate(endDate)}.</p></div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{summaryCards.map(card => { const Icon = card.icon; return <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{card.label}</span><span className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg} ${card.tone}`}><Icon className="w-4 h-4" /></span></div><div className={`mt-3 text-xl font-bold tabular-nums ${card.tone}`}>{money(card.value)}</div></div>; })}</div>
          <div className="grid lg:grid-cols-2 gap-4"><div className="rounded-xl border border-slate-200 bg-white p-5"><div className="text-sm font-bold text-slate-900">Ringkasan laba</div><div className="mt-4 space-y-3"><div className="flex justify-between text-sm"><span className="text-slate-500">Pendapatan</span><b>{money(data.profitLoss.totalRevenue)}</b></div><div className="flex justify-between text-sm"><span className="text-slate-500">HPP</span><b>{money(data.profitLoss.totalCogs)}</b></div><div className="flex justify-between text-sm"><span className="text-slate-500">Beban operasional</span><b>{money(data.profitLoss.totalExpenses)}</b></div><div className="pt-3 border-t flex justify-between"><span className="font-bold">Laba Bersih</span><b className={data.profitLoss.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{money(data.profitLoss.netProfit)}</b></div></div></div><div className="rounded-xl border border-slate-200 bg-white p-5"><div className="text-sm font-bold text-slate-900">Kas & tagihan</div><div className="mt-4 space-y-3"><div className="flex justify-between text-sm"><span className="text-slate-500">Saldo Kas & Bank</span><b>{money(data.cashFlow.closingCash)}</b></div><div className="flex justify-between text-sm"><span className="text-slate-500">Piutang yang masih harus diterima</span><b className="text-amber-600">{money(data.receivables.balance)}</b></div><div className="flex justify-between text-sm"><span className="text-slate-500">Hutang yang masih harus dibayar</span><b className="text-rose-600">{money(data.payables.balance)}</b></div></div></div></div>
        </>}

        {activeReport === 'profitLoss' && <div className="space-y-5"><LineTable lines={data.profitLoss.revenue} totalLabel="Total Pendapatan" total={data.profitLoss.totalRevenue} simple /><LineTable lines={data.profitLoss.cogs} totalLabel="Total HPP" total={data.profitLoss.totalCogs} simple /><LineTable lines={data.profitLoss.expenses} totalLabel="Total Beban Operasional" total={data.profitLoss.totalExpenses} simple /><div className="rounded-xl border-2 border-slate-900 bg-white p-5 flex justify-between items-center"><span className="font-bold">LABA / (RUGI) BERSIH</span><span className={`text-xl font-bold ${data.profitLoss.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(data.profitLoss.netProfit)}</span></div></div>}
        {activeReport === 'balanceSheet' && <div className="space-y-5"><LineTable lines={data.balanceSheet.assets} totalLabel="TOTAL ASET" total={data.balanceSheet.totalAssets} simple /><LineTable lines={data.balanceSheet.liabilities} totalLabel="TOTAL LIABILITAS" total={data.balanceSheet.totalLiabilities} simple /><LineTable lines={data.balanceSheet.equity} totalLabel="TOTAL EKUITAS" total={data.balanceSheet.totalEquity} simple /><div className={`rounded-xl border p-4 flex justify-between ${Math.abs(data.balanceSheet.balanceCheck) < 0.01 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}><span className="font-semibold">Status Neraca</span><span className="font-mono font-bold">{Math.abs(data.balanceSheet.balanceCheck) < 0.01 ? '✓ Seimbang' : `Selisih ${money(data.balanceSheet.balanceCheck)}`}</span></div></div>}
        {activeReport === 'cashFlow' && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">{[['Saldo awal', data.cashFlow.openingCash], ['Kas masuk', data.cashFlow.inflows], ['Kas keluar', data.cashFlow.outflows], ['Arus kas bersih', data.cashFlow.netCashFlow], ['Saldo akhir', data.cashFlow.closingCash]].map(([label, value]) => <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-5"><div className="text-xs text-slate-500">{label}</div><div className="mt-2 text-lg font-bold tabular-nums">{money(value as number)}</div></div>)}</div>}
        {activeReport === 'generalLedger' && <ReportPlaceholder title="Buku Besar" description="Buku Besar menampilkan detail transaksi berdasarkan akun. Pilih akun dan periode untuk melihat debit, kredit, dan saldo secara rinci." icon={BookOpen} />}
        {activeReport === 'tax' && <ReportPlaceholder title="Laporan Pajak" description="Laporan pajak akan menggunakan transaksi dan preferensi pajak perusahaan. Tidak ada angka pajak yang dibuat secara manual jika datanya belum tersedia." icon={Percent} />}
        {activeReport === 'stock' && <ReportPlaceholder title="Laporan Stok" description="Laporan stok menampilkan posisi persediaan dan pergerakannya berdasarkan inventory engine yang sudah ada." icon={Boxes} />}
      </div>}

      {!data && loading && <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 rounded-xl border border-slate-200 bg-white animate-pulse" />)}</div>}

      <div className="flex items-center gap-2 border-t border-slate-200 pt-4 overflow-x-auto">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveReport(tab.id)} className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap font-semibold ${activeReport === tab.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Icon className="w-4 h-4" />{tab.label}</button>; })}</div>
    </div>
  );
};

