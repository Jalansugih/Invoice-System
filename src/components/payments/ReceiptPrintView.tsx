import React, { useState } from 'react';
import { Payment } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate, terbilang } from '../../lib/utils';
import { exportElementToPdf } from '../../lib/pdfExport';
import { Button } from '../ui/Button';
import { Printer, ArrowLeft, CheckCircle2, Download, Loader2 } from 'lucide-react';

export interface ReceiptPrintViewProps {
  payment: Payment;
  onBack: () => void;
}

export const ReceiptPrintView: React.FC<ReceiptPrintViewProps> = ({ payment, onBack }) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const org = StorageService.getOrganization();
  const invoice = StorageService.getInvoices().find((i) => i.id === payment.invoiceId);
  const bank = org.bankAccounts.find((b) => b.id === payment.bankAccountId) || org.bankAccounts[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      const cleanCustomer = payment.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Kuitansi_${payment.receiptNumber}_${cleanCustomer}.pdf`;
      await exportElementToPdf({
        elementId: 'printable-receipt',
        filename,
        onProgress: setIsExportingPdf,
      });
    } catch (err: any) {
      alert('Gagal mengekspor kuitansi ke PDF: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Kembali ke Daftar Pembayaran
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="text-slate-700 hover:bg-slate-50"
          >
            Cetak (Print)
          </Button>

          <Button
            size="sm"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            leftIcon={
              isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4" />
              )
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md min-w-[140px]"
          >
            {isExportingPdf ? 'Membuat PDF...' : 'Print to PDF'}
          </Button>
        </div>
      </div>

      {/* Official Indonesian Receipt Container */}
      <div
        id="printable-receipt"
        className="printable-document bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm text-slate-800 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Header / Kop */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-slate-900 pb-6 avoid-page-break">
          <div className="space-y-1 max-w-md">
            <div className="flex items-center gap-3">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="h-12 w-auto max-w-[160px] object-contain shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg print:bg-emerald-600 print:text-white shrink-0">
                  {org.name ? org.name.slice(0, 2).toUpperCase() : 'BF'}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">{org.name}</h1>
                {org.tagline && <p className="text-xs text-slate-500 font-medium mt-0.5">{org.tagline}</p>}
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {org.address}, {org.city}, {org.province} {org.postalCode}
            </p>
            <p className="text-xs text-slate-600">
              Telp: {org.phone} | Email: {org.email} | NPWP: {org.npwp}
            </p>
          </div>

          <div className="sm:text-right space-y-1 shrink-0">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              KUITANSI PEMBAYARAN
            </h2>
            <p className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 inline-block px-2.5 py-0.5 rounded border border-emerald-200 print:border-emerald-300">
              {payment.receiptNumber}
            </p>
            <p className="text-xs text-slate-600 pt-1">
              Tanggal: <strong className="text-slate-900">{formatIndoDate(payment.paymentDate)}</strong>
            </p>
          </div>
        </div>

        {/* Receipt Body Table Structure */}
        <div className="my-8 border border-slate-300 rounded-xl overflow-hidden text-xs avoid-page-break">
          <div className="grid grid-cols-1 sm:grid-cols-4 p-4 border-b border-slate-200 bg-slate-50/70 items-center print:bg-slate-50/50">
            <span className="font-bold text-slate-600 sm:col-span-1">Telah Diterima Dari:</span>
            <div className="sm:col-span-3 font-bold text-sm text-slate-900">
              {payment.customerName} ({invoice?.customerCompanyName || payment.customerName})
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 p-4 border-b border-slate-200 items-start">
            <span className="font-bold text-slate-600 sm:col-span-1">Uang Sejumlah:</span>
            <div className="sm:col-span-3 space-y-1">
              <div className="font-mono font-black text-lg sm:text-xl text-emerald-700 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 inline-block print:border-emerald-300">
                {formatRupiah(payment.amount)}
              </div>
              <p className="text-xs text-slate-700 italic font-medium pt-1 leading-relaxed">
                # {terbilang(payment.amount)} Rupiah #
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 p-4 border-b border-slate-200 items-start">
            <span className="font-bold text-slate-600 sm:col-span-1">Untuk Pembayaran:</span>
            <div className="sm:col-span-3 space-y-1.5">
              <p className="font-semibold text-slate-800">
                Pembayaran Tagihan Faktur No.{' '}
                <strong className="font-mono text-blue-700">{payment.invoiceNumber}</strong>
              </p>
              {payment.notes && <p className="text-slate-600 text-xs">Keterangan: {payment.notes}</p>}
              {payment.referenceNumber && (
                <p className="text-slate-500 text-[11px] font-mono">
                  No. Bukti Transaksi: {payment.referenceNumber}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 p-4 bg-slate-50/50 items-center print:bg-slate-50/30">
            <span className="font-bold text-slate-600 sm:col-span-1">Metode Penerimaan:</span>
            <div className="sm:col-span-3 text-slate-700 capitalize font-medium">
              {payment.paymentMethod.replace('_', ' ')}{' '}
              {bank && `(Bank ${bank.bankName} - Rek ${bank.accountNumber})`}
            </div>
          </div>
        </div>

        {/* Invoice Summary Status */}
        {invoice && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs avoid-page-break print:bg-slate-50/50 print:border-slate-300">
            <div>
              <p className="text-slate-500">Total Nilai Faktur</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{formatRupiah(invoice.grandTotal)}</p>
            </div>
            <div>
              <p className="text-slate-500">Total Telah Dibayar</p>
              <p className="font-bold text-emerald-700 text-sm mt-0.5">{formatRupiah(invoice.paidAmount)}</p>
            </div>
            <div>
              <p className="text-slate-500">Sisa Saldo Piutang</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {invoice.outstandingAmount > 0 ? (
                  <span className="text-amber-700">{formatRupiah(invoice.outstandingAmount)}</span>
                ) : (
                  <span className="text-emerald-600">Lunas Penuh (Rp 0)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Signature Box */}
        <div className="signature-block grid grid-cols-1 sm:grid-cols-2 gap-8 my-10 pt-4 text-xs avoid-page-break">
          <div>
            <div className="border border-dashed border-emerald-400 bg-emerald-50/30 p-3 rounded-xl text-emerald-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Transaksi Sah & Terverifikasi</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Kuitansi ini merupakan bukti pembayaran resmi yang sah dan mengikat yang dikeluarkan oleh sistem Rajakas.id Enterprise.
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right flex flex-col justify-between items-center sm:items-end">
            <p className="text-slate-600">
              {org.city}, {formatIndoDate(payment.paymentDate)}
            </p>
            <p className="font-bold text-slate-900 uppercase mt-0.5">{org.name}</p>

            <div className="h-20 flex items-center justify-center my-1">
              {org.signatureImage ? (
                <img
                  src={org.signatureImage}
                  alt="Tanda Tangan Kasir / Bagian Keuangan"
                  className="max-h-18 max-w-[180px] object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="border border-dashed border-slate-300 rounded px-4 py-2 text-[10px] text-slate-400">
                  [ Tanda Tangan Kasir / Bagian Keuangan ]
                </div>
              )}
            </div>

            <div>
              <p className="font-bold text-slate-900 underline uppercase">
                {payment.recordedBy || 'Finance & Cashier Officer'}
              </p>
              <p className="text-[10px] text-slate-500">Finance & Treasury Department</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
