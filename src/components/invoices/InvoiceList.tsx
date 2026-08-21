import React, { useState, useMemo } from 'react';
import { Invoice } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  Search,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  CreditCard,
  Mail,
  FileText,
} from 'lucide-react';

export interface InvoiceListProps {
  onViewInvoice: (id: string) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onCreateLetter: (invoice: Invoice) => void;
  onCreateNewInvoice: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  onViewInvoice,
  onEditInvoice,
  onRecordPayment,
  onCreateLetter,
  onCreateNewInvoice,
}) => {
  const [invoices, setInvoices] = useState(StorageService.getInvoices());
  const [customers, setCustomers] = useState(StorageService.getCustomers());

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const refreshData = () => {
    setInvoices(StorageService.getInvoices());
    setCustomers(StorageService.getCustomers());
  };

  const filteredInvoices = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchSearch =
        !q ||
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.customerName || '').toLowerCase().includes(q) ||
        (inv.customerCompanyName || '').toLowerCase().includes(q) ||
        (inv.poNumber && inv.poNumber.toLowerCase().includes(q)) ||
        (inv.referenceNumber && inv.referenceNumber.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (statusFilter !== 'all') {
        if (statusFilter === 'unpaid_group') {
          if (inv.status !== 'unpaid' && inv.status !== 'sent' && inv.status !== 'overdue') return false;
        } else if (inv.status !== statusFilter) {
          return false;
        }
      }

      if (customerFilter !== 'all' && inv.customerId !== customerFilter) return false;

      if (dateFrom && inv.issueDate < dateFrom) return false;
      if (dateTo && inv.issueDate > dateTo) return false;

      return true;
    });
  }, [invoices, searchQuery, statusFilter, customerFilter, dateFrom, dateTo]);

  const handleExportCSV = () => {
    const data = filteredInvoices.map((inv) => ({
      'No. Invoice': inv.invoiceNumber,
      'Pelanggan': inv.customerName,
      'Perusahaan': inv.customerCompanyName,
      'Tanggal Terbit': inv.issueDate,
      'Jatuh Tempo': inv.dueDate,
      'No. PO': inv.poNumber || '-',
      'Grand Total': inv.grandTotal,
      'Sudah Dibayar': inv.paidAmount,
      'Sisa Piutang': inv.outstandingAmount,
      'Status': inv.status,
    }));
    exportToCSV(`Daftar_Invoice_${new Date().toISOString().split('T')[0]}`, data);
  };

  const handleDeleteConfirm = () => {
    if (!invoiceToDelete) return;
    try {
      StorageService.deleteInvoice(invoiceToDelete.id);
      setInvoiceToDelete(null);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus invoice');
    }
  };

  const totalInvoicedInView = filteredInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalOutstandingInView = filteredInvoices.reduce((sum, i) => sum + i.outstandingAmount, 0);
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  const renderStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Paid</span>;
      case 'overdue':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">Overdue</span>;
      case 'partially_paid':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">Partial</span>;
      case 'sent':
        return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase">Sent</span>;
      case 'draft':
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase">Draft</span>;
      case 'unpaid':
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold uppercase">Pending</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Invoice & Billing Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage corporate billing documents, tracking, receivables, and payment reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={onCreateNewInvoice}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Total Invoices (Filtered)
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight truncate">
              {filteredInvoices.length}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums truncate">Value: {formatRupiah(totalInvoicedInView)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Outstanding Receivables
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-amber-600 mt-1 tabular-nums tracking-tight truncate" title={formatRupiah(totalOutstandingInView)}>
              {formatRupiah(totalOutstandingInView)}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">Pending collection from customers</p>
        </div>

        <div className={`rounded-xl border p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between ${
          overdueCount > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-white'
        }`}>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider truncate ${overdueCount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
              Overdue Invoices
            </p>
            <p className={`text-lg sm:text-xl xl:text-2xl font-bold mt-1 tabular-nums tracking-tight truncate ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {overdueCount} Documents
            </p>
          </div>
          <p className={`text-xs mt-1.5 truncate ${overdueCount > 0 ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>
            {overdueCount > 0 ? 'Immediate billing reminder required' : 'All accounts in good standing'}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'unpaid_group', label: 'Unpaid' },
            { id: 'overdue', label: 'Overdue', count: overdueCount },
            { id: 'paid', label: 'Paid' },
            { id: 'partially_paid', label: 'Partial' },
            { id: 'sent', label: 'Sent' },
            { id: 'draft', label: 'Draft' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Input filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search invoice number, PO, or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="From Date"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="To Date"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3">Invoice & PO</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Issue & Due Date</th>
                <th className="px-6 py-3 text-right">Grand Total</th>
                <th className="px-6 py-3 text-right">Balance Due</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No invoices matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isOverdue = inv.status === 'overdue';
                  const canPay = inv.status !== 'paid' && inv.status !== 'cancelled';

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onViewInvoice(inv.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3.5">
                        <p className="font-mono font-medium text-blue-600 text-xs">{inv.invoiceNumber}</p>
                        {inv.poNumber && (
                          <p className="text-[10px] text-slate-400 font-mono">PO: {inv.poNumber}</p>
                        )}
                      </td>

                      <td className="px-6 py-3.5">
                        <p className="font-medium text-slate-800 text-xs">{inv.customerName}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {inv.customerCompanyName}
                        </p>
                      </td>

                      <td className="px-6 py-3.5 text-xs">
                        <p className="text-slate-800">{formatIndoDate(inv.issueDate)}</p>
                        <p className={`text-[10px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          Due: {formatIndoDate(inv.dueDate)}
                        </p>
                      </td>

                      <td className="px-6 py-3.5 text-right font-semibold text-slate-900 text-xs">
                        {formatRupiah(inv.grandTotal)}
                      </td>

                      <td className="px-6 py-3.5 text-right font-semibold text-xs">
                        {inv.outstandingAmount > 0 ? (
                          <span className={isOverdue ? 'text-rose-600' : 'text-amber-600'}>
                            {formatRupiah(inv.outstandingAmount)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Settled</span>
                        )}
                      </td>

                      <td className="px-6 py-3.5 text-center">
                        {renderStatusBadge(inv.status)}
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onViewInvoice(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="View & Print Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canPay && (
                            <button
                              onClick={() => onRecordPayment(inv)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                              title="Record Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {(isOverdue || inv.outstandingAmount > 0) && (
                            <button
                              onClick={() => onCreateLetter(inv)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                              title="Issue Billing Letter"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onEditInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setInvoiceToDelete(inv)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!invoiceToDelete}
        title="Hapus Dokumen Invoice"
        message={`Apakah Anda yakin ingin menghapus faktur invoice ${invoiceToDelete?.invoiceNumber} (${invoiceToDelete?.customerName})? Seluruh riwayat pembayaran dan surat tagihan terkait akan ikut dihapus.`}
        confirmText="Hapus Faktur"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setInvoiceToDelete(null)}
        onCancel={() => setInvoiceToDelete(null)}
      />
    </div>
  );
};
