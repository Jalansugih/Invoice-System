import React, { useState, useMemo } from 'react';
import { Payment } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  CreditCard,
  Search,
  Plus,
  Download,
  Eye,
  Trash2,
  Sparkles,
} from 'lucide-react';

export interface PaymentListProps {
  onViewReceipt: (payment: Payment) => void;
  onCreateNewPayment: () => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  onViewReceipt,
  onCreateNewPayment,
}) => {
  const [payments, setPayments] = useState(StorageService.getPayments());
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const refreshData = () => {
    setPayments(StorageService.getPayments());
  };

  const filteredPayments = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return payments.filter((p) => {
      const matchSearch =
        !q ||
        (p.receiptNumber || '').toLowerCase().includes(q) ||
        (p.paymentNumber || '').toLowerCase().includes(q) ||
        (p.invoiceNumber || '').toLowerCase().includes(q) ||
        (p.customerName || '').toLowerCase().includes(q) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;
      if (dateFrom && p.paymentDate < dateFrom) return false;
      if (dateTo && p.paymentDate > dateTo) return false;

      return true;
    });
  }, [payments, searchQuery, methodFilter, dateFrom, dateTo]);

  const handleExportCSV = () => {
    const data = filteredPayments.map((p) => ({
      'No. Kuitansi': p.receiptNumber,
      'Tanggal Bayar': p.paymentDate,
      'No. Invoice': p.invoiceNumber,
      'Pelanggan': p.customerName,
      'Metode': p.paymentMethod,
      'Nominal (Rp)': p.amount,
      'No. Referensi': p.referenceNumber || '-',
      'Pencatat': p.recordedBy,
      'Keterangan': p.notes || '-',
    }));
    exportToCSV(`Laporan_Penerimaan_Pembayaran_${new Date().toISOString().split('T')[0]}`, data);
  };

  const handleDeleteConfirm = () => {
    if (!paymentToDelete) return;
    try {
      StorageService.deletePayment(paymentToDelete.id);
      setPaymentToDelete(null);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kuitansi pembayaran');
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Payment Receipts & Collections
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kas masuk, penerbitan kuitansi, dan pembaruan piutang secara real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={onCreateNewPayment}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Total Receipts Recorded
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight truncate">
              {payments.length}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">Verified payment transactions</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Total Revenue Collected
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-emerald-600 mt-1 tabular-nums tracking-tight truncate" title={formatRupiah(totalCollected)}>
              {formatRupiah(totalCollected)}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">Cleared cash collections</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Average Payment Ticket
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight truncate" title={formatRupiah(payments.length > 0 ? totalCollected / payments.length : 0)}>
              {formatRupiah(payments.length > 0 ? totalCollected / payments.length : 0)}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">Per receipt settlement</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search receipt number, invoice, reference, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="bank_transfer">Bank Transfer (BCA/Mandiri)</option>
              <option value="giro">Bilyet Giro / Cek</option>
              <option value="cash">Cash / Kas Tunai</option>
              <option value="credit_card">Kartu Kredit / Debit</option>
              <option value="qris">QRIS / E-Wallet</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Dari Tanggal"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Sampai Tanggal"
            />
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3">Receipt & Ref No.</th>
                <th className="px-6 py-3">Customer & Invoice</th>
                <th className="px-6 py-3">Payment Date</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3 text-right">Amount Paid</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No payment receipts found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onViewReceipt(p)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-mono text-xs font-semibold text-emerald-600">{p.receiptNumber}</p>
                      {p.referenceNumber && (
                        <p className="text-[10px] text-slate-400 font-mono">Ref: {p.referenceNumber}</p>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-xs">
                      <p className="font-semibold text-slate-900">{p.customerName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Inv: {p.invoiceNumber}</p>
                    </td>

                    <td className="px-6 py-3.5 text-xs text-slate-800">
                      {formatIndoDate(p.paymentDate)}
                    </td>

                    <td className="px-6 py-3.5 text-xs">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium uppercase">
                        {p.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-600 text-xs">
                      {formatRupiah(p.amount)}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onViewReceipt(p)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="View Official Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setPaymentToDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Receipt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!paymentToDelete}
        title="Hapus Kuitansi Pembayaran"
        message={`Apakah Anda yakin ingin menghapus kuitansi ${paymentToDelete?.receiptNumber} senilai ${formatRupiah(paymentToDelete?.amount || 0)}? Saldo sisa invoice terkait akan otomatis dihitung kembali.`}
        confirmText="Hapus Kuitansi"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setPaymentToDelete(null)}
        onCancel={() => setPaymentToDelete(null)}
      />
    </div>
  );
};
