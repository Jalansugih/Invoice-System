import React, { useState } from 'react';
import { Invoice } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate, terbilang } from '../../lib/utils';
import { exportElementToPdf } from '../../lib/pdfExport';
import { Button } from '../ui/Button';
import { Printer, Download, ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

export interface InvoicePrintViewProps {
  invoice: Invoice;
  onBack: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ invoice, onBack }) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const org = StorageService.getOrganization();
  const bank = org.bankAccounts.find((b) => b.id === invoice.bankAccountId) || org.bankAccounts[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      const cleanCustomer = invoice.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Invoice_${invoice.invoiceNumber}_${cleanCustomer}.pdf`;
      await exportElementToPdf({
        elementId: 'printable-invoice',
        filename,
        onProgress: setIsExportingPdf,
      });
    } catch (err: any) {
      alert('Gagal mengekspor dokumen ke PDF: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  const isPaid = invoice.status === 'paid';
  const isPartiallyPaid = invoice.status === 'partially_paid';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Kembali ke Daftar
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md min-w-[140px]"
          >
            {isExportingPdf ? 'Membuat PDF...' : 'Print to PDF'}
          </Button>
        </div>
      </div>

      {/* Printable Invoice Document Container */}
      <div
        id="printable-invoice"
        className="printable-document relative bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm text-slate-800 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Paid Stamp Watermark */}
        {isPaid && (
          <div className="absolute top-1/3 right-12 border-4 border-emerald-600/30 text-emerald-600/30 font-black text-6xl tracking-widest uppercase px-6 py-2 rounded-xl rotate-[-15deg] pointer-events-none select-none print:border-emerald-600/40 print:text-emerald-600/40">
            LUNAS
          </div>
        )}

        {/* 1. Header / Kop Surat */}
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
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg print:bg-blue-600 print:text-white shrink-0">
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
              Telp: {org.phone} | Email: {org.email}
            </p>
            <p className="text-xs text-slate-600">
              NPWP Perusahaan: <span className="font-mono font-medium">{org.npwp}</span>
            </p>
          </div>

          {/* Invoice Document Title & Details */}
          <div className="sm:text-right space-y-1 shrink-0">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
              INVOICE / FAKTUR
            </h2>
            <p className="text-sm font-mono font-bold text-blue-700 bg-blue-50 inline-block px-2.5 py-0.5 rounded border border-blue-200 print:border-blue-300">
              {invoice.invoiceNumber}
            </p>
            <div className="text-xs space-y-1 text-slate-600 pt-2">
              <p>
                Tanggal Terbit: <strong className="text-slate-900">{formatIndoDate(invoice.issueDate)}</strong>
              </p>
              <p>
                Jatuh Tempo: <strong className="text-slate-900">{formatIndoDate(invoice.dueDate)}</strong>
              </p>
              {invoice.poNumber && (
                <p>
                  No. PO / Ref: <strong className="text-slate-900 font-mono">{invoice.poNumber}</strong>
                </p>
              )}
              {invoice.paymentTerms && (
                <p>
                  Syarat Bayar: <strong className="text-slate-900">{invoice.paymentTerms}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Customer / Bill-To Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 avoid-page-break print:bg-slate-50/50 print:border-slate-300">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              DITUJUKAN KEPADA (BILL TO):
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-1">{invoice.customerName}</h3>
            <p className="text-xs text-slate-700 font-medium">{invoice.customerCompanyName}</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{invoice.customerAddress}</p>
            <p className="text-xs text-slate-600">
              NPWP: <span className="font-mono">{invoice.customerNpwp || '-'}</span>
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              INFORMASI KONTAK PIC:
            </span>
            <p className="text-xs font-semibold text-slate-900 mt-1">{invoice.customerPic}</p>
            <p className="text-xs text-slate-600">{invoice.customerEmail}</p>
            <p className="text-xs text-slate-600">{invoice.customerPhone}</p>
          </div>
        </div>

        {/* 3. Items Table */}
        <div className="overflow-x-auto my-6 avoid-page-break">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-y-2 border-slate-800 bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-4">Deskripsi Barang / Layanan</th>
                <th className="py-2.5 px-3 text-center w-16">Qty</th>
                <th className="py-2.5 px-3 text-left w-20">Satuan</th>
                <th className="py-2.5 px-4 text-right w-32">Harga Satuan</th>
                <th className="py-2.5 px-4 text-right w-36">Total (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {invoice.items.map((item, idx) => (
                <tr key={item.id} className="align-top">
                  <td className="py-3 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{item.description}</p>
                    {item.productCode && (
                      <p className="text-[10px] text-slate-400 font-mono">Kode: {item.productCode}</p>
                    )}
                    {item.discount > 0 && (
                      <p className="text-[10px] text-rose-600">
                        Diskon Item: -{formatRupiah(item.discount)}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-medium">{item.quantity}</td>
                  <td className="py-3 px-3 text-slate-600">{item.unit}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(item.unitPrice)}</td>
                  <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                    {formatRupiah(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Financial Calculations Summary */}
        <div className="totals-block grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 pt-4 border-t border-slate-200 avoid-page-break">
          {/* Terbilang & Notes */}
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs print:bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                TERBILANG:
              </span>
              <p className="font-medium text-slate-800 italic leading-relaxed">
                # {terbilang(invoice.grandTotal)} Rupiah #
              </p>
            </div>

            {invoice.notes && (
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-700 block mb-0.5">Catatan Penagihan:</span>
                <p className="leading-relaxed">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Numbers breakdown */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 py-1">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">{formatRupiah(invoice.subtotal)}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 py-1">
                <span>
                  Potongan Diskon {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}:
                </span>
                <span className="font-mono font-semibold">-{formatRupiah(invoice.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 py-1">
              <span>Dasar Pengenaan Pajak (DPP):</span>
              <span className="font-mono font-semibold text-slate-900">
                {formatRupiah(invoice.taxableAmount)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600 py-1">
              <span>PPN ({invoice.taxRate}%):</span>
              <span className="font-mono font-semibold text-slate-900">+{formatRupiah(invoice.taxAmount)}</span>
            </div>

            {invoice.additionalCharges > 0 && (
              <div className="flex justify-between text-slate-600 py-1">
                <span>Biaya Lainnya / Pengiriman:</span>
                <span className="font-mono font-semibold text-slate-900">
                  +{formatRupiah(invoice.additionalCharges)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-slate-900 py-2 border-t-2 border-slate-900">
              <span>TOTAL TAGIHAN:</span>
              <span className="font-mono text-blue-700 text-lg">{formatRupiah(invoice.grandTotal)}</span>
            </div>

            {invoice.paidAmount > 0 && (
              <>
                <div className="flex justify-between text-emerald-600 py-1">
                  <span>Telah Dibayar:</span>
                  <span className="font-mono font-semibold">-{formatRupiah(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold py-1 border-t border-slate-200">
                  <span>SISA SALDO PIUTANG:</span>
                  <span className="font-mono">{formatRupiah(invoice.outstandingAmount)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 5. Bank Account & Signature Footer */}
        <div className="signature-block grid grid-cols-1 sm:grid-cols-2 gap-8 my-8 pt-6 border-t-2 border-slate-200 text-xs avoid-page-break">
          {/* Bank Instructions */}
          {bank && (
            <div className="bank-instruction-block p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 print:bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                INSTRUKSI PEMBAYARAN TRANSFER BANK
              </span>
              <p className="font-bold text-slate-900">{bank.bankName}</p>
              <p className="font-mono font-bold text-base text-blue-700 tracking-wider">
                {bank.accountNumber}
              </p>
              <p className="text-slate-700">Atas Nama: <strong>{bank.accountHolder}</strong></p>
              {bank.branch && <p className="text-slate-500 text-[11px]">Kantor Cabang: {bank.branch}</p>}
            </div>
          )}

          {/* Signature Box */}
          <div className="text-center sm:text-right flex flex-col justify-between items-center sm:items-end">
            <p className="text-xs text-slate-600">
              {org.city}, {formatIndoDate(invoice.issueDate)}
            </p>
            <p className="text-xs font-bold text-slate-900 uppercase mt-1">{org.name}</p>

            {/* Signature space */}
            <div className="h-20 flex items-center justify-center my-1">
              {org.signatureImage ? (
                <img
                  src={org.signatureImage}
                  alt="Tanda Tangan & Cap Resmi"
                  className="max-h-18 max-w-[180px] object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="border border-dashed border-slate-300 rounded px-4 py-2 text-[10px] text-slate-400">
                  [ Tanda Tangan & Cap Resmi ]
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900 underline uppercase">
                {org.directorName || 'Finance & Accounting Manager'}
              </p>
              <p className="text-[10px] text-slate-500">Finance & Billing Department</p>
            </div>
          </div>
        </div>

        {/* Document Footer Verification */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4 mt-6 print:border-slate-200">
          Dokumen ini digenerate secara digital oleh sistem BillingFlow SaaS Enterprise. Sah dan mengikat secara hukum.
        </div>
      </div>
    </div>
  );
};
