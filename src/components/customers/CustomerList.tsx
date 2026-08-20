import React, { useState, useMemo } from 'react';
import { Customer } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CustomerModal } from './CustomerModal';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import {
  Users,
  Search,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  FilePlus,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';

export interface CustomerListProps {
  onCreateInvoiceForCustomer: (customer: Customer) => void;
  onViewInvoice: (id: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onCreateInvoiceForCustomer,
  onViewInvoice,
}) => {
  const [customers, setCustomers] = useState(StorageService.getCustomers());
  const [invoices, setInvoices] = useState(StorageService.getInvoices());
  const [payments, setPayments] = useState(StorageService.getPayments());

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'has_outstanding'>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);

  // Delete confirm
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const refreshData = () => {
    setCustomers(StorageService.getCustomers());
    setInvoices(StorageService.getInvoices());
    setPayments(StorageService.getPayments());
  };

  const filteredCustomers = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return customers.filter((c) => {
      const matchQuery =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.companyName || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.pic || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (filterStatus === 'active') return c.isActive;
      if (filterStatus === 'has_outstanding') return c.totalOutstanding > 0;
      return true;
    });
  }, [customers, searchQuery, filterStatus]);

  const handleExportCSV = () => {
    const data = filteredCustomers.map((c) => ({
      'Kode Pelanggan': c.code,
      'Nama Pelanggan': c.name,
      'Perusahaan': c.companyName,
      'NPWP': c.npwp || '-',
      'Email': c.email,
      'Telepon': c.phone,
      'PIC': c.pic,
      'Kota': c.city,
      'Provinsi': c.province,
      'Total Faktur': c.totalInvoiced,
      'Total Pembayaran': c.totalPaid,
      'Sisa Piutang': c.totalOutstanding,
      'Status': c.isActive ? 'Aktif' : 'Non-Aktif',
    }));
    exportToCSV(`Pelanggan_BillingFlow_${new Date().toISOString().split('T')[0]}`, data);
  };

  const handleDeleteConfirm = () => {
    if (!customerToDelete) return;
    try {
      StorageService.deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pelanggan');
    }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + c.totalOutstanding, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Customer Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage client profiles, contact points, tax numbers (NPWP), and cumulative balances
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
            onClick={() => {
              setCustomerToEdit(null);
              setIsFormOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            New Customer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Total Client Accounts
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight truncate">
              {customers.length}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums truncate">
            {customers.filter((c) => c.isActive).length} Active Business Entities
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Cumulative Invoiced
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight truncate" title={formatRupiah(customers.reduce((sum, c) => sum + c.totalInvoiced, 0))}>
              {formatRupiah(customers.reduce((sum, c) => sum + c.totalInvoiced, 0))}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">Historical billing total</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Total Receivables Due
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-amber-600 mt-1 tabular-nums tracking-tight truncate" title={formatRupiah(totalOutstanding)}>
              {formatRupiah(totalOutstanding)}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums truncate">
            {customers.filter((c) => c.totalOutstanding > 0).length} Clients with open balances
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search customer name, code, email, PIC, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active ({customers.filter((c) => c.isActive).length})
          </button>
          <button
            onClick={() => setFilterStatus('has_outstanding')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterStatus === 'has_outstanding'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            With Receivables ({customers.filter((c) => c.totalOutstanding > 0).length})
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3">Client Code & Name</th>
                <th className="px-6 py-3">PIC & Contacts</th>
                <th className="px-6 py-3">Location & NPWP</th>
                <th className="px-6 py-3 text-right">Invoiced</th>
                <th className="px-6 py-3 text-right">Receivables</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomerForDetail(c)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-mono text-xs font-semibold text-blue-600">{c.code}</p>
                      <p className="font-medium text-slate-900 text-xs">{c.name}</p>
                      {c.companyName !== c.name && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {c.companyName}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-xs">
                      <p className="font-medium text-slate-800">{c.pic}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5" /> {c.email}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" /> {c.phone}
                      </p>
                    </td>

                    <td className="px-6 py-3.5 text-xs">
                      <p className="text-slate-800">{c.city}, {c.province}</p>
                      {c.npwp ? (
                        <p className="text-[10px] text-slate-400 font-mono">NPWP: {c.npwp}</p>
                      ) : (
                        <p className="text-[10px] text-slate-300 italic">No NPWP</p>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-right text-xs font-medium text-slate-700">
                      {formatRupiah(c.totalInvoiced)}
                    </td>

                    <td className="px-6 py-3.5 text-right text-xs font-semibold">
                      {c.totalOutstanding > 0 ? (
                        <span className="text-amber-600">{formatRupiah(c.totalOutstanding)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Rp0</span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          c.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onCreateInvoiceForCustomer(c)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Create Invoice for Client"
                        >
                          <FilePlus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setSelectedCustomerForDetail(c)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="View Ledger Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setCustomerToEdit(c);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setCustomerToDelete(c)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customerToEdit={customerToEdit}
        onSuccess={() => {
          refreshData();
          setIsFormOpen(false);
        }}
      />

      {/* Customer Detail Drawer / Ledger */}
      {selectedCustomerForDetail && (
        <CustomerDetailDrawer
          customer={selectedCustomerForDetail}
          invoices={invoices.filter((i) => i.customerId === selectedCustomerForDetail.id)}
          payments={payments.filter((p) => p.customerId === selectedCustomerForDetail.id)}
          onClose={() => setSelectedCustomerForDetail(null)}
          onViewInvoice={onViewInvoice}
          onCreateInvoice={() => {
            onCreateInvoiceForCustomer(selectedCustomerForDetail);
            setSelectedCustomerForDetail(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!customerToDelete}
        title="Hapus Data Pelanggan"
        message={`Apakah Anda yakin ingin menghapus pelanggan ${customerToDelete?.name}? Tindakan ini tidak dapat dibatalkan jika pelanggan memiliki transaksi aktif.`}
        confirmText="Hapus Pelanggan"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
};
