import React, { useState, useMemo } from 'react';
import { TaxTransaction, TaxPeriodSummary } from '../../types/tax';
import { formatRupiah, formatIndoDate, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  FileText,
  Download,
  Search,
  Plus,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';

interface TaxVatViewProps {
  transactions: TaxTransaction[];
  periodSummary: TaxPeriodSummary;
  onDrilldown: (tx: TaxTransaction) => void;
  onOpenNewModal: () => void;
  onSyncInvoices: () => void;
  onViewSourceInvoice?: (invoiceId: string) => void;
}

export const TaxVatView: React.FC<TaxVatViewProps> = ({
  transactions,
  periodSummary,
  onDrilldown,
  onOpenNewModal,
  onSyncInvoices,
  onViewSourceInvoice,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'output' | 'input' | 'recap'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const vatTransactions = useMemo(() => {
    return transactions.filter((t) => t.taxType === 'PPN');
  }, [transactions]);

  const outputVatList = useMemo(() => {
    return vatTransactions.filter((t) => t.category === 'output_vat');
  }, [vatTransactions]);

  const inputVatList = useMemo(() => {
    return vatTransactions.filter((t) => t.category === 'input_vat');
  }, [vatTransactions]);

  const filteredList = useMemo(() => {
    let list = vatTransactions;
    if (activeSubTab === 'output') list = outputVatList;
    if (activeSubTab === 'input') list = inputVatList;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) =>
        t.partyName.toLowerCase().includes(q) ||
        t.sourceDocNumber.toLowerCase().includes(q) ||
        (t.taxInvoiceNumber && t.taxInvoiceNumber.toLowerCase().includes(q)) ||
        t.partyNpwp.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
    );
  }, [vatTransactions, outputVatList, inputVatList, activeSubTab, searchQuery]);

  const handleExportEfakturCSV = () => {
    const data = filteredList.map((t) => ({
      'Nomor Transaksi': t.transactionNumber,
      'Jenis Pajak': t.taxType,
      'Kategori': t.category === 'output_vat' ? 'Pajak Keluaran' : 'Pajak Masukan',
      'Tanggal Faktur': t.transactionDate,
      'Nomor Seri Faktur Pajak (NSFP)': t.taxInvoiceNumber || '-',
      'Nomor Dokumen Sumber': t.sourceDocNumber,
      'Nama Lawan Transaksi': t.partyName,
      'NPWP': t.partyNpwp,
      'DPP (Rp)': t.dpp,
      'Tarif (%)': t.taxRate,
      'PPN (Rp)': t.taxAmount,
      'Dapat Dikreditkan': t.isCreditable ? 'Ya' : 'Tidak',
      'Status Penyetoran': t.paymentStatus,
    }));
    exportToCSV(`eFaktur_PPN_${periodSummary.year}_Masa${periodSummary.month}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Top PPN Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Pajak Keluaran (Penjualan)</span>
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-600 mt-1 font-mono tracking-tight">
            {formatRupiah(periodSummary.totalOutputVatAmount)}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>DPP: {formatRupiah(periodSummary.totalOutputVatDpp)}</span>
            <span className="font-semibold text-slate-700">{outputVatList.length} Faktur</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Pajak Masukan (Pembelian)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-1 font-mono tracking-tight">
            {formatRupiah(periodSummary.inputVatCreditableAmount)}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>DPP: {formatRupiah(periodSummary.totalInputVatDpp)}</span>
            <span className="font-semibold text-slate-700">{inputVatList.length} Faktur</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Kompensasi Lebih Bayar</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-purple-600 mt-1 font-mono tracking-tight">
            {formatRupiah(periodSummary.vatPreviousPeriodOverpaymentCompensation)}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>Dari Masa Sebelumnya</span>
            <span className="text-purple-700 font-medium">Kompensasi</span>
          </div>
        </div>

        <div
          className={`border rounded-xl p-4 shadow-xs ${
            periodSummary.vatUnderpaid > 0
              ? 'bg-rose-50/40 border-rose-200'
              : 'bg-emerald-50/40 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>PPN Kurang / (Lebih) Bayar</span>
            <ShieldCheck className="w-4 h-4 text-slate-700" />
          </div>
          <p
            className={`text-xl font-bold mt-1 font-mono tracking-tight ${
              periodSummary.vatUnderpaid > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {periodSummary.vatUnderpaid > 0
              ? formatRupiah(periodSummary.vatUnderpaid)
              : `(${formatRupiah(periodSummary.vatOverpaid)})`}
          </p>
          <div className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-200/60 flex justify-between">
            <span>
              {periodSummary.vatUnderpaid > 0 ? 'Status: Kurang Bayar (KB)' : 'Status: Lebih Bayar (LB)'}
            </span>
            <Badge variant={periodSummary.vatUnderpaid > 0 ? 'warning' : 'success'} size="sm">
              Form 1111 AB
            </Badge>
          </div>
        </div>
      </div>

      {/* Recapitulation Workflow Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            Integrasi Faktur Pajak & Akuntansi Terpadu (SPT Masa PPN 1111)
          </h3>
          <p className="text-xs text-slate-300">
            Penjualan → Invoice → Faktur Pajak Keluaran → Jurnal Piutang & PPN → Rekapitulasi SPT Masa
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onSyncInvoices}
            leftIcon={<RefreshCw className="w-4 h-4 text-blue-400" />}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            Sinkronisasi Invoice ke PPN
          </Button>
          <Button
            size="sm"
            onClick={onOpenNewModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            + Input Faktur Masukan / Manual
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportEfakturCSV}
            leftIcon={<Download className="w-4 h-4" />}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            Ekspor e-Faktur CSV
          </Button>
        </div>
      </div>

      {/* Filters & SubTabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSubTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Faktur PPN ({vatTransactions.length})
            </button>
            <button
              onClick={() => setActiveSubTab('output')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'output'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
              }`}
            >
              Pajak Keluaran ({outputVatList.length})
            </button>
            <button
              onClick={() => setActiveSubTab('input')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'input'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              Pajak Masukan ({inputVatList.length})
            </button>
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Cari NSFP, no invoice, pelanggan/vendor, NPWP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tipe / NSFP</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Dokumen Sumber</th>
                <th className="py-3 px-4">Lawan Transaksi & NPWP</th>
                <th className="py-3 px-4 text-right">DPP (Rp)</th>
                <th className="py-3 px-4 text-right">PPN 11% (Rp)</th>
                <th className="py-3 px-3 text-center">Kredit</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data transaksi PPN yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((t) => {
                  const isOutput = t.category === 'output_vat';

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => onDrilldown(t)}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge variant={isOutput ? 'info' : 'success'} size="sm">
                            {isOutput ? 'Keluaran' : 'Masukan'}
                          </Badge>
                          <span className="font-mono font-bold text-slate-900">
                            {t.taxInvoiceNumber || 'Belum Terbit NSFP'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {formatIndoDate(t.transactionDate)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-blue-700 hover:underline">
                          {t.sourceDocNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate">{t.partyName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{t.partyNpwp || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                        {formatRupiah(t.dpp)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                          isOutput ? 'text-blue-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatRupiah(t.taxAmount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={t.isCreditable ? 'success' : 'neutral'} size="sm">
                          {t.isCreditable ? 'Dapat Dikreditkan' : 'Non-Kredit'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={
                            t.paymentStatus === 'paid'
                              ? 'success'
                              : t.paymentStatus === 'credited'
                              ? 'info'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {t.paymentStatus === 'paid' ? 'Lunas' : 'Belum Setor'}
                        </Badge>
                      </td>
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onDrilldown(t)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Drill-down Detail"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          {t.sourceId && onViewSourceInvoice && (
                            <button
                              onClick={() => onViewSourceInvoice(t.sourceId!)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Buka Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
