import React, { useState, useEffect } from 'react';
import { Invoice, Payment, BillingLetter } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate, getInvoiceStatusBadge, printElement } from '../../lib/utils';
import { exportElementToPdf } from '../../lib/pdfExport';
import { InvoicePrintView } from './InvoicePrintView';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  FileText,
  CreditCard,
  Mail,
  Printer,
  Download,
  Loader2,
  Edit2,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  History,
  ExternalLink,
  MessageCircle,
  Share2,
} from 'lucide-react';

export interface InvoiceDetailViewProps {
  invoiceId: string;
  onBack: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onCreateLetter: (invoice: Invoice) => void;
  onViewLetter: (letterId: string) => void;
  onInvoiceDeleted: () => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoiceId,
  onBack,
  onEditInvoice,
  onRecordPayment,
  onCreateLetter,
  onViewLetter,
  onInvoiceDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'payments' | 'letters' | 'audit'>('preview');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const invoice = StorageService.getInvoices().find((i) => i.id === invoiceId);
  const payments = StorageService.getPayments().filter((p) => p.invoiceId === invoiceId);
  const letters = StorageService.getBillingLetters().filter((l) => l.invoiceId === invoiceId);
  const auditLogs = StorageService.getAuditLogs().filter(
    (a) => (a.module === 'invoices' && a.recordId === invoiceId) || a.entityId === invoiceId
  );

