import React from 'react';
import { Invoice } from '../../types';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import { FileText, ArrowRight, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface RecentInvoicesTableProps {
  invoices: Invoice[];
  onViewInvoice: (id: string) => void;
  onRecordPayment?: (invoice: Invoice) => void;
  onCreateLetter?: (invoice: Invoice) => void;
  onViewAll: () => void;
}

export const RecentInvoicesTable: React.FC<RecentInvoicesTableProps> = ({
  invoices,
  onViewInvoice,
  onViewAll,
}) => {
  const recentList = invoices.slice(0, 6);

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wide">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Lunas
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold uppercase tracking-wide">
            <AlertCircle className="w-2.5 h-2.5" />
            Jatuh Tempo
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold uppercase tracking-wide">
            Sebagian
          </span>
        );
      case 'unpaid':
      case 'sent':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-wide">
            Menunggu
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between h-full">
      {/* Table Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Faktur Terbaru</h3>
            <p className="text-[11px] text-slate-400">Daftar transaksi dan status penagihan terkini</p>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold hover:underline transition-all cursor-pointer"
        >
          <span>Lihat Semua ({invoices.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto grow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50/20 tracking-wider">
              <th className="px-5 sm:px-6 py-3">No. Faktur</th>
              <th className="px-4 py-3">Pelanggan</th>
              <th className="px-4 py-3">Jatuh Tempo</th>
              <th className="px-4 py-3 text-right">Total Tagihan</th>
              <th className="px-5 sm:px-6 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {recentList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs">
                  Belum ada faktur yang dibuat.
                </td>
              </tr>
            ) : (
              recentList.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => onViewInvoice(inv.id)}
                  className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                >
                  <td className="px-5 sm:px-6 py-3 font-medium text-blue-600 font-mono text-xs tabular-nums group-hover:underline">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <p className="truncate max-w-[180px] sm:max-w-[220px] text-xs font-semibold text-slate-800">
                      {inv.customerName}
                    </p>
                    {inv.poNumber && (
                      <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                        PO: {inv.poNumber}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs tabular-nums whitespace-nowrap">
                    {formatIndoDate(inv.dueDate || inv.issueDate)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 text-xs text-right font-mono tabular-nums whitespace-nowrap">
                    {formatRupiah(inv.grandTotal)}
                  </td>
                  <td className="px-5 sm:px-6 py-3 text-right whitespace-nowrap">
                    {getStatusBadge(inv.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between text-xs text-slate-400">
        <span>Menampilkan {recentList.length} dari {invoices.length} faktur</span>
        <button
          onClick={onViewAll}
          className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Buka Manajemen Faktur</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
