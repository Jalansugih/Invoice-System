import React from 'react';
import { TaxTransaction } from '../../types/tax';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  X,
  FileText,
  ExternalLink,
  Building,
  CheckCircle2,
  Clock,
  Landmark,
  ShieldCheck,
  Tag,
  Receipt,
} from 'lucide-react';

interface TaxDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TaxTransaction | null;
  onViewSourceInvoice?: (invoiceId: string) => void;
}

export const TaxDrilldownModal: React.FC<TaxDrilldownModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onViewSourceInvoice,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Rincian Transaksi Perpajakan
                </h3>
                <Badge variant="info" size="sm">
                  {transaction.taxType}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {transaction.transactionNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Provenance Flow Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
              Jejak Audit Sumber Transaksi (End-to-End Traceability)
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-800">
              <span className="px-2 py-1 bg-white rounded-md border border-blue-200 shadow-xs">
                Dokumen: {transaction.sourceDocNumber}
              </span>
              <span>→</span>
              <span className="px-2 py-1 bg-white rounded-md border border-blue-200 shadow-xs">
                Jurnal: {transaction.journalEntryNumber || 'JV-AUTO'}
              </span>
              <span>→</span>
              <span className="px-2 py-1 bg-blue-600 text-white rounded-md shadow-xs">
                {transaction.taxInvoiceNumber ? `e-Faktur NSFP ${transaction.taxInvoiceNumber}` : `e-Bupot ${transaction.withholdingSlipNumber || '-'}`}
              </span>
              <span>→</span>
              <span className="px-2 py-1 bg-emerald-600 text-white rounded-md shadow-xs">
                SPT Masa {transaction.taxType}
              </span>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pihak Lawan Transaksi
              </p>
              <p className="text-sm font-bold text-slate-900">{transaction.partyName}</p>
              <p className="text-slate-600 font-mono text-[11px]">
                NPWP: {transaction.partyNpwp || '-'}
              </p>
              {transaction.partyAddress && (
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  {transaction.partyAddress}
                </p>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Perhitungan Perpajakan
              </p>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600">Dasar Pengenaan Pajak (DPP):</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatRupiah(transaction.dpp)}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-600">Tarif ({transaction.taxCode}):</span>
                <span className="font-bold text-slate-900 font-mono">
                  {transaction.taxRate}%
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-slate-800">Nilai Pajak:</span>
                <span className="font-bold text-blue-700 font-mono text-sm">
                  {formatRupiah(transaction.taxAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Details */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Kepatuhan & Penyetoran
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Tanggal Transaksi / Faktur:</span>
                <span className="font-medium text-slate-900">{formatIndoDate(transaction.transactionDate)}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Nomor Seri Faktur Pajak (NSFP):</span>
                <span className="font-mono font-bold text-blue-700">{transaction.taxInvoiceNumber || '-'}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Status Penyetoran / NTPN:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant={transaction.paymentStatus === 'paid' ? 'success' : 'warning'} size="sm">
                    {transaction.paymentStatus === 'paid' ? 'Lunas / Disetor' : 'Belum Disetor'}
                  </Badge>
                  {transaction.ntpn && (
                    <span className="font-mono text-slate-700 font-semibold">{transaction.ntpn}</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Dapat Dikreditkan:</span>
                <span className="font-medium text-slate-900">
                  {transaction.isCreditable ? 'Ya (Dapat dikreditkan di SPT)' : 'Tidak'}
                </span>
              </div>
            </div>

            {transaction.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block text-[11px]">Keterangan:</span>
                <p className="text-slate-700 mt-0.5">{transaction.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {transaction.sourceId && onViewSourceInvoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onViewSourceInvoice(transaction.sourceId!);
                }}
                leftIcon={<ExternalLink className="w-4 h-4 text-blue-600" />}
              >
                Buka Invoice Asli ({transaction.sourceDocNumber})
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};
