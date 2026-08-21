import React, { useState } from 'react';
import { TaxReconciliationItem } from '../../types/tax';
import { formatRupiah } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface TaxReconciliationViewProps {
  reconciliations: TaxReconciliationItem[];
  year: number;
  month: number;
  onViewSourceInvoice?: (invoiceId: string) => void;
}

export const TaxReconciliationView: React.FC<TaxReconciliationViewProps> = ({
  reconciliations,
  year,
  month,
  onViewSourceInvoice,
}) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(reconciliations[0]?.id || null);

  const matchedCount = reconciliations.filter((r) => r.status === 'match').length;
  const reviewCount = reconciliations.filter((r) => r.status === 'review').length;
  const discrepancyCount = reconciliations.filter((r) => r.status === 'discrepancy').length;

  const toggleExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Rekonsiliasi Sesuai (100% Match)</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono">{matchedCount}</p>
          <p className="text-[11px] text-emerald-600 mt-1">
            Data GL Akuntansi dan e-Faktur/e-Bupot telah sinkron sempurna
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Perlu Diperiksa (Review)</span>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">{reviewCount}</p>
          <p className="text-[11px] text-amber-600 mt-1">
            Terdapat selisih wajar/pembulatan atau faktur dalam proses
          </p>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Selisih Tidak Cocok (Discrepancy)</span>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-1 font-mono">{discrepancyCount}</p>
          <p className="text-[11px] text-rose-600 mt-1">
            Membutuhkan penyesuaian jurnal penyesuaian atau faktur pengganti
          </p>
        </div>
      </div>

      {/* Main Reconciliation Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-blue-600" />
              Matriks Rekonsiliasi GL Akuntansi vs SPT Pajak
            </h3>
            <p className="text-xs text-slate-500">
              Pemeriksaan silang otomatis antara Buku Besar (General Ledger) dengan Surat Pemberitahuan (SPT)
            </p>
          </div>
          <Badge variant="info" size="sm">
            Masa {month} / {year}
          </Badge>
        </div>

        <div className="divide-y divide-slate-200">
          {reconciliations.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const isMatch = item.status === 'match';
            const isReview = item.status === 'review';

            return (
              <div key={item.id} className="transition-colors">
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 ${
                    isExpanded ? 'bg-blue-50/20' : ''
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {isMatch ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sesuai
                        </span>
                      ) : isReview ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" /> Perlu Diperiksa
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Selisih
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{item.reasonExplanation}</p>
                  </div>

                  {/* Amounts Side-by-Side */}
                  <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-sans">Buku Besar (GL)</span>
                      <span className="font-bold text-slate-900">{formatRupiah(item.systemGlAmount)}</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400" />

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-sans">Laporan Pajak (SPT)</span>
                      <span className="font-bold text-blue-700">{formatRupiah(item.taxReportAmount)}</span>
                    </div>

                    <div className="text-right pl-3 border-l border-slate-200 min-w-[100px]">
                      <span className="text-[10px] text-slate-400 block font-sans">Selisih (Variance)</span>
                      <span
                        className={`font-bold ${
                          item.variance === 0
                            ? 'text-emerald-600'
                            : item.variance < 50000
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {formatRupiah(item.variance)}
                      </span>
                    </div>

                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Drilldown Sub-Panel */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/60 border-t border-slate-200/70 space-y-3 text-xs animate-in fade-in duration-150">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                        Analisis Penyebab & Validasi Auditor
                      </p>
                      <p className="text-slate-700 leading-relaxed">{item.reasonExplanation}</p>

                      {item.causingDocIds && item.causingDocIds.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Dokumen Terkait ({item.causingDocIds.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.causingDocIds.map((docNum) => (
                              <span
                                key={docNum}
                                className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[10px] font-semibold rounded-md border border-slate-200"
                              >
                                {docNum}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Breakdown table if available */}
                    {item.docDetails && item.docDetails.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">No. Dokumen</th>
                              <th className="py-2.5 px-3">Tanggal</th>
                              <th className="py-2.5 px-3">Pihak Terkait</th>
                              <th className="py-2.5 px-3 text-right">Nilai Transaksi (Rp)</th>
                              <th className="py-2.5 px-3">Status Sinkronisasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {item.docDetails.map((doc, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                                  {doc.docNumber}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">{doc.date}</td>
                                <td className="py-2.5 px-3 text-slate-900 font-medium">{doc.party}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold">
                                  {formatRupiah(doc.amount)}
                                </td>
                                <td className="py-2.5 px-3 text-emerald-700 font-medium text-[11px]">
                                  {doc.issue || 'Sinkron dengan e-Faktur & GL'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
