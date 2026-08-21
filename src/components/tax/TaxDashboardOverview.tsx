import React from 'react';
import { TaxPeriodSummary, TaxTransaction, CorporateIncomeTaxSummary } from '../../types/tax';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  Users,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  GitCompare,
  FileCheck2,
  Download,
  History,
  TrendingUp,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Landmark,
} from 'lucide-react';

interface TaxDashboardOverviewProps {
  periodSummary: TaxPeriodSummary;
  citSummary: CorporateIncomeTaxSummary;
  recentTransactions: TaxTransaction[];
  onNavigateTab: (tab: any) => void;
  onOpenNewModal: () => void;
  onOpenWorkflowModal: () => void;
  onOpenConfigModal: () => void;
  onDrilldown: (tx: TaxTransaction) => void;
}

export const TaxDashboardOverview: React.FC<TaxDashboardOverviewProps> = ({
  periodSummary,
  citSummary,
  recentTransactions,
  onNavigateTab,
  onOpenNewModal,
  onOpenWorkflowModal,
  onOpenConfigModal,
  onDrilldown,
}) => {
  return (
    <div className="space-y-6">
      {/* 8 Metric Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Pajak Keluaran */}
        <div
          onClick={() => onNavigateTab('ppn')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Total Pajak Keluaran</span>
            <ArrowUpRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <p className="text-xl font-bold text-blue-600 mt-1 font-mono tracking-tight">
            {formatRupiah(periodSummary.totalOutputVatAmount)}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>DPP: {formatRupiah(periodSummary.totalOutputVatDpp)}</span>
            <span className="text-blue-600 font-semibold">e-Faktur Out →</span>
          </div>
        </div>

        {/* 2. Total Pajak Masukan */}
        <div
          onClick={() => onNavigateTab('ppn')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Total Pajak Masukan</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-1 font-mono tracking-tight">
            {formatRupiah(periodSummary.inputVatCreditableAmount)}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>DPP: {formatRupiah(periodSummary.totalInputVatDpp)}</span>
            <span className="text-emerald-600 font-semibold">e-Faktur In →</span>
          </div>
        </div>

        {/* 3. PPN Kurang/Lebih Bayar */}
        <div
          onClick={() => onNavigateTab('ppn')}
          className={`border rounded-xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer ${
            periodSummary.vatUnderpaid > 0
              ? 'bg-rose-50/40 border-rose-200'
              : 'bg-emerald-50/40 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>PPN Kurang / (Lebih) Bayar</span>
            <Scale className="w-4 h-4 text-slate-700" />
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

        {/* 4. Total PPh Dipotong (Hutang PPh Pot/Put) */}
        <div
          onClick={() => onNavigateTab('pph')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Total PPh Dipotong / Terutang</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {formatRupiah(periodSummary.totalPphWithheld)}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>PPh 21, 23, 4(2)</span>
            <span className="text-slate-700 font-semibold">e-Bupot →</span>
          </div>
        </div>

        {/* 5. Total Kredit Pajak */}
        <div
          onClick={() => onNavigateTab('pph')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Total Kredit Pajak Perusahaan</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-600 mt-1 font-mono tracking-tight">
            {formatRupiah(periodSummary.totalTaxCredits)}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>Bupot 23 + SSP 25</span>
            <span className="text-blue-600 font-semibold">Kredit SPT →</span>
          </div>
        </div>

        {/* 6. Estimasi PPh Badan */}
        <div
          onClick={() => onNavigateTab('pph_badan')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Estimasi PPh Badan (Tahunan)</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-purple-600 mt-1 font-mono tracking-tight">
            {formatRupiah(citSummary.taxPayableFinal)}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>Fasilitas Ps 31E (11%)</span>
            <span className="text-purple-600 font-semibold">Form 1771 →</span>
          </div>
        </div>

        {/* 7. Pajak Sudah Dibayar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Pajak Sudah Dibayar (NTPN)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-1 font-mono tracking-tight">
            {formatRupiah(periodSummary.totalTaxPaid)}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>Terverifikasi Bank/DJP</span>
            <span className="text-emerald-700 font-bold">Lunas</span>
          </div>
        </div>

        {/* 8. Pajak Belum Dibayar */}
        <div
          className={`border rounded-xl p-4 shadow-xs ${
            periodSummary.totalTaxUnpaid > 0
              ? 'bg-amber-50/40 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Pajak Belum Disetor</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-700 mt-1 font-mono tracking-tight">
            {formatRupiah(periodSummary.totalTaxUnpaid)}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60 flex justify-between">
            <span>Perlu dibuat Kode Billing</span>
            <span className="text-amber-800 font-semibold">Pending</span>
          </div>
        </div>
      </div>

      {/* Corporate Tax Health & Visual Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: PPN Flow & Visual Tax Distribution */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Rekapitulasi Arus Perpajakan Masa Pajak: {periodSummary.periodLabel}
              </h3>
              <p className="text-xs text-slate-500">
                Pajak Masukan vs Keluaran, Pemotongan PPh Unifikasi, & Efisiensi Beban Pajak
              </p>
            </div>
            <Badge
              variant={
                periodSummary.status === 'filed'
                  ? 'success'
                  : periodSummary.status === 'ready_to_file'
                  ? 'info'
                  : 'warning'
              }
              size="sm"
            >
              Status: {periodSummary.status.toUpperCase()}
            </Badge>
          </div>

          {/* Visual Progress Bar Distribution */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Rasio PPN Masukan terhadap PPN Keluaran</span>
                <span className="font-mono text-blue-700">
                  {periodSummary.totalOutputVatAmount > 0
                    ? `${Math.round((periodSummary.inputVatCreditableAmount / periodSummary.totalOutputVatAmount) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${Math.min(
                      100,
                      periodSummary.totalOutputVatAmount > 0
                        ? (periodSummary.inputVatCreditableAmount / periodSummary.totalOutputVatAmount) * 100
                        : 0
                    )}%`,
                  }}
                  title="PPN Masukan"
                />
                <div
                  className="bg-rose-400 h-full flex-1"
                  title="PPN Kurang Bayar"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Pajak Masukan ({formatRupiah(periodSummary.inputVatCreditableAmount)})</span>
                <span>PPN Kurang Bayar Disetor ({formatRupiah(periodSummary.vatUnderpaid)})</span>
              </div>
            </div>

            {/* PPh Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">PPh 21 Gaji/Ahli</span>
                <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {formatRupiah(periodSummary.totalPph21Amount)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">PPh 23 Jasa/Sewa</span>
                <p className="text-sm font-bold text-blue-700 font-mono mt-0.5">
                  {formatRupiah(periodSummary.totalPph23Amount)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">PPh 25 Angsuran</span>
                <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                  {formatRupiah(periodSummary.totalPph25Amount)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">PPh Final Ps. 4(2)</span>
                <p className="text-sm font-bold text-purple-700 font-mono mt-0.5">
                  {formatRupiah(periodSummary.totalPphFinalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">Aksi Modul Perpajakan:</span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('ppn')}
                leftIcon={<Scale className="w-4 h-4 text-blue-600" />}
              >
                Submenu PPN
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('pph')}
                leftIcon={<Users className="w-4 h-4 text-purple-600" />}
              >
                Submenu PPh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('pph_badan')}
                leftIcon={<Building2 className="w-4 h-4 text-emerald-600" />}
              >
                PPh Badan (1771)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('reconciliation')}
                leftIcon={<GitCompare className="w-4 h-4 text-amber-600" />}
              >
                Rekonsiliasi GL
              </Button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Tax Compliance Calendar & Workflow Card */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Kalender Kepatuhan Pajak (DJP)
              </h4>
              <Badge variant="neutral" size="sm">
                Agustus 2026
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">Batas Setor PPh 21 / 23 / 4(2)</p>
                  <p className="text-[11px] text-slate-500">Tanggal 10 bulan berikutnya</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                  10 Sep 2026
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">Batas Setor & Lapor SPT Masa PPN</p>
                  <p className="text-[11px] text-slate-500">Akhir bulan berikutnya (Form 1111)</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                  30 Sep 2026
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">Batas Lapor SPT PPh Unifikasi</p>
                  <p className="text-[11px] text-slate-500">Tanggal 20 bulan berikutnya</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                  20 Sep 2026
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-center text-xs font-semibold"
              onClick={onOpenWorkflowModal}
              leftIcon={<FileCheck2 className="w-4 h-4" />}
            >
              Proses Alur Persetujuan & SPT
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center text-xs"
              onClick={onOpenConfigModal}
              leftIcon={<Landmark className="w-4 h-4" />}
            >
              Aturan & Tarif Pajak
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Tax Activity List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Transaksi Perpajakan Terakhir
            </h3>
            <p className="text-xs text-slate-500">
              Faktur Pajak e-Faktur dan Bukti Potong e-Bupot terbit terbaru
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('ppn')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Lihat Semua Transaksi <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Jenis</th>
                <th className="py-2.5 px-3">No. Faktur / Bupot</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Lawan Transaksi</th>
                <th className="py-2.5 px-3 text-right">DPP (Rp)</th>
                <th className="py-2.5 px-3 text-right">Pajak (Rp)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.slice(0, 5).map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/70 cursor-pointer"
                  onClick={() => onDrilldown(t)}
                >
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <Badge
                      variant={
                        t.taxType === 'PPN'
                          ? 'info'
                          : t.taxType === 'PPh23'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {t.taxType}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {t.taxInvoiceNumber || t.withholdingSlipNumber || t.sourceDocNumber}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {formatIndoDate(t.transactionDate)}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs truncate">
                    {t.partyName}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {formatRupiah(t.dpp)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                    {formatRupiah(t.taxAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge variant={t.paymentStatus === 'paid' ? 'success' : 'warning'} size="sm">
                      {t.paymentStatus === 'paid' ? 'Lunas' : 'Belum Setor'}
                    </Badge>
                  </td>
                  <td
                    className="py-2.5 px-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onDrilldown(t)}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
