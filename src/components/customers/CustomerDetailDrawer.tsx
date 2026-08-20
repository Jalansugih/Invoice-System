import React from 'react';
import { Customer, Invoice, Payment } from '../../types';
import { formatRupiah, formatIndoDate, getInvoiceStatusBadge } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Plus,
  Edit2,
  User,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export interface CustomerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  invoices: Invoice[];
  payments: Payment[];
  onEditCustomer: (customer: Customer) => void;
  onCreateInvoice: (customer: Customer) => void;
  onViewInvoice: (id: string) => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  isOpen,
  onClose,
  customer,
  invoices,
  payments,
  onEditCustomer,
  onCreateInvoice,
  onViewInvoice,
}) => {
  if (!customer) return null;

  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);
  const overdueInvoices = customerInvoices.filter((i) => i.status === 'overdue');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{customer.name}</h3>
            <p className="text-xs text-slate-500 font-mono">{customer.code}</p>
          </div>
        </div>
      }
      subtitle="Detail profil pelanggan, riwayat penagihan, dan mutasi pembayaran"
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditCustomer(customer)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit Profil
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onCreateInvoice(customer);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Buat Invoice Baru
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Tagihan
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {formatRupiah(customer.totalInvoiced)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{customerInvoices.length} Faktur Diterbitkan</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Total Pembayaran
            </p>
            <p className="text-xl font-bold text-emerald-800 mt-1">
              {formatRupiah(customer.totalPaid)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">{customerPayments.length} Transaksi Diterima</p>
          </div>

          <div className={`rounded-xl border p-4 ${
            customer.totalOutstanding > 0
              ? 'border-amber-300 bg-amber-50/50'
              : 'border-slate-200 bg-slate-50/50'
          }`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Sisa Saldo Piutang
            </p>
            <p className={`text-xl font-bold mt-1 ${customer.totalOutstanding > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
              {formatRupiah(customer.totalOutstanding)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {customer.totalOutstanding === 0 ? 'Tidak ada tunggakan' : `${overdueInvoices.length} Faktur Jatuh Tempo`}
            </p>
          </div>
        </div>

        {/* Customer Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white border border-slate-200 rounded-xl p-4">
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1">
              Informasi Kontak & Legal
            </h4>
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Email: <strong className="text-slate-800">{customer.email}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Telepon: <strong className="text-slate-800">{customer.phone}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>NPWP: <strong className="text-slate-800">{customer.npwp || 'Tidak Dilampirkan'}</strong></span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1">
              Person In Charge (PIC) & Alamat
            </h4>
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>PIC: <strong className="text-slate-800">{customer.pic}</strong> {customer.picPhone && `(${customer.picPhone})`}</span>
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {customer.address}, {customer.city}, {customer.province} {customer.postalCode}
              </span>
            </div>
            {customer.notes && (
              <p className="text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-600">
                <strong>Catatan:</strong> {customer.notes}
              </p>
            )}
          </div>
        </div>

        {/* Invoices List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Daftar Faktur / Invoice Pelanggan ({customerInvoices.length})
            </h4>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No. Invoice</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Jatuh Tempo</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Sisa Piutang</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Belum ada invoice untuk pelanggan ini.
                    </td>
                  </tr>
                ) : (
                  customerInvoices.map((inv) => {
                    const badge = getInvoiceStatusBadge(inv.status);
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => {
                          onClose();
                          onViewInvoice(inv.id);
                        }}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 font-semibold text-blue-600 font-mono">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{formatIndoDate(inv.issueDate)}</td>
                        <td className="py-2.5 px-3 text-slate-600">{formatIndoDate(inv.dueDate)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatRupiah(inv.grandTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {inv.outstandingAmount > 0 ? (
                            <span className="text-amber-700">{formatRupiah(inv.outstandingAmount)}</span>
                          ) : (
                            <span className="text-emerald-600">Lunas</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Riwayat Pembayaran Diterima ({customerPayments.length})
            </h4>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No. Kuitansi</th>
                  <th className="py-2.5 px-3">Tanggal Bayar</th>
                  <th className="py-2.5 px-3">Faktur Terkait</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Belum ada pembayaran tercatat.
                    </td>
                  </tr>
                ) : (
                  customerPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-emerald-600 font-mono">
                        {p.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{formatIndoDate(p.paymentDate)}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-600">{p.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600 capitalize">
                        {p.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {formatRupiah(p.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};