  if (!invoice) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">Invoice tidak ditemukan atau telah dihapus.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="mt-4">
          Kembali ke Daftar Invoice
        </Button>
      </div>
    );
  }

  const badge = getInvoiceStatusBadge(invoice.status);
  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';

  const handleUpdateStatus = (newStatus: Invoice['status']) => {
    try {
      StorageService.updateInvoiceStatus(invoice.id, newStatus);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  const handleDeleteInvoice = () => {
    try {
      StorageService.deleteInvoice(invoice.id);
      setIsDeleteDialogOpen(false);
      onInvoiceDeleted();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus invoice');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Yth. ${invoice.customerName},\nBerikut kami sampaikan rincian Faktur/Invoice No. ${invoice.invoiceNumber} sebesar ${formatRupiah(invoice.grandTotal)} dengan jatuh tempo pada ${formatIndoDate(invoice.dueDate)}.\nSisa tagihan: ${formatRupiah(invoice.outstandingAmount)}.\nMohon dapat melakukan konfirmasi setelah transfer dilakukan. Terima kasih.`;
    const url = `https://wa.me/${invoice.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleExportPdf = async () => {
    const doExport = async () => {
      try {
        const cleanCustomer = invoice.customerName.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Invoice_${invoice.invoiceNumber}_${cleanCustomer}.pdf`;
        await exportElementToPdf({
          elementId: 'printable-invoice',
          filename,
          onProgress: setIsExportingPdf,
        });
      } catch (err: any) {
        alert('Gagal mengekspor PDF: ' + (err.message || 'Terjadi kesalahan'));
      }
    };

    if (activeTab !== 'preview') {
      setActiveTab('preview');
      setTimeout(doExport, 150);
    } else {
      await doExport();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Info & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="p-2 h-9 w-9 rounded-xl shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 font-mono">
                {invoice.invoiceNumber}
              </h2>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pelanggan: <strong className="text-slate-800">{invoice.customerName}</strong> ({invoice.customerCompanyName})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab !== 'preview') {
                setActiveTab('preview');
                setTimeout(() => printElement('printable-invoice', `Invoice ${invoice.invoiceNumber}`), 100);
              } else {
                printElement('printable-invoice', `Invoice ${invoice.invoiceNumber}`);
              }
            }}
            leftIcon={<Printer className="w-4 h-4 text-slate-700" />}
            className="text-slate-700 hover:bg-slate-50 font-medium"
          >
            Cetak (Print)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            leftIcon={
              isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Download className="w-4 h-4 text-blue-600" />
              )
            }
            className="text-slate-700 hover:bg-blue-50 hover:border-blue-300 font-medium"
          >
            {isExportingPdf ? 'Mengekspor...' : 'Unduh PDF'}
          </Button>

          {!isPaid && invoice.status !== 'cancelled' && (
            <Button
              size="sm"
              onClick={() => onRecordPayment(invoice)}
              leftIcon={<CreditCard className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs"
            >
              Catat Pembayaran
            </Button>
          )}

          {(isOverdue || invoice.outstandingAmount > 0) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCreateLetter(invoice)}
              leftIcon={<Mail className="w-4 h-4" />}
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              Surat Tagihan
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleShareWhatsApp}
            leftIcon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
            className="text-slate-700"
          >
            Kirim WA
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditInvoice(invoice)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('preview')}
          className={`text-xs px-4 py-2.5 font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'preview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Format Cetak Faktur (Preview)
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`text-xs px-4 py-2.5 font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Riwayat Pembayaran ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('letters')}
          className={`text-xs px-4 py-2.5 font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'letters'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          Surat Tagihan ({letters.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`text-xs px-4 py-2.5 font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Log Aktivitas
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'preview' && (
        <InvoicePrintView invoice={invoice} onBack={onBack} />
      )}

      {activeTab === 'payments' && (
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Penerimaan Pembayaran untuk Invoice Ini
              </h3>
              <p className="text-xs text-slate-500">
                Total dibayar: <strong className="text-emerald-600">{formatRupiah(invoice.paidAmount)}</strong> dari{' '}
                <strong>{formatRupiah(invoice.grandTotal)}</strong> (Sisa: {formatRupiah(invoice.outstandingAmount)})
              </p>
            </div>
            {!isPaid && (
              <Button
                size="sm"
                onClick={() => onRecordPayment(invoice)}
                leftIcon={<CreditCard className="w-4 h-4" />}
              >
                + Catat Pembayaran Baru
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">No. Kuitansi</th>
                  <th className="py-3 px-4">Tanggal Pembayaran</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Referensi / No. Bukti</th>
                  <th className="py-3 px-4 text-right">Nominal Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Belum ada penerimaan pembayaran tercatat untuk invoice ini.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-600">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{formatIndoDate(p.paymentDate)}</td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-800">
                        {p.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{p.referenceNumber || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-emerald-700 text-sm">
                        {formatRupiah(p.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'letters' && (
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Surat Tagihan & Somasi Diterbitkan
              </h3>
              <p className="text-xs text-slate-500">
                Riwayat penerbitan surat peringatan (SP 1, SP 2, SP 3 / Somasi)
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => onCreateLetter(invoice)}
              leftIcon={<Mail className="w-4 h-4" />}
            >
              + Terbitkan Surat Tagihan
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">No. Surat</th>
                  <th className="py-3 px-4">Jenis Dokumen</th>
                  <th className="py-3 px-4">Tanggal Surat</th>
                  <th className="py-3 px-4">Batas Akhir Pelunasan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {letters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada surat tagihan yang diterbitkan untuk invoice ini.
                    </td>
                  </tr>
                ) : (
                  letters.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-amber-700">
                        {l.letterNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 uppercase text-[11px]">
                        {l.letterType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{formatIndoDate(l.letterDate)}</td>
                      <td className="py-3 px-4 text-rose-600 font-semibold">{formatIndoDate(l.paymentDeadline || l.extendedDueDate)}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="warning" size="sm">
                          {l.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewLetter(l.id)}
                          leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Buka Surat
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Jejak Rekam Dokumen (Audit Trail)</h3>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 mt-0.5">
                  <History className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{log.details || log.description}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    User: {log.userName} ({log.userRole})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteInvoice}
        title="Hapus Invoice"
        message={`Apakah Anda yakin ingin menghapus invoice ${invoice.invoiceNumber}? Seluruh pencatatan terkait akan disesuaikan.`}
        confirmText="Hapus Faktur"
      />
    </div>
  );
};
