import React, { useMemo, useState } from 'react';
import { CreditCard, ExternalLink, Link2, Copy, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { Invoice } from '../../types';
import { PaymentGatewayService } from '../../lib/paymentGatewayService';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

export const PaymentGatewayView: React.FC = () => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const config = PaymentGatewayService.getConfig();
  const invoices = useMemo(
    () => StorageService.getInvoices().filter(i => i.outstandingAmount > 0 && i.status !== 'cancelled'),
    []
  );
  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  const createLink = async () => {
    if (!selectedInvoice) return;
    setLoading(true); setError(''); setPaymentUrl(''); setTransactionId('');
    try {
      const result = await PaymentGatewayService.createPaymentLink(selectedInvoice);
      setPaymentUrl(result.paymentUrl);
      setTransactionId(result.transactionId || '');
    } catch (e: any) {
      setError(e?.message || 'Gagal membuat link pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!paymentUrl) return;
    await navigator.clipboard?.writeText(paymentUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
          <CreditCard className="w-4 h-4" /> Penerimaan Online
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Payment Gateway</h2>
        <p className="text-sm text-slate-500 mt-1">
          Buat link pembayaran dari invoice yang masih memiliki piutang. Status pembayaran tetap masuk ke accounting melalui transaksi pembayaran.
        </p>
      </div>

      <div className={`rounded-xl border p-4 ${config.enabled ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-start gap-3">
          {config.enabled ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />}
          <div>
            <div className="font-semibold text-slate-900">
              {config.enabled ? `Gateway ${config.provider} siap dipanggil` : 'Gateway belum dikonfigurasi'}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {config.enabled
                ? 'Secret key tetap berada di backend/Edge Function. Frontend hanya menerima payment URL.'
                : 'Tambahkan VITE_PAYMENT_GATEWAY_API_URL pada environment aplikasi. Jangan pernah menaruh Server Key gateway di frontend.'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <Select
            label="Invoice yang akan dibayar"
            value={selectedInvoiceId}
            onChange={e => setSelectedInvoiceId(e.target.value)}
          >
            <option value="">Pilih invoice...</option>
            {invoices.map((invoice: Invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoiceNumber} — {invoice.customerName} — {formatRupiah(invoice.outstandingAmount)}
              </option>
            ))}
          </Select>
        </div>

        {selectedInvoice && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm">
            <div><div className="text-xs text-slate-500">Invoice</div><div className="font-semibold">{selectedInvoice.invoiceNumber}</div></div>
            <div><div className="text-xs text-slate-500">Jatuh tempo</div><div className="font-semibold">{formatIndoDate(selectedInvoice.dueDate)}</div></div>
            <div><div className="text-xs text-slate-500">Sisa piutang</div><div className="font-bold text-amber-600">{formatRupiah(selectedInvoice.outstandingAmount)}</div></div>
          </div>
        )}

        <Button onClick={createLink} disabled={!selectedInvoice || loading || !config.enabled}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
          {loading ? 'Membuat Link...' : 'Buat Link Pembayaran'}
        </Button>

        {error && <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</div>}

        {paymentUrl && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
            <div className="font-semibold text-slate-900">Link pembayaran siap dibagikan</div>
            <div className="flex gap-2">
              <input readOnly value={paymentUrl} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
              <Button variant="outline" onClick={copyLink}>
                {copied ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Tersalin' : 'Salin'}
              </Button>
              <a href={paymentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <ExternalLink className="w-4 h-4 mr-1" /> Buka
              </a>
            </div>
            {transactionId && <div className="text-xs text-slate-500">ID transaksi gateway: {transactionId}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
