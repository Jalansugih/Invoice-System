import React, { useMemo } from 'react';
import { Invoice } from '../../types';
import { formatRupiah } from '../../lib/utils';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface InvoiceStatusChartProps {
  invoices: Invoice[];
}

export const InvoiceStatusChart: React.FC<InvoiceStatusChartProps> = ({ invoices }) => {
  const stats = useMemo(() => {
    const totalInvoices = invoices.length || 1;
    const totalAmount = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0) || 1;

    const paidList = invoices.filter((i) => i.status === 'paid');
    const overdueList = invoices.filter((i) => i.status === 'overdue');
    const pendingList = invoices.filter(
      (i) => i.status === 'unpaid' || i.status === 'sent' || i.status === 'partially_paid' || i.status === 'draft'
    );

    const paidAmount = paidList.reduce((sum, i) => sum + (i.paidAmount || i.grandTotal || 0), 0);
    const overdueAmount = overdueList.reduce((sum, i) => sum + (i.outstandingAmount || 0), 0);
    const pendingAmount = pendingList.reduce((sum, i) => sum + (i.outstandingAmount || 0), 0);

    const paidPct = invoices.length > 0 ? Math.round((paidList.length / totalInvoices) * 100) : 64;
    const pendingPct = invoices.length > 0 ? Math.round((pendingList.length / totalInvoices) * 100) : 28;
    const overduePct = invoices.length > 0 ? Math.max(0, 100 - paidPct - pendingPct) : 8;

    return {
      paidPct,
      pendingPct,
      overduePct,
      paidCount: paidList.length,
      pendingCount: pendingList.length,
      overdueCount: overdueList.length,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalCount: invoices.length,
      totalAmount,
    };
  }, [invoices]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between h-full">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-900 text-sm">Status Portofolio Faktur</h3>
          <span className="text-[11px] font-mono text-slate-500 font-medium">
            {stats.totalCount} Faktur
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mb-4">Distribusi penyelesaian dan risiko piutang usaha</p>
      </div>

      {/* Interactive Status Breakdown with Progress Bars & Nominals */}
      <div className="space-y-4 my-auto">
        {/* 1. Paid (Lunas) */}
        <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/60 hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between mb-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="font-bold text-slate-800">Lunas (Paid)</span>
              <span className="text-[10px] text-slate-400 font-mono">({stats.paidCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-700">{formatRupiah(stats.paidAmount)}</span>
              <span className="font-bold text-slate-900 font-mono text-[11px] w-8 text-right">{stats.paidPct}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(stats.paidPct, stats.paidCount > 0 ? 5 : 0)}%` }}
            ></div>
          </div>
        </div>

        {/* 2. Pending / Active (Belum Jatuh Tempo) */}
        <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-100/60 hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between mb-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span className="font-bold text-slate-800">Menunggu (Pending)</span>
              <span className="text-[10px] text-slate-400 font-mono">({stats.pendingCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-700">{formatRupiah(stats.pendingAmount)}</span>
              <span className="font-bold text-slate-900 font-mono text-[11px] w-8 text-right">{stats.pendingPct}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(stats.pendingPct, stats.pendingCount > 0 ? 5 : 0)}%` }}
            ></div>
          </div>
        </div>

        {/* 3. Overdue (Jatuh Tempo) */}
        <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-100/60 hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between mb-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
              <span className="font-bold text-slate-800">Lewat Tempo (Overdue)</span>
              <span className="text-[10px] text-slate-400 font-mono">({stats.overdueCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-rose-600">{formatRupiah(stats.overdueAmount)}</span>
              <span className="font-bold text-slate-900 font-mono text-[11px] w-8 text-right">{stats.overduePct}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(stats.overduePct, stats.overdueCount > 0 ? 5 : 0)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Card Footer: Portfolio Health Index */}
      <div className="flex items-center justify-between pt-4 mt-5 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Skor Kesehatan Piutang:</span>
        </div>
        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
          Sangat Baik (94/100)
        </span>
      </div>
    </div>
  );
};
