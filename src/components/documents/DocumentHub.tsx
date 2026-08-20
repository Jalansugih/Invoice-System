import React, { useState, useMemo } from 'react';
import { StorageService } from '../../lib/storage';
import { Payment } from '../../types';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import { Input } from '../ui/Input';
import {
  FolderOpen,
  FileText,
  Mail,
  CreditCard,
  Search,
  Eye,
} from 'lucide-react';

export interface DocumentHubProps {
  onViewInvoice: (id: string) => void;
  onViewLetter: (id: string) => void;
  onViewReceipt: (payment: Payment) => void;
}

export const DocumentHub: React.FC<DocumentHubProps> = ({
  onViewInvoice,
  onViewLetter,
  onViewReceipt,
}) => {
  const [invoices] = useState(StorageService.getInvoices());
  const [letters] = useState(StorageService.getBillingLetters());
  const [payments] = useState(StorageService.getPayments());

  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<'all' | 'invoice' | 'letter' | 'receipt'>('all');

  const allDocuments = useMemo(() => {
    const list: Array<{
      id: string;
      docNumber: string;
      docType: 'invoice' | 'letter' | 'receipt';
      title: string;
      customerName: string;
      date: string;
      amount?: number;
      status: string;
      raw: any;
    }> = [];

    invoices.forEach((inv) => {
      list.push({
        id: inv.id,
        docNumber: inv.invoiceNumber,
        docType: 'invoice',
        title: `Invoice / Faktur Penagihan`,
        customerName: inv.customerName,
        date: inv.issueDate,
        amount: inv.grandTotal,
        status: inv.status,
        raw: inv,
      });
    });

    letters.forEach((letDoc) => {
      list.push({
        id: letDoc.id,
        docNumber: letDoc.letterNumber,
        docType: 'letter',
        title: `${letDoc.subject}`,
        customerName: letDoc.customerName,
        date: letDoc.letterDate,
        amount: letDoc.outstandingAmount,
        status: letDoc.status,
        raw: letDoc,
      });
    });

    payments.forEach((pay) => {
      list.push({
        id: pay.id,
        docNumber: pay.receiptNumber,
        docType: 'receipt',
        title: `Kuitansi Pembayaran Faktur ${pay.invoiceNumber}`,
        customerName: pay.customerName,
        date: pay.paymentDate,
        amount: pay.amount,
        status: 'verified',
        raw: pay,
      });
    });

    return list.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [invoices, letters, payments]);

  const filteredDocs = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return allDocuments.filter((doc) => {
      const matchSearch =
        !q ||
        (doc.docNumber || '').toLowerCase().includes(q) ||
        (doc.customerName || '').toLowerCase().includes(q) ||
        (doc.title || '').toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (docTypeFilter !== 'all' && docTypeFilter !== doc.docType) return false;
      return true;
    });
  }, [allDocuments, searchQuery, docTypeFilter]);

  const handleOpenDoc = (doc: typeof allDocuments[0]) => {
    if (doc.docType === 'invoice') onViewInvoice(doc.id);
    else if (doc.docType === 'letter') onViewLetter(doc.id);
    else if (doc.docType === 'receipt') onViewReceipt(doc.raw);
  };

  const getDocBadge = (type: string) => {
    switch (type) {
      case 'invoice':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">Invoice</span>;
      case 'letter':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">Letter</span>;
      case 'receipt':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">Receipt</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            Document Archive Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Central repository of all financial documents (Invoices, Official Receipts, & Billing Letters)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Total Invoices Archived
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight truncate">
              {invoices.length}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">Billing invoices generated</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Total Official Receipts
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-emerald-600 mt-1 tabular-nums tracking-tight truncate">
              {payments.length}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">Payment confirmation vouchers</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Billing Letters Issued
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-amber-600 mt-1 tabular-nums tracking-tight truncate">
              {letters.length}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">SP-1 to Somasi legal documents</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search document number, subject, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Documents', count: allDocuments.length },
            { id: 'invoice', label: 'Invoices', count: invoices.length },
            { id: 'receipt', label: 'Receipts', count: payments.length },
            { id: 'letter', label: 'Letters', count: letters.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDocTypeFilter(tab.id as any)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                docTypeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-80">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3">Document Number</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Title & Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No documents found in archive.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr
                    key={`${doc.docType}-${doc.id}`}
                    onClick={() => handleOpenDoc(doc)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-blue-600">
                      {doc.docNumber}
                    </td>

                    <td className="px-6 py-3.5">
                      {getDocBadge(doc.docType)}
                    </td>

                    <td className="px-6 py-3.5 text-xs">
                      <p className="font-semibold text-slate-900 line-clamp-1">{doc.title}</p>
                      <p className="text-[10px] text-slate-500">{doc.customerName}</p>
                    </td>

                    <td className="px-6 py-3.5 text-xs text-slate-700">
                      {formatIndoDate(doc.date)}
                    </td>

                    <td className="px-6 py-3.5 text-right font-semibold text-slate-900 text-xs">
                      {doc.amount !== undefined ? formatRupiah(doc.amount) : '-'}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDoc(doc);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
