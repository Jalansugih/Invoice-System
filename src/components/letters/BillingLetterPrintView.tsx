import React, { useState } from 'react';
import { BillingLetter } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate, terbilang } from '../../lib/utils';
import { exportElementToPdf } from '../../lib/pdfExport';
import { Button } from '../ui/Button';
import { Printer, ArrowLeft, Download, Mail, Building2, Loader2 } from 'lucide-react';

export interface BillingLetterPrintViewProps {
  letter: BillingLetter;
  onBack: () => void;
}

export const BillingLetterPrintView: React.FC<BillingLetterPrintViewProps> = ({ letter, onBack }) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const org = StorageService.getOrganization();
  const invoice = StorageService.getInvoices().find((i) => i.id === letter.invoiceId);
  const bank = org.bankAccounts[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      const cleanCustomer = letter.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `SuratTagihan_${letter.letterNumber.replace(/\//g, '-')}_${cleanCustomer}.pdf`;
      await exportElementToPdf({
        elementId: 'printable-letter',
        filename,
        onProgress: setIsExportingPdf,
      });
    } catch (err: any) {
      alert('Gagal mengekspor surat ke PDF: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  const totalDue = letter.outstandingAmount + letter.penaltiesAmount;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Kembali ke Daftar Surat
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
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md min-w-[140px]"
          >
            {isExportingPdf ? 'Membuat PDF...' : 'Print to PDF'}
          </Button>
        </div>
      </div>

      {/* Official Indonesian Corporate Letter Document */}
      <div
        id="printable-letter"
        className="printable-document bg-white p-10 sm:p-14 rounded-2xl border border-slate-200 shadow-sm text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0 font-serif leading-relaxed text-sm"
      >
        {/* Kop Surat Resmi */}
        <div className="flex items-center justify-between border-b-4 border-double border-slate-900 pb-5 mb-8 text-left font-sans avoid-page-break">
          <div className="flex items-center gap-4">
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt={org.name}
                className="h-16 w-auto max-w-[180px] object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-700 text-white font-bold text-2xl shrink-0 print:bg-blue-700 print:text-white">
                {org.name ? org.name.slice(0, 2).toUpperCase() : 'BF'}
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                {org.name}
              </h1>
              {org.tagline && <p className="text-xs text-slate-600 font-semibold">{org.tagline}</p>}
              <p className="text-xs text-slate-600 mt-1">
                {org.address}, {org.city}, {org.province} {org.postalCode}
              </p>
              <p className="text-xs text-slate-600">
                Telp: {org.phone} | Email: {org.email} | NPWP: {org.npwp}
              </p>
            </div>
          </div>
        </div>

        {/* Letter Reference Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 font-sans text-xs avoid-page-break">
          <div className="space-y-1">
            <p>
              <span className="inline-block w-20 text-slate-600">Nomor</span>: <strong className="font-mono">{letter.letterNumber}</strong>
            </p>
            <p>
              <span className="inline-block w-20 text-slate-600">Lampiran</span>: 1 (Satu) Berkas Salinan Faktur
            </p>
            <p>
              <span className="inline-block w-20 text-slate-600">Perihal</span>:{' '}
              <strong className="text-slate-900 underline">{letter.subject}</strong>
            </p>
          </div>

          <div className="sm:text-right">
            <p>{org.city}, {formatIndoDate(letter.letterDate)}</p>
          </div>
        </div>

        {/* Destination Address */}
        <div className="my-6 space-y-1 font-sans text-xs avoid-page-break">
          <p>Kepada Yth.</p>
          <p className="font-bold text-sm text-slate-900">Direksi / Pimpinan Perusahaan</p>
          <p className="font-bold text-slate-900">{letter.customerName}</p>
          <p className="text-slate-700">{letter.customerAddress}</p>
          <p className="text-slate-600 mt-1">
            Up. <strong className="text-slate-800">{letter.customerPic}</strong> (Finance & Procurement Dept)
          </p>
        </div>

        {/* Letter Body */}
        <div className="my-6 space-y-4 whitespace-pre-line text-justify text-slate-800 text-[13px] leading-relaxed avoid-page-break">
          {letter.bodyText}
        </div>

        {/* Outstanding Invoice Summary Table */}
        <div className="my-6 font-sans avoid-page-break">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">No. Faktur / Invoice</th>
                  <th className="py-2.5 px-3">Tanggal Terbit</th>
                  <th className="py-2.5 px-3">Jatuh Tempo</th>
                  <th className="py-2.5 px-3 text-right">Nilai Pokok Tertunggak</th>
                  {letter.penaltiesAmount > 0 && (
                    <th className="py-2.5 px-3 text-right">Biaya / Denda</th>
                  )}
                  <th className="py-2.5 px-3 text-right">Total Kewajiban</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{letter.invoiceNumber}</td>
                  <td className="py-2.5 px-3">{formatIndoDate(letter.issueDate)}</td>
                  <td className="py-2.5 px-3 font-bold text-rose-700">{formatIndoDate(letter.dueDate)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatRupiah(letter.outstandingAmount)}</td>
                  {letter.penaltiesAmount > 0 && (
                    <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                      {formatRupiah(letter.penaltiesAmount)}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(totalDue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-600 italic mt-2">
            Terbilang: <strong># {terbilang(totalDue)} Rupiah #</strong>
          </p>
        </div>

        {/* Bank Transfer Instructions */}
        {bank && (
          <div className="bank-instruction-block my-6 p-4 rounded-xl border border-slate-300 bg-slate-50 font-sans text-xs space-y-1 avoid-page-break print:bg-slate-50/50">
            <p className="font-bold text-slate-900">Pembayaran dapat ditransfer melalui rekening resmi:</p>
            <p className="text-slate-700">Bank: <strong>{bank.bankName}</strong></p>
            <p className="text-slate-700">No. Rekening: <strong className="font-mono text-blue-700 font-bold">{bank.accountNumber}</strong></p>
            <p className="text-slate-700">Atas Nama: <strong>{bank.accountHolder}</strong></p>
          </div>
        )}

        {/* Closing and Signature */}
        <div className="signature-block grid grid-cols-1 sm:grid-cols-2 gap-8 my-10 pt-4 font-sans text-xs avoid-page-break">
          <div>
            <p className="text-[11px] text-slate-500">
              Tembusan (Cc):<br />
              1. Arsip Finance & Accounting<br />
              2. Legal & Compliance Division
            </p>
          </div>

          <div className="text-center sm:text-right flex flex-col justify-between items-center sm:items-end">
            <p className="text-slate-700">Hormat kami,</p>
            <p className="font-bold text-slate-900 uppercase mt-0.5">{org.name}</p>

            {/* Space for official signature & company stamp */}
            <div className="h-20 flex items-center justify-center my-1">
              {org.signatureImage ? (
                <img
                  src={org.signatureImage}
                  alt="Tanda Tangan & Cap Resmi Perusahaan"
                  className="max-h-18 max-w-[180px] object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="border border-dashed border-slate-300 rounded px-4 py-2 text-[10px] text-slate-400">
                  [ Tanda Tangan & Cap Resmi Perusahaan ]
                </div>
              )}
            </div>

            <div>
              <p className="font-bold text-slate-900 underline uppercase">
                {org.directorName || 'Finance & Accounting Director'}
              </p>
              <p className="text-[11px] text-slate-500">Head of Finance & Billing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
