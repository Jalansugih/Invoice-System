import React, { useState } from 'react';
import { TaxType, TaxTransaction } from '../../types/tax';
import { TaxService } from '../../lib/taxService';
import { StorageService } from '../../lib/storage';
import { formatRupiah } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Plus, Check, FileText, Landmark } from 'lucide-react';

interface TaxTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (tx: TaxTransaction) => void;
}

export const TaxTransactionModal: React.FC<TaxTransactionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const configs = TaxService.getTaxConfigs();
  const customers = StorageService.getCustomers();

  const [taxType, setTaxType] = useState<TaxType>('PPN');
  const [taxCode, setTaxCode] = useState('PPN-11');
  const [taxRate, setTaxRate] = useState<number>(11);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceType, setSourceType] = useState<'sales_invoice' | 'purchase_bill' | 'payroll' | 'bank_payment' | 'manual_entry'>('purchase_bill');
  const [sourceDocNumber, setSourceDocNumber] = useState('');
  const [taxInvoiceNumber, setTaxInvoiceNumber] = useState('');
  const [withholdingSlipNumber, setWithholdingSlipNumber] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyNpwp, setPartyNpwp] = useState('');
  const [dpp, setDpp] = useState<number>(0);
  const [category, setCategory] = useState<'output_vat' | 'input_vat' | 'withheld_payable' | 'tax_credit' | 'prepaid_tax' | 'final_tax'>('input_vat');
  const [isCreditable, setIsCreditable] = useState(true);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'credited'>('paid');
  const [ntpn, setNtpn] = useState('');

  if (!isOpen) return null;

  const handleTaxCodeChange = (code: string) => {
    setTaxCode(code);
    const cfg = configs.find((c) => c.code === code);
    if (cfg) {
      setTaxType(cfg.taxType);
      setTaxRate(cfg.rate);
      setIsCreditable(cfg.isDeductible);
      if (cfg.taxType === 'PPN') {
        setCategory(sourceType === 'purchase_bill' ? 'input_vat' : 'output_vat');
      } else if (cfg.taxType === 'PPh23' || cfg.taxType === 'PPh22') {
        setCategory('tax_credit');
      } else if (cfg.taxType === 'PPh25') {
        setCategory('prepaid_tax');
      } else if (cfg.taxType === 'PPhFinal') {
        setCategory('final_tax');
      } else {
        setCategory('withheld_payable');
      }
    }
  };

  const calculatedTaxAmount = Math.round((dpp * taxRate) / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || dpp <= 0) {
      alert('Mohon isi nama pihak lawan transaksi dan nilai DPP yang valid.');
      return;
    }

    const d = new Date(transactionDate);
    const saved = TaxService.saveTaxTransaction({
      taxType,
      taxCode,
      taxRate,
      periodYear: d.getFullYear(),
      periodMonth: d.getMonth() + 1,
      transactionDate,
      taxInvoiceNumber: taxInvoiceNumber ? taxInvoiceNumber.trim() : undefined,
      withholdingSlipNumber: withholdingSlipNumber ? withholdingSlipNumber.trim() : undefined,
      sourceType,
      sourceDocNumber: sourceDocNumber.trim() || `MANUAL/${Date.now().toString().slice(-6)}`,
      partyType: sourceType === 'purchase_bill' ? 'supplier' : 'customer',
      partyName: partyName.trim(),
      partyNpwp: partyNpwp.trim() || '00.000.000.0-000.000',
      dpp,
      taxAmount: calculatedTaxAmount,
      grossAmount: dpp + (taxType === 'PPN' ? calculatedTaxAmount : 0),
      isCreditable,
      category,
      paymentStatus,
      ntpn: ntpn ? ntpn.trim() : undefined,
      notes: notes.trim(),
      filingStatus: 'ready_to_file',
    });

    onSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Input Transaksi Pajak Baru
              </h3>
              <p className="text-xs text-slate-500">
                Catat Faktur Pajak Masukan/Keluaran, Bukti Potong PPh Unifikasi, atau Setoran SSP
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Aturan & Tarif Pajak
              </label>
              <select
                value={taxCode}
                onChange={(e) => handleTaxCodeChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                {configs.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} - {c.name} ({c.rate}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Transaksi
              </label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jenis Dokumen Sumber
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as any)}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="purchase_bill">Tagihan Vendor / Pembelian (Pajak Masukan)</option>
                <option value="sales_invoice">Invoice Penjualan (Pajak Keluaran)</option>
                <option value="payroll">Payroll / Gaji (PPh 21)</option>
                <option value="bank_payment">Setoran SSP Kas Negara (PPh 25 / NTPN)</option>
                <option value="manual_entry">Pencatatan Manual / Bukti Potong Klien</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Dokumen Sumber
              </label>
              <Input
                value={sourceDocNumber}
                onChange={(e) => setSourceDocNumber(e.target.value)}
                placeholder="Contoh: BILL/2026/08/0091 atau INV/2026/08/00004"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Seri Faktur Pajak (NSFP)
              </label>
              <Input
                value={taxInvoiceNumber}
                onChange={(e) => setTaxInvoiceNumber(e.target.value)}
                placeholder="010.002-26.99887766 (Opsional)"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Bukti Potong (e-Bupot)
              </label>
              <Input
                value={withholdingSlipNumber}
                onChange={(e) => setWithholdingSlipNumber(e.target.value)}
                placeholder="23-BP-202608-0099 (Opsional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lawan Transaksi (Customer / Supplier)
              </label>
              <Input
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Contoh: PT Sumber Data Digital"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                NPWP Lawan Transaksi (16/15 digit)
              </label>
              <Input
                value={partyNpwp}
                onChange={(e) => setPartyNpwp(e.target.value)}
                placeholder="01.234.567.8-901.000"
              />
            </div>
          </div>

          {/* Amount Calculation Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dasar Pengenaan Pajak (DPP)
                </label>
                <Input
                  type="number"
                  value={dpp || ''}
                  onChange={(e) => setDpp(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tarif Pajak (%)
                </label>
                <Input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nilai Pajak Terhitung
                </label>
                <div className="h-9 px-3 bg-white border border-slate-300 rounded-lg flex items-center font-mono font-bold text-emerald-600 text-xs">
                  {formatRupiah(calculatedTaxAmount)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status Pembayaran / Penyetoran
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800"
                >
                  <option value="paid">Lunas / Disetor ke Kas Negara</option>
                  <option value="unpaid">Belum Disetor (Hutang Pajak)</option>
                  <option value="credited">Dikreditkan (Kredit Pajak)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor NTPN (Bukti Setor Bank/DJP)
                </label>
                <Input
                  value={ntpn}
                  onChange={(e) => setNtpn(e.target.value)}
                  placeholder="16 karakter NTPN (contoh: 88A1B2C3D4E5F678)"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan & Keterangan
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keterangan uraian barang/jasa atau nomor referensi"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              leftIcon={<Check className="w-4 h-4" />}
            >
              Simpan Transaksi Pajak
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
