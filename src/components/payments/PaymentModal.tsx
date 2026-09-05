import React, { useState, useEffect } from 'react';
import { Payment, Invoice } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { CreditCard, CheckCircle2, Building2, Wallet } from 'lucide-react';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetInvoice?: Invoice | null;
  paymentToEdit?: Payment | null;
  onSuccess: (payment: Payment) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  targetInvoice,
  paymentToEdit,
  onSuccess,
}) => {
  const org = StorageService.getOrganization();
  const unpaidInvoices = StorageService.getInvoices().filter(
    (i) => i.outstandingAmount > 0 && i.status !== 'cancelled'
  );

  const [invoiceId, setInvoiceId] = useState(targetInvoice?.id || unpaidInvoices[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(targetInvoice?.outstandingAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('bank_transfer');
  const [bankAccountId, setBankAccountId] = useState(org.bankAccounts[0]?.id || '');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('Pelunasan transfer via bank');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedInvoice =
    StorageService.getInvoices().find((i) => i.id === invoiceId) || targetInvoice;

  useEffect(() => {
    if (paymentToEdit) {
      setInvoiceId(paymentToEdit.invoiceId);
      setPaymentDate(paymentToEdit.paymentDate);
      setAmount(paymentToEdit.amount);
      setPaymentMethod(paymentToEdit.paymentMethod);
      setBankAccountId(paymentToEdit.bankAccountId || org.bankAccounts[0]?.id || '');
      setReferenceNumber(paymentToEdit.referenceNumber || '');
      setNotes(paymentToEdit.notes || '');
    } else if (isOpen) {
      const inv = targetInvoice || unpaidInvoices[0];
      setInvoiceId(inv?.id || '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setAmount(inv?.outstandingAmount || 0);
      setPaymentMethod('bank_transfer');
      setBankAccountId(org.bankAccounts[0]?.id || '');
      setReferenceNumber(`TRX-${Date.now().toString().slice(-6)}`);
      setNotes('Pelunasan transfer via bank');
    }
  }, [paymentToEdit, targetInvoice, isOpen]);

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const inv = StorageService.getInvoices().find((i) => i.id === id);
    if (inv) {
      setAmount(inv.outstandingAmount);
    }
  };

  const handleQuickAmount = (type: 'full' | 'half') => {
    if (!selectedInvoice) return;
    if (type === 'full') setAmount(selectedInvoice.outstandingAmount);
    if (type === 'half') setAmount(Math.round(selectedInvoice.outstandingAmount / 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) {
      alert('Pilih faktur/invoice yang akan dibayarkan.');
      return;
    }
    if (!amount || amount <= 0) {
      alert('Nominal pembayaran harus lebih besar dari 0.');
      return;
    }
    if (selectedInvoice && amount > selectedInvoice.outstandingAmount) {
      const proceed = confirm(
        `Nominal yang Anda masukkan (${formatRupiah(amount)}) melebihi sisa piutang invoice (${formatRupiah(selectedInvoice.outstandingAmount)}). Lanjutkan?`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    try {
      const saved = await StorageService.recordPayment({
        invoiceId,
        paymentDate,
        amount: Number(amount),
        paymentMethod,
        bankAccountId,
        referenceNumber,
        notes,
      });

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <span>Catat Pembayaran</span>
        </div>
      }
      subtitle="Pilih invoice → masukkan nominal → simpan. Jurnal kas/bank dan piutang dibuat otomatis."
      maxWidth="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Simpan Penerimaan Pembayaran
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice Selection */}
        <div>
          <Select
            label="Pilih Faktur / Invoice Penagihan"
            value={invoiceId}
            onChange={(e) => handleInvoiceChange(e.target.value)}
            required
          >
            {unpaidInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} - {inv.customerName} (Sisa: {formatRupiah(inv.outstandingAmount)})
              </option>
            ))}
          </Select>
        </div>

        {/* Selected Invoice Details Info */}
        {selectedInvoice && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Pelanggan:</span>
              <strong className="text-slate-900">{selectedInvoice.customerName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Nilai Faktur:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(selectedInvoice.grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-1">
              <span className="text-amber-800 font-semibold">Sisa Tagihan (Piutang):</span>
              <strong className="text-amber-900 font-bold text-sm">
                {formatRupiah(selectedInvoice.outstandingAmount)}
              </strong>
            </div>
          </div>
        )}

        {/* Amount Input with Quick Buttons */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Nominal Pembayaran Diterima (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickAmount('full')}
                className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200"
              >
                Bayar Lunas (100%)
              </button>

            </div>
          </div>
          <Input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tanggal Penerimaan Pembayaran"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />

          <Select
            label="Metode Pembayaran"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
          >
            <option value="bank_transfer">Transfer Bank (BCA / Mandiri / BNI / BRI)</option>
            <option value="cash">Tunai / Kas Langsung</option>
            <option value="giro_cek">Giro / Bilyet Cek</option>
            <option value="virtual_account">Virtual Account</option>
            <option value="qris">QRIS / E-Wallet</option>
            <option value="other">Lainnya</option>
          </Select>
        </div>

        {paymentMethod !== 'cash' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Rekening Penerima"
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              required
            >
              {org.bankAccounts.length === 0 && <option value="">Belum ada rekening</option>}
              {org.bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber}
                </option>
              ))}
            </Select>

            <Input
              label="No. Referensi"
              placeholder="TRX-99281 / bukti transfer"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>
        )}

        <div>
          <Input
            label="Catatan"
            placeholder="Opsional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
