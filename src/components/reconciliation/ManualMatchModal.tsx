import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { BankTransaction, Invoice, Payment } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import {
  Search,
  CheckCircle2,
  FileText,
  CreditCard,
  Building,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface ManualMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: BankTransaction | null;
  onSuccess: (payment: Payment | undefined, message: string) => void;
}

export const ManualMatchModal: React.FC<ManualMatchModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    StorageService.getInvoices().filter((i) => i.outstandingAmount > 0 && i.status !== 'cancelled')
  );
  const [payments, setPayments] = useState<Payment[]>(() => StorageService.getPayments());

  const [matchMode, setMatchMode] = useState<'new_payment' | 'existing_payment'>('new_payment');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Initialize selected invoice when transaction changes
  React.useEffect(() => {
    if (transaction) {
      setInvoices(StorageService.getInvoices().filter((i) => i.outstandingAmount > 0 && i.status !== 'cancelled'));
      setPayments(StorageService.getPayments());
      setSelectedInvoiceId(transaction.matchedInvoiceId || '');
      setSelectedPaymentId(transaction.matchedPaymentId || '');
      setCustomAmount(transaction.amount);
      setSearchQuery(transaction.matchedCustomerName || '');
    }
  }, [transaction]);

  const selectedInvoice = useMemo(() => {
    return invoices.find((i) => i.id === selectedInvoiceId);
  }, [invoices, selectedInvoiceId]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerCompanyName && inv.customerCompanyName.toLowerCase().includes(q))
    );
  }, [invoices, searchQuery]);

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        p.receiptNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
    );
  }, [payments, searchQuery]);

  const handleConfirmReconcile = () => {
    if (!transaction) return;
    setLoading(true);

    try {
      if (matchMode === 'new_payment') {
        if (!selectedInvoiceId) {
          alert('Pilih salah satu invoice tujuan penagihan');
          setLoading(false);
          return;
        }

        const res = StorageService.reconcileTransaction(
          transaction.id,
          selectedInvoiceId,
          undefined,
          customAmount || transaction.amount
        );
        setLoading(false);
        onSuccess(res.payment, res.message);
        onClose();
      } else {
        if (!selectedPaymentId) {
          alert('Pilih salah satu kuitansi pembayaran');
          setLoading(false);
          return;
        }

        const res = StorageService.reconcileTransaction(
          transaction.id,
          undefined,
          selectedPaymentId
        );
        setLoading(false);
        onSuccess(res.payment, res.message);
        onClose();
      }
    } catch (err: any) {
      setLoading(false);
      alert(err.message || 'Gagal merekonsiliasi transaksi');
    }
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Pilih & Cocokkan Alokasi Invoice</h3>
            <p className="text-xs font-normal text-slate-500">
              Verifikasi transfer masuk dari rekening koran ke tagihan pelanggan
            </p>
          </div>
        </div>
      }
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Transaction Summary Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="neutral" size="sm">
                {transaction.bankName}
              </Badge>
              <span className="text-xs text-slate-500">
                {formatIndoDate(transaction.transactionDate)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Ref: {transaction.referenceNumber || '-'}
              </span>
            </div>
            <span className="text-sm font-bold text-emerald-600 font-mono">
              + {formatRupiah(transaction.amount)}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
            {transaction.description}
          </p>
        </div>

        {/* Match Mode Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMatchMode('new_payment')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              matchMode === 'new_payment'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Alokasikan ke Invoice Terbuka (Terbitkan Kuitansi Baru)
          </button>
          <button
            type="button"
            onClick={() => setMatchMode('existing_payment')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              matchMode === 'existing_payment'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
            Hubungkan dengan Kuitansi Pembayaran yang Sudah Ada
          </button>
        </div>

        {/* Search Field */}
        <div>
          <Input
            placeholder="Cari nomor invoice, nomor kuitansi, atau nama pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* List of Open Invoices */}
        {matchMode === 'new_payment' && (
          <div className="space-y-3">
            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
              {filteredInvoices.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Tidak ditemukan invoice terbuka yang cocok dengan pencarian.
                </div>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSelected = selectedInvoiceId === inv.id;
                  const isExactAmount = inv.outstandingAmount === transaction.amount;

                  return (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setCustomAmount(Math.min(transaction.amount, inv.outstandingAmount));
                      }}
                      className={`p-3 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-4 border-blue-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {inv.invoiceNumber}
                          </span>
                          {isExactAmount && (
                            <Badge variant="success" size="sm">
                              Nominal Persis
                            </Badge>
                          )}
                          <span className="text-[11px] text-slate-400">
                            Jatuh tempo: {formatIndoDate(inv.dueDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{inv.customerName}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-900 font-mono">
                          {formatRupiah(inv.outstandingAmount)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Total: {formatRupiah(inv.grandTotal)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedInvoice && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-900">
                    Nominal Pembayaran yang Dialokasikan:
                  </span>
                  <span className="text-blue-700 font-mono font-bold">
                    Sisa Invoice: {formatRupiah(selectedInvoice.outstandingAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={customAmount || ''}
                    onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 rounded-lg border border-blue-300 bg-white px-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nominal alokasi..."
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCustomAmount(Math.min(transaction.amount, selectedInvoice.outstandingAmount))}
                    className="text-xs shrink-0"
                  >
                    Set Maksimal
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List of Existing Payments */}
        {matchMode === 'existing_payment' && (
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
            {filteredPayments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Tidak ada kuitansi pembayaran yang ditemukan.
              </div>
            ) : (
              filteredPayments.map((p) => {
                const isSelected = selectedPaymentId === p.id;
                const isExactAmount = p.amount === transaction.amount;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPaymentId(p.id)}
                    className={`p-3 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {p.receiptNumber}
                        </span>
                        {isExactAmount && (
                          <Badge variant="success" size="sm">
                            Nominal Sama
                          </Badge>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {formatIndoDate(p.paymentDate)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">
                        {p.customerName} • Inv: {p.invoiceNumber}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900 font-mono">
                        {formatRupiah(p.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400">{p.paymentMethod}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmReconcile}
            isLoading={loading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Konfirmasi Rekonsiliasi & Terbitkan Kuitansi
          </Button>
        </div>
      </div>
    </Modal>
  );
};
