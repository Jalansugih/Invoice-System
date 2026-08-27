import React, { useState } from 'react';
import { AuditInspectionSummary, AuditCheckItem, AuditCheckCategory } from '../../types/tax';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatRupiah } from '../../lib/utils';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Filter,
  Check,
  Search,
  Sparkles,
  ExternalLink,
  Layers,
  Scale,
  FileCheck2,
} from 'lucide-react';

interface TaxPreflightAuditViewProps {
  inspectionSummary?: AuditInspectionSummary;
  summary?: AuditInspectionSummary;
  year?: number;
  onRefresh?: () => void;
  onNavigateTab?: (tabKey: any) => void;
}

export const TaxPreflightAuditView: React.FC<TaxPreflightAuditViewProps> = ({
  inspectionSummary,
  summary,
  year = 2026,
  onRefresh,
  onNavigateTab,
}) => {
  const actualSummary = summary || inspectionSummary || {
    totalChecks: 0,
    passedChecks: 0,
    warningChecks: 0,
    errorChecks: 0,
    readinessScore: 100,
    overallStatus: 'ready',
    items: [],
  };
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = (actualSummary.items || []).filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: AuditCheckItem['status']) => {
    switch (status) {
      case 'passed':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Lolos Pemeriksaan
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="warning" size="sm" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            Perlu Verifikasi
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="danger" size="sm" className="gap-1">
            <XCircle className="w-3 h-3" />
            Belum Lengkap / Error
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Executive Health Check */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-xl text-white ${
                actualSummary.overallStatus === 'ready'
                  ? 'bg-emerald-600'
                  : actualSummary.overallStatus === 'needs_review'
                  ? 'bg-amber-600'
                  : 'bg-rose-600'
              }`}
            >
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Pusat Pemeriksaan & Validasi Laporan Pajak
                </h3>
                <Badge
                  variant={
                    actualSummary.overallStatus === 'ready'
                      ? 'success'
                      : actualSummary.overallStatus === 'needs_review'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {actualSummary.overallStatus === 'ready'
                    ? 'Siap diperiksa'
                    : actualSummary.overallStatus === 'needs_review'
                    ? 'Perlu verifikasi'
                    : 'Belum siap dilaporkan'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Sistem secara otomatis mengaudit 10 parameter kepatuhan pembukuan, rekonsiliasi PPN/PPh, aset, dan kesiapan Coretax tahun {year}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Skor Kesiapan Data
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {actualSummary.readinessScore}%
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={onRefresh} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Audit Ulang
            </Button>
          </div>
        </div>

        {/* 4 Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Validasi</span>
            <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">{actualSummary.totalChecks} Aturan</p>
          </div>
          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Lolos Audit</span>
            <p className="text-xl font-bold text-emerald-700 font-mono mt-0.5">{actualSummary.passedChecks} Lolos</p>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Perlu Verifikasi</span>
            <p className="text-xl font-bold text-amber-700 font-mono mt-0.5">{actualSummary.warningChecks} Temuan</p>
          </div>
          <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Error / Belum Lengkap</span>
            <p className="text-xl font-bold text-rose-700 font-mono mt-0.5">{actualSummary.errorChecks} Isu Kritis</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter status audit"
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status Audit</option>
            <option value="error">Hanya Isu Kritis (Error)</option>
            <option value="warning">Hanya Perlu Verifikasi</option>
            <option value="passed">Hanya yang Lolos</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="Filter kategori pemeriksaan"
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kategori Pemeriksaan</option>
            <option value="accounting_structure">Struktur Akuntansi & Neraca</option>
            <option value="sales">Penjualan & Faktur Keluaran</option>
            <option value="purchases">Pembelian & Faktur Masukan</option>
            <option value="inventory">Persediaan & HPP</option>
            <option value="receivables">Piutang Usaha</option>
            <option value="assets_depreciation">Aset & Penyusutan Fiskal</option>
            <option value="tax_credits">Kredit Pajak PPh 22/23/25</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pemeriksaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Checklist Audit Cards List */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            className={`bg-white border rounded-xl p-4 sm:p-5 transition-all shadow-xs ${
              item.status === 'error'
                ? 'border-rose-200 hover:border-rose-300'
                : item.status === 'warning'
                ? 'border-amber-200 hover:border-amber-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">#{index + 1}</span>
                  <Badge variant="neutral" size="sm">
                    {item.categoryLabel}
                  </Badge>
                  {getStatusBadge(item.status)}
                </div>

                <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-600">{item.description}</p>

                {/* Fix Guide Message */}
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                  <span className="font-semibold text-slate-700">Rekomendasi:</span>
                  <span>{item.fixGuide}</span>
                </div>

                {/* Sample error records if any */}
                {item.sampleItems && item.sampleItems.length > 0 && (
                  <div className="mt-3 p-3 bg-rose-50/60 rounded-lg border border-rose-100 text-xs">
                    <div className="font-bold text-rose-900 mb-1.5">
                      Daftar Dokumen / Transaksi Terkait ({item.sampleItems.length} item):
                    </div>
                    <div className="space-y-1.5">
                      {item.sampleItems.map((sample) => (
                        <div
                          key={sample.id}
                          className="flex justify-between items-center bg-white p-2 rounded border border-rose-200/60"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-rose-800">{sample.code}</span>
                            <span className="text-slate-700">{sample.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {sample.amount && (
                              <span className="font-mono font-semibold text-slate-900">
                                {formatRupiah(sample.amount)}
                              </span>
                            )}
                            <span className="text-rose-600 italic">({sample.issue})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center self-end md:self-center">
                {item.status !== 'passed' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigateTab(item.actionTab)}
                    className="gap-1.5 text-xs whitespace-nowrap"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold px-3 py-1.5 bg-emerald-50 rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                    Sudah Sesuai
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6 text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800">Tidak ada pemeriksaan yang sesuai filter</h4>
            <p className="text-xs text-slate-500 mt-1">Coba ubah status atau kata kunci pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
};
