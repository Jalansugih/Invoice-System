import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, Customer, Product } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, calculateDueDate } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Building2,
  CreditCard,
  CheckCircle2,
  Calculator,
  Percent,
} from 'lucide-react';

export interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: Invoice | null;
  initialCustomer?: Customer | null;
  onSuccess: (invoice: Invoice) => void;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
  initialCustomer,
  onSuccess,
}) => {
  const org = StorageService.getOrganization();
  const customers = StorageService.getCustomers().filter((c) => c.isActive);
  const products = StorageService.getProducts().filter((p) => p.isActive);

  const [customerId, setCustomerId] = useState(initialCustomer?.id || customers[0]?.id || '');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [termDays, setTermDays] = useState(org.defaultPaymentTermsDays || 14);
  const [dueDate, setDueDate] = useState(calculateDueDate(new Date().toISOString().split('T')[0], org.defaultPaymentTermsDays || 14));
  const [poNumber, setPoNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('Mohon mencantumkan nomor invoice pada berita transfer pembayaran.');
  const [paymentTerms, setPaymentTerms] = useState(`Net ${org.defaultPaymentTermsDays || 14} Hari`);
  const [bankAccountId, setBankAccountId] = useState(org.bankAccounts[0]?.id || '');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `item-${Date.now()}`,
      description: 'Layanan Konsultasi & Implementasi',
      quantity: 1,
      unit: 'Paket',
      unitPrice: 10000000,
      discount: 0,
      taxRate: 11,
      amount: 10000000,
    },
  ]);

  // Adjustments
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(org.defaultTaxRate || 11);
  const [additionalCharges, setAdditionalCharges] = useState(0);

  const [status, setStatus] = useState<Invoice['status']>('draft');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (invoiceToEdit) {
      setCustomerId(invoiceToEdit.customerId);
      setIssueDate(invoiceToEdit.issueDate);
      setDueDate(invoiceToEdit.dueDate);
      setPoNumber(invoiceToEdit.poNumber || '');
      setReferenceNumber(invoiceToEdit.referenceNumber || '');
      setNotes(invoiceToEdit.notes || '');
      setPaymentTerms(invoiceToEdit.paymentTerms || '');
      setBankAccountId(invoiceToEdit.bankAccountId || org.bankAccounts[0]?.id || '');
      setItems(invoiceToEdit.items);
      setDiscountType(invoiceToEdit.discountType);
      setDiscountValue(invoiceToEdit.discountValue);
      setTaxRate(invoiceToEdit.taxRate);
      setAdditionalCharges(invoiceToEdit.additionalCharges || 0);
      setStatus(invoiceToEdit.status);
    } else if (isOpen) {
      const todayStr = new Date().toISOString().split('T')[0];
      setCustomerId(initialCustomer?.id || customers[0]?.id || '');
      setIssueDate(todayStr);
      setTermDays(org.defaultPaymentTermsDays || 14);
      setDueDate(calculateDueDate(todayStr, org.defaultPaymentTermsDays || 14));
      setPoNumber('');
      setReferenceNumber('');
      setNotes('Mohon mencantumkan nomor invoice pada berita transfer pembayaran.');
      setPaymentTerms(`Net ${org.defaultPaymentTermsDays || 14} Hari`);
      setBankAccountId(org.bankAccounts[0]?.id || '');
      setDiscountType('fixed');
      setDiscountValue(0);
      setTaxRate(org.defaultTaxRate || 11);
      setAdditionalCharges(0);
      setStatus('draft');

      if (products.length > 0) {
        const p = products[0];
        setItems([
          {
            id: `item-${Date.now()}`,
            productId: p.id,
            productCode: p.code,
            description: p.name + (p.description ? ` - ${p.description}` : ''),
            quantity: 1,
            unit: p.unit,
            unitPrice: p.price,
            discount: 0,
            taxRate: p.taxRate,
            amount: p.price,
          },
        ]);
      }
    }
  }, [invoiceToEdit, initialCustomer, isOpen]);

  const handleIssueDateChange = (date: string) => {
    setIssueDate(date);
    setDueDate(calculateDueDate(date, termDays));
  };

  const handleTermDaysChange = (days: number) => {
    setTermDays(days);
    setDueDate(calculateDueDate(issueDate, days));
    setPaymentTerms(`Net ${days} Hari`);
  };

  // Line item handlers
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: '',
      quantity: 1,
      unit: 'Unit',
      unitPrice: 0,
      discount: 0,
      taxRate: taxRate,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('Invoice harus memiliki minimal 1 item baris tagihan.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const updated = [...items];
    const item = updated[index];
    const qty = item.quantity || 1;
    const itemDiscount = item.discount || 0;
    const amount = Math.max(0, qty * prod.price - itemDiscount);

    updated[index] = {
      ...item,
      productId: prod.id,
      productCode: prod.code,
      description: prod.name + (prod.description ? `\n${prod.description}` : ''),
      unit: prod.unit,
      unitPrice: prod.price,
      taxRate: prod.taxRate,
      amount,
    };
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const discount = Number(item.discount) || 0;
    item.amount = Math.max(0, qty * price - discount);
    updated[index] = item;
    setItems(updated);
  };

  // Calculated totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount =
    discountType === 'percentage' ? (subtotal * (discountValue || 0)) / 100 : discountValue || 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (taxRate || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount + (Number(additionalCharges) || 0);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customerId = 'Pelanggan wajib dipilih';
    if (!issueDate) errs.issueDate = 'Tanggal terbit wajib diisi';
    if (!dueDate) errs.dueDate = 'Tanggal jatuh tempo wajib diisi';
    if (items.length === 0) errs.items = 'Minimal 1 item tagihan diperlukan';

    items.forEach((item, idx) => {
      if (!item.description.trim()) errs[`item_${idx}`] = 'Deskripsi item wajib diisi';
      if (item.quantity <= 0) errs[`qty_${idx}`] = 'Qty minimal 1';
      if (item.unitPrice < 0) errs[`price_${idx}`] = 'Harga tidak boleh negatif';
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const saved = await StorageService.saveInvoice({
        ...(invoiceToEdit ? { id: invoiceToEdit.id } : {}),
        customerId,
        issueDate,
        dueDate,
        poNumber,
        referenceNumber,
        notes,
        paymentTerms,
        bankAccountId,
        items,
        discountType,
        discountValue,
        taxRate,
        additionalCharges,
        status,
      });

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan invoice');
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
          <FileText className="w-5 h-5 text-blue-600" />
          <span>{invoiceToEdit ? `Edit Invoice (${invoiceToEdit.invoiceNumber})` : 'Buat Faktur / Invoice Baru'}</span>
        </div>
      }
      subtitle="Kalkulasi otomatis PPN 11%, diskon, penomoran urut resmi, dan syarat penagihan"
      maxWidth="5xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Grand Total:</span>
            <strong className="text-base text-blue-700 font-bold">{formatRupiah(grandTotal)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {invoiceToEdit ? 'Simpan Perubahan' : 'Terbitkan Invoice'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer & Invoice Metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="lg:col-span-2 space-y-3">
            <div>
              <Select
                label="Pilih Pelanggan / Entitas Penagihan"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                error={errors.customerId}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.companyName}) - {c.city}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nomor PO Pelanggan (Purchase Order)"
                placeholder="e.g. PO-TPN-2026-088"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
              />
              <Input
                label="Nomor Referensi Transaksi / Kontrak"
                placeholder="e.g. KTR-IT-0991"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Tanggal Terbit"
                type="date"
                value={issueDate}
                onChange={(e) => handleIssueDateChange(e.target.value)}
                error={errors.issueDate}
                required
              />
              <Select
                label="Termin (Hari)"
                value={termDays}
                onChange={(e) => handleTermDaysChange(Number(e.target.value))}
              >
                <option value={7}>Net 7 Hari</option>
                <option value={14}>Net 14 Hari</option>
                <option value={30}>Net 30 Hari</option>
                <option value={45}>Net 45 Hari</option>
                <option value={60}>Net 60 Hari</option>
                <option value={0}>Tunai / Cash</option>
              </Select>
            </div>

            <Input
              label="Tanggal Jatuh Tempo"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              error={errors.dueDate}
              required
            />
          </div>
        </div>

        {/* Section 2: Dynamic Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-600" />
              Rincian Item Tagihan & Layanan
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Tambah Baris Item
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-1/3">Pilih Produk & Deskripsi</th>
                  <th className="py-2.5 px-2 w-16 text-center">Qty</th>
                  <th className="py-2.5 px-2 w-20">Satuan</th>
                  <th className="py-2.5 px-3 w-32 text-right">Harga Satuan (Rp)</th>
                  <th className="py-2.5 px-2 w-24 text-right">Potongan (Rp)</th>
                  <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="bg-white hover:bg-slate-50/50">
                    <td className="p-2.5 align-top space-y-1.5">
                      {products.length > 0 && (
                        <select
                          className="w-full text-[11px] font-medium py-1 px-2 rounded border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={item.productId || ''}
                          onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                        >
                          <option value="">-- Pilih dari Master Produk (Opsional) --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatRupiah(p.price)}/{p.unit})
                            </option>
                          ))}
                        </select>
                      )}
                      <textarea
                        rows={2}
                        placeholder="Deskripsi pekerjaan / rincian tagihan..."
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className={`w-full rounded border p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors[`item_${idx}`] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </td>

                    <td className="p-2 align-top text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full text-center rounded border border-slate-300 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    <td className="p-2 align-top">
                      <input
                        type="text"
                        placeholder="Paket/Bln"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full rounded border border-slate-300 py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    <td className="p-2 align-top">
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full text-right rounded border border-slate-300 py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    <td className="p-2 align-top">
                      <input
                        type="number"
                        min="0"
                        value={item.discount}
                        onChange={(e) => handleItemChange(idx, 'discount', Number(e.target.value))}
                        className="w-full text-right rounded border border-slate-300 py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    <td className="p-2.5 align-top text-right font-bold text-slate-900">
                      {formatRupiah(item.amount)}
                    </td>

                    <td className="p-2 align-top text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Summary Calculations & Footer Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Notes & Bank selection */}
          <div className="space-y-4">
            <div>
              <Select
                label="Rekening Bank Tujuan Pembayaran"
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
              >
                {org.bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber} a/n {b.accountHolder}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan & Petunjuk Pembayaran (Tertera pada Faktur)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Input
                label="Syarat & Ketentuan Penagihan"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>
          </div>

          {/* Calculations Box */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal Item:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
            </div>

            {/* Global Discount */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">Diskon Faktur:</span>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="py-0.5 px-1.5 rounded border border-slate-300 text-[11px] bg-white"
                >
                  <option value="fixed">Nominal (Rp)</option>
                  <option value="percentage">Persen (%)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-24 text-right rounded border border-slate-300 py-1 px-2 text-xs bg-white"
                />
                <span className="text-slate-500 w-24 text-right">-{formatRupiah(discountAmount)}</span>
              </div>
            </div>

            {/* PPN Tax */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600">PPN:</span>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="py-0.5 px-1.5 rounded border border-slate-300 text-[11px] bg-white"
                >
                  <option value={11}>11% (Standar)</option>
                  <option value={12}>12%</option>
                  <option value={0}>0% (Non-PKP / Bebas PPN)</option>
                </select>
              </div>
              <span className="font-semibold text-slate-800">+{formatRupiah(taxAmount)}</span>
            </div>

            {/* Additional Charges */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
              <span className="text-slate-600">Biaya Tambahan / Ongkir:</span>
              <input
                type="number"
                min="0"
                value={additionalCharges}
                onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                className="w-28 text-right rounded border border-slate-300 py-1 px-2 text-xs bg-white"
              />
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between pt-2 border-t-2 border-slate-300 text-sm">
              <span className="font-bold text-slate-900">Total Tagihan (Grand Total):</span>
              <span className="font-bold text-blue-700 text-base">{formatRupiah(grandTotal)}</span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
