import React from 'react';
import {
  TaxPeriodSummary,
  TaxTransaction,
  CorporateIncomeTaxSummary,
  IncomeStatementData,
  BalanceSheetData,
  AuditInspectionSummary,
  CoretaxProgressSummary,
} from '../../types/tax';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  TrendingUp,
  Scale,
  Users,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  GitCompare,
  FileCheck2,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Landmark,
  FileText,
  DollarSign,
  Activity,
  Coins,
} from 'lucide-react';

interface TaxDashboardOverviewProps {
  periodSummary: TaxPeriodSummary;
  citSummary: CorporateIncomeTaxSummary;
  recentTransactions: TaxTransaction[];
  incomeStatement: IncomeStatementData;
  balanceSheet: BalanceSheetData;
  inspectionSummary: AuditInspectionSummary;
  coretaxProgress: CoretaxProgressSummary;
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
  incomeStatement: is,
  balanceSheet: bs,
  inspectionSummary,
  coretaxProgress,
  onNavigateTab,
  onOpenNewModal,
  onOpenWorkflowModal,
  onOpenConfigModal,
  onDrilldown,
}) => {
  const getStatusBadge = (statusOrBlock?: 'ready' | 'needs_review' | 'incomplete' | 'warning' | 'error' | { status: any } | string) => {
    let s: string = 'needs_review';
    if (typeof statusOrBlock === 'string') {
      s = statusOrBlock;
    } else if (statusOrBlock && typeof statusOrBlock === 'object' && 'status' in statusOrBlock) {
      s = statusOrBlock.status;
    }
    if (s === 'ready' || s === 'passed') {
      return (
        <Badge variant="success" size="sm" className="gap-1 font-semibold">
          <CheckCircle2 className="w-3 h-3" />
          Siap diperiksa
        </Badge>
      );
    }
    if (s === 'needs_review' || s === 'warning') {
      return (
        <Badge variant="warning" size="sm" className="gap-1 font-semibold">
          <AlertTriangle className="w-3 h-3" />
          Perlu verifikasi
        </Badge>
      );
    }
    return (
      <Badge variant="danger" size="sm" className="gap-1 font-semibold">
        <XCircle className="w-3 h-3" />
        Belum siap dilaporkan
      </Badge>
    );
  };

  const pendingAuditItems = inspectionSummary.items.filter((item) => item.status !== 'passed');

  return (
    <div className="space-y-6">
      {/* 1. Status Kesiapan Keseluruhan (Indikator Coretax Utama) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl text-white shadow-xs ${
                coretaxProgress.overallStatus === 'ready'
                  ? 'bg-emerald-600'
                  : coretaxProgress.overallStatus === 'needs_review'
                  ? 'bg-amber-600'
                  : 'bg-rose-600'
              }`}
            >
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Status Kesiapan Pelaporan SPT & Coretax
                </h2>
                {getStatusBadge(coretaxProgress.overallStatus)}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Pengusaha cukup mencatat transaksi dengan benar, sistem membantu menyiapkan laporan keuangan dan menunjukkan apa saja yang masih perlu dilengkapi sebelum pelaporan pajak.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="sm:text-right pr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Skor Kesiapan SPT
              </span>
              <span className="text-2xl font-black font-mono text-slate-900">
                {coretaxProgress.readinessPercentage}%
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('coretax_prep')}
              className="gap-1.5 text-xs whitespace-nowrap justify-center"
            >
              <span>Buka Persiapan Coretax</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* 4 Pilar Kepatuhan Status */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div
            onClick={() => onNavigateTab('financial_statements')}
            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 cursor-pointer transition-all"
          >
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>1. Pembukuan Otomatis</span>
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              {getStatusBadge(coretaxProgress.blocks.bookkeeping)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">5 Laporan Keuangan</span>
          </div>

          <div
            onClick={() => onNavigateTab('fiscal_reconciliation')}
            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 cursor-pointer transition-all"
          >
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>2. Rekonsiliasi Fiskal</span>
              <GitCompare className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              {getStatusBadge(coretaxProgress.blocks.reconciliation)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Koreksi Positif & Negatif</span>
          </div>

          <div
            onClick={() => onNavigateTab('preflight_audit')}
            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 cursor-pointer transition-all"
          >
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>3. Pemeriksaan Data</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              {getStatusBadge(coretaxProgress.blocks.auditChecks)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">10 Validasi Otomatis</span>
          </div>

          <div
            onClick={() => onNavigateTab('coretax_prep')}
            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 cursor-pointer transition-all"
          >
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>4. Persiapan Coretax</span>
              <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              {getStatusBadge(coretaxProgress.blocks.coretaxReady)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Lampiran I-VI & Induk</span>
          </div>
        </div>
      </div>

      {/* 2. 8 Ringkasan Keuangan & Pajak Utama */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Ringkasan Keuangan & Beban Pajak Terintegrasi
          </h3>
          <button
            onClick={() => onNavigateTab('financial_statements')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Buka Laporan Keuangan Lengkap <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Penjualan Bersih */}
          <div
            onClick={() => onNavigateTab('financial_statements')}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>1. Pendapatan Bersih</span>
              <TrendingUp className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono tracking-tight">
              {formatRupiah(is.netSales)}
            </p>
            <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between">
              <span>Bruto: {formatRupiah(is.grossSales)}</span>
              <span className="text-blue-600 font-medium">Laba Rugi →</span>
            </div>
          </div>

          {/* Card 2: HPP & Laba Kotor */}
          <div
            onClick={() => onNavigateTab('financial_statements')}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>2. Laba Kotor (Gross Profit)</span>
              <Scale className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-lg font-bold text-emerald-600 mt-1 font-mono tracking-tight">
              {formatRupiah(is.grossProfit)}
            </p>
            <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between">
              <span>HPP: {formatRupiah(is.cogs)}</span>
              <span className="text-emerald-700 font-medium">Margin {is.netSales > 0 ? Math.round((is.grossProfit / is.netSales) * 100) : 0}%</span>
            </div>
          </div>

          {/* Card 3: Total Beban Usaha */}
          <div
            onClick={() => onNavigateTab('financial_statements')}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>3. Beban Operasional</span>
              <DollarSign className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono tracking-tight">
              {formatRupiah(is.totalOperatingExpenses)}
            </p>
            <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between">
              <span>Gaji, Sewa, Operasi</span>
              <span className="text-slate-600 font-medium">11 Pos Akun</span>
            </div>
          </div>

          {/* Card 4: Laba Bersih Komersial */}
          <div
            onClick={() => onNavigateTab('financial_statements')}
            className="bg-white border border-blue-200 bg-blue-50/20 rounded-xl p-4 shadow-xs hover:border-blue-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-900">
              <span>4. Laba Sebelum Pajak</span>
              <Coins className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-lg font-bold text-blue-700 mt-1 font-mono tracking-tight">
              {formatRupiah(is.netProfitBeforeTax)}
            </p>
            <div className="text-[11px] text-blue-800 mt-1.5 pt-1.5 border-t border-blue-100 flex justify-between">
              <span>Laba Komersial</span>
              <span className="font-semibold">Dasar Koreksi →</span>
            </div>
          </div>

          {/* Card 5: Total Aset */}
          <div
            onClick={() => onNavigateTab('financial_statements')}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>5. Total Aset Perusahaan</span>
              <Building2 className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono tracking-tight">
              {formatRupiah(bs.totalAssets)}
            </p>
            <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between">
              <span>Kas & Bank: {formatRupiah(bs.cashOnPremises + bs.bankBalances)}</span>
              <span className="text-slate-600 font-medium">Neraca →</span>
            </div>
          </div>

          {/* Card 6: Total Liabilitas */}
          <div
            onClick={() => onNavigateTab('financial_statements')}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>6. Total Liabilitas (Utang)</span>
              <Users className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono tracking-tight">
              {formatRupiah(bs.totalLiabilities)}
            </p>
            <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between">
              <span>Utang Usaha & Pajak</span>
              <span className="text-slate-600 font-medium">Pasiva →</span>
            </div>
          </div>

          {/* Card 7: Total Ekuitas */}
          <div
            onClick={() => onNavigateTab('financial_statements')}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>7. Total Ekuitas Bersih</span>
              <Layers className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono tracking-tight">
              {formatRupiah(bs.totalEquity)}
            </p>
            <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex justify-between">
              <span>Modal: {formatRupiah(bs.paidInCapital)}</span>
              <span className="text-slate-600 font-medium">Ekuitas →</span>
            </div>
          </div>

          {/* Card 8: PPh Badan Terutang */}
          <div
            onClick={() => onNavigateTab('fiscal_reconciliation')}
            className="bg-white border border-purple-200 bg-purple-50/20 rounded-xl p-4 shadow-xs hover:border-purple-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-purple-900">
              <span>8. Estimasi PPh Badan (1771)</span>
              <Building2 className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-lg font-bold text-purple-700 mt-1 font-mono tracking-tight">
              {formatRupiah(citSummary.taxPayableFinal)}
            </p>
            <div className="text-[11px] text-purple-800 mt-1.5 pt-1.5 border-t border-purple-100 flex justify-between">
              <span>Fasilitas Ps 31E (11%)</span>
              <span className="font-semibold">SPT 1771 →</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Kartu Pintar: "Apa yang Harus Saya Perbaiki Sebelum Lapor Pajak?" */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Apa yang Harus Saya Perbaiki Sebelum Pelaporan Pajak?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Temuan otomatis hasil audit pre-flight terhadap buku besar, rekonsiliasi PPN/PPh, aset, dan kredit pajak
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateTab('preflight_audit')}
            className="text-xs gap-1 self-start sm:self-center"
          >
            <span>Buka Semua Pemeriksaan ({inspectionSummary.totalChecks})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {pendingAuditItems.length > 0 ? (
          <div className="space-y-3">
            {pendingAuditItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.status === 'error'
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === 'error' ? 'danger' : 'warning'} size="sm">
                      {item.categoryLabel}
                    </Badge>
                    <span className="font-bold text-xs text-slate-900">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-600">{item.description}</p>
                  <p className="text-[11px] font-medium text-slate-700">
                    💡 Rekomendasi: {item.fixGuide}
                  </p>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant={item.status === 'error' ? 'danger' : 'outline'}
                    onClick={() => onNavigateTab(item.actionTab)}
                    className="text-xs gap-1"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Semua 10 modul pemeriksaan lolos validasi otomatis!</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Data keuangan, rekonsiliasi, dan kredit pajak Anda telah sinkron dan siap diekspor ke Coretax.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Alur Pelaporan SPT Tahunan Badan & Coretax */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Alur Standar Pembukuan & Pelaporan SPT Tahunan Badan
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
              1
            </span>
            <div className="font-bold text-slate-800">Catat Transaksi</div>
            <p className="text-[11px] text-slate-500">Invoice penjualan, biaya operasional & aset</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
              2
            </span>
            <div className="font-bold text-slate-800">Pembukuan Otomatis</div>
            <p className="text-[11px] text-slate-500">Jurnal akuntansi & buku besar terbuat otomatis</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
              3
            </span>
            <div className="font-bold text-slate-800">Laporan Keuangan</div>
            <p className="text-[11px] text-slate-500">Laba Rugi, Neraca, Ekuitas, Arus Kas & CaLK</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
              4
            </span>
            <div className="font-bold text-slate-800">Rekonsiliasi Fiskal</div>
            <p className="text-[11px] text-slate-500">Penyesuaian koreksi positif/negatif & penyusutan</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
              5
            </span>
            <div className="font-bold text-slate-800">Pemeriksaan Data</div>
            <p className="text-[11px] text-slate-500">Audit kelengkapan dokumen & kredit pajak</p>
          </div>

          <div className="bg-blue-600 text-white p-3 rounded-xl border border-blue-700 space-y-1 shadow-xs">
            <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-[10px]">
              6
            </span>
            <div className="font-bold">Siap Lapor Coretax</div>
            <p className="text-[11px] text-blue-100">Ekspor berkas SPT 1771 & kit pelaporan</p>
          </div>
        </div>
      </div>

      {/* 5. Transaksi Perpajakan Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
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
                          : t.taxType === 'PPh23' || t.taxType === 'PPh22'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {t.taxType}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {t.taxInvoiceNumber || t.withholdingSlipNumber || t.sourceDocNumber || 'DRAFT-TX'}
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
                      {t.paymentStatus === 'paid' ? 'Lunas / Approved' : 'Draf / Pending'}
                    </Badge>
                  </td>
                  <td
                    className="py-2.5 px-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onDrilldown(t)}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      title="Lihat Detail Transaksi"
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

