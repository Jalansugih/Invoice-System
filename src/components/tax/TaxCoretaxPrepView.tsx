import React, { useState } from 'react';
import {
  CoretaxProgressSummary,
  CorporateIncomeTaxSummary,
  IncomeStatementData,
  BalanceSheetData,
} from '../../types/tax';
import { formatRupiah, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  FileCheck2,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Building,
  Send,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  FileCode,
  Archive,
  Layers,
  Check,
} from 'lucide-react';

interface TaxCoretaxPrepViewProps {
  progress: CoretaxProgressSummary;
  taxReturn?: any;
  citSummary?: CorporateIncomeTaxSummary;
  incomeStatement?: IncomeStatementData;
  balanceSheet?: BalanceSheetData;
  year: number;
  onNavigateTab: (tabKey: any) => void;
}

export const TaxCoretaxPrepView: React.FC<TaxCoretaxPrepViewProps> = ({
  progress,
  taxReturn,
  citSummary,
  incomeStatement,
  balanceSheet,
  year,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'schedules' | 'export_kit'>('checklist');

  const getStatusBadge = (status: 'ready' | 'needs_review' | 'incomplete') => {
    switch (status) {
      case 'ready':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Siap Diperiksa
          </Badge>
        );
      case 'needs_review':
        return (
          <Badge variant="warning" size="sm" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            Perlu Verifikasi
          </Badge>
        );
      case 'incomplete':
        return (
          <Badge variant="danger" size="sm" className="gap-1">
            <XCircle className="w-3 h-3" />
            Belum Siap Dilaporkan
          </Badge>
        );
    }
  };

  const handleExportCoretaxJSON = () => {
    const payload = {
      version: '1.0.0-coretax-compatible',
      taxYear: year,
      company: {
        npwp: '01.234.567.8-012.000',
        name: 'PT Digital Solusi Nusantara',
      },
      spt1771Induk: {
        commercialRevenue: taxReturn.grossRevenueCommercial,
        netProfitCommercial: taxReturn.netProfitCommercial,
        positiveCorrections: taxReturn.positiveCorrections,
        negativeCorrections: taxReturn.negativeCorrections,
        netFiscalProfit: taxReturn.netFiscalProfit,
        taxableIncome: taxReturn.taxableIncome,
        calculatedTax: taxReturn.calculatedTax,
        taxCreditsTotal: taxReturn.taxCreditsTotal,
        underpaidTax29: taxReturn.underpaidTax29,
      },
      schedules: progress.scheduleStatus,
      checklist: progress.checklist,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Coretax_SPT1771_PrepKit_${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSchedulesCSV = () => {
    const data = progress.scheduleStatus.map((s) => ({
      'Formulir SPT 1771': s.formCode,
      'Judul Lampiran': s.title,
      'Nominal Terkait (Rp)': s.amount,
      'Jumlah Data': s.itemCount,
      'Status Kesiapan': s.isComplete ? 'Lengkap / Siap' : 'Perlu Dilengkapi',
    }));
    exportToCSV(`Pemetaan_Lampiran_SPT1771_Coretax_${year}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header Executive Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-xl text-white ${
                progress.overallStatus === 'ready'
                  ? 'bg-emerald-600'
                  : progress.overallStatus === 'needs_review'
                  ? 'bg-amber-600'
                  : 'bg-rose-600'
              }`}
            >
              <FileCheck2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Pusat Persiapan Pelaporan SPT Tahunan Badan & Coretax
                </h3>
                {getStatusBadge(progress.overallStatus)}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Format standardisasi data pembukuan, rekonsiliasi fiskal, kredit pajak, dan lampiran khusus untuk persiapan pengisian Coretax DJP Tahun Pajak {year}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Kesiapan Dokumen
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {progress.readinessPercentage}%
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCoretaxJSON}
              className="gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Paket Coretax
            </Button>
          </div>
        </div>

        {/* 4 Block Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Pembukuan Otomatis</span>
            <div className="mt-1">
              <Badge variant={progress.blocks.bookkeeping === 'ready' ? 'success' : 'warning'} size="sm">
                {progress.blocks.bookkeeping === 'ready' ? 'Siap diperiksa' : 'Perlu verifikasi'}
              </Badge>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">2. Rekonsiliasi Fiskal</span>
            <div className="mt-1">
              <Badge variant={progress.blocks.reconciliation === 'ready' ? 'success' : 'warning'} size="sm">
                {progress.blocks.reconciliation === 'ready' ? 'Siap diperiksa' : 'Perlu verifikasi'}
              </Badge>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">3. Pemeriksaan Data</span>
            <div className="mt-1">
              <Badge variant={progress.blocks.auditChecks === 'ready' ? 'success' : 'warning'} size="sm">
                {progress.blocks.auditChecks === 'ready' ? 'Siap diperiksa' : 'Perlu verifikasi'}
              </Badge>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">4. Siap Dilaporkan</span>
            <div className="mt-1">
              <Badge variant={progress.blocks.coretaxReady === 'ready' ? 'success' : 'danger'} size="sm">
                {progress.blocks.coretaxReady === 'ready' ? 'Siap diperiksa' : 'Belum siap dilaporkan'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Sub-Navigation */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            1. Checklist Kesiapan SPT (6 Modul)
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'schedules'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2. Pemetaan Lampiran SPT 1771 (I s/d VI)
          </button>
          <button
            onClick={() => setActiveTab('export_kit')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'export_kit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            3. Paket Unduhan Pelaporan (Export Kit)
          </button>
        </div>
      </div>

      {/* TAB 1: CHECKLIST KESIAPAN SPT */}
      {activeTab === 'checklist' && (
        <div className="space-y-3">
          {progress.checklist.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-xl p-4 sm:p-5 transition-all shadow-xs ${
                item.status === 'ready'
                  ? 'border-slate-200'
                  : item.status === 'needs_review'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-400">Tahap {item.id}</span>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateTab(item.actionTab)}
                    className="gap-1 text-xs"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: PEMETAAN LAMPIRAN SPT 1771 */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Daftar Formulir Induk & Lampiran SPT 1771 Coretax
                </h4>
                <p className="text-xs text-slate-500">
                  Data otomatis terhubung dengan buku besar dan rekonsiliasi
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportSchedulesCSV} className="text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Ekspor Pemetaan CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Formulir</th>
                    <th className="py-3 px-3">Judul Lampiran</th>
                    <th className="py-3 px-3 text-right">Nominal Terkait</th>
                    <th className="py-3 px-3 text-center">Jumlah Item</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {progress.scheduleStatus.map((schedule) => (
                    <tr key={schedule.formCode} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {schedule.formCode}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {schedule.title}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {schedule.amount !== undefined ? formatRupiah(schedule.amount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {schedule.itemCount} Baris
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={schedule.isComplete ? 'success' : 'warning'} size="sm">
                          {schedule.isComplete ? 'Siap diperiksa' : 'Perlu Verifikasi'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAKET UNDUHAN PELAPORAN */}
      {activeTab === 'export_kit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg w-fit">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Buku Besar & Jurnal Transaksi (Excel/CSV)</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Seluruh rekapitulasi mutasi kas, penjualan, pembelian, piutang, dan utang untuk arsip pemeriksaan pajak (SP2DK).
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSchedulesCSV}
              className="gap-1.5 text-xs w-full justify-center"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Rekapitulasi Pembukuan
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg w-fit">
              <FileCode className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Dataset JSON Kompatibel Coretax DJP</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Struktur data terstandardisasi SPT 1771 Induk, Lampiran I-VI, dan daftar penyusutan fiskal untuk integrasi pelaporan online.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCoretaxJSON}
              className="gap-1.5 text-xs w-full justify-center"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Data Coretax JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
