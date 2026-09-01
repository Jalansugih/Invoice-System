import React, { useState, useMemo } from 'react';
import { StorageService } from '../../lib/storage';
import { DocumentItem, DocumentType, Payment } from '../../types';
import { formatRupiah, formatIndoDate } from '../../lib/utils';
import { Input } from '../ui/Input';
import { FolderOpen, FileText, Search, Eye, Receipt, Truck, ClipboardCheck, FileSignature, FileMinus, FilePlus2 } from 'lucide-react';

export interface DocumentHubProps {
  onViewInvoice: (id: string) => void;
  onViewLetter: (id: string) => void;
  onViewReceipt: (payment: Payment) => void;
}

type HubDocument = DocumentItem & { raw?: any; actionType?: 'invoice' | 'letter' | 'receipt' };

const TYPE_LABELS: Record<DocumentType, string> = {
  invoice: 'Invoice',
  billing_letter: 'Surat Tagihan',
  payment_receipt: 'Kuitansi',
  quotation: 'Quotation',
  purchase_order: 'PO',
  sales_order: 'Sales Order',
  delivery_order: 'Surat Jalan',
  bast: 'BAST',
  credit_note: 'Credit Note',
  debit_note: 'Debit Note',
  other: 'Dokumen Lain',
};

const TYPE_ICONS: Record<DocumentType, React.ReactNode> = {
  invoice: <FileText className="w-4 h-4" />,
  billing_letter: <FileSignature className="w-4 h-4" />,
  payment_receipt: <Receipt className="w-4 h-4" />,
  quotation: <FileText className="w-4 h-4" />,
  purchase_order: <FileText className="w-4 h-4" />,
  sales_order: <FileText className="w-4 h-4" />,
  delivery_order: <Truck className="w-4 h-4" />,
  bast: <ClipboardCheck className="w-4 h-4" />,
  credit_note: <FileMinus className="w-4 h-4" />,
  debit_note: <FilePlus2 className="w-4 h-4" />,
  other: <FileText className="w-4 h-4" />,
};

export const DocumentHub: React.FC<DocumentHubProps> = ({ onViewInvoice, onViewLetter, onViewReceipt }) => {
  const [invoices] = useState(StorageService.getInvoices());
  const [letters] = useState(StorageService.getBillingLetters());
  const [payments] = useState(StorageService.getPayments());
  const [storedDocuments] = useState(StorageService.getDocuments());
  const [businessDocuments] = useState(StorageService.getBusinessDocuments());
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<DocumentType | 'all'>('all');

  const allDocuments = useMemo<HubDocument[]>(() => {
    const generated: HubDocument[] = [
      ...invoices.map((inv) => ({
        id: inv.id, title: 'Faktur Penagihan', documentType: 'invoice' as const,
        documentNumber: inv.invoiceNumber, customerId: inv.customerId, customerName: inv.customerName,
        referenceId: inv.id, amount: inv.grandTotal, date: inv.issueDate, status: inv.status,
        createdAt: inv.createdAt, raw: inv, actionType: 'invoice' as const,
      })),
      ...letters.map((letter) => ({
        id: letter.id, title: letter.subject, documentType: 'billing_letter' as const,
        documentNumber: letter.letterNumber, customerId: letter.customerId, customerName: letter.customerName,
        referenceId: letter.id, amount: letter.outstandingAmount, date: letter.letterDate, status: letter.status,
        createdAt: letter.createdAt, raw: letter, actionType: 'letter' as const,
      })),
      ...businessDocuments.map((doc) => ({
        id: doc.id, title: doc.title, documentType: doc.documentType as DocumentType,
        documentNumber: doc.documentNumber, customerId: doc.customerId, customerName: doc.customerName,
        referenceId: doc.id, amount: doc.grandTotal, date: doc.date, status: doc.status,
        createdAt: doc.createdAt, raw: doc,
      })),
      ...payments.map((pay) => ({
        id: pay.id, title: `Kuitansi Pembayaran ${pay.invoiceNumber}`, documentType: 'payment_receipt' as const,
        documentNumber: pay.receiptNumber, customerId: pay.customerId, customerName: pay.customerName,
        referenceId: pay.id, amount: pay.amount, date: pay.paymentDate, status: 'verified',
        createdAt: pay.createdAt, raw: pay, actionType: 'receipt' as const,
      })),
    ];

    const generatedIds = new Set(generated.map((d) => `${d.documentType}:${d.id}`));
    const generic = storedDocuments
      .filter((d) => !generatedIds.has(`${d.documentType}:${d.id}`))
      .map((d) => ({ ...d }));

    return [...generated, ...generic].sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices, letters, payments, storedDocuments, businessDocuments]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allDocuments.filter((doc) => {
      const matchesSearch = !q || [doc.documentNumber, doc.customerName, doc.title].some((v) => (v || '').toLowerCase().includes(q));
      return matchesSearch && (docTypeFilter === 'all' || doc.documentType === docTypeFilter);
    });
  }, [allDocuments, searchQuery, docTypeFilter]);

  const handleOpenDoc = (doc: HubDocument) => {
    if (doc.actionType === 'invoice') onViewInvoice(doc.referenceId || doc.id);
    else if (doc.actionType === 'letter') onViewLetter(doc.referenceId || doc.id);
    else if (doc.actionType === 'receipt' && doc.raw) onViewReceipt(doc.raw as Payment);
  };

  const filters: Array<{ id: DocumentType | 'all'; label: string; count: number }> = [
    { id: 'all', label: 'Semua', count: allDocuments.length },
    { id: 'invoice', label: 'Invoice', count: allDocuments.filter((d) => d.documentType === 'invoice').length },
    { id: 'payment_receipt', label: 'Kuitansi', count: allDocuments.filter((d) => d.documentType === 'payment_receipt').length },
    { id: 'billing_letter', label: 'Penagihan', count: allDocuments.filter((d) => d.documentType === 'billing_letter').length },
    { id: 'quotation', label: 'Quotation', count: allDocuments.filter((d) => d.documentType === 'quotation').length },
    { id: 'purchase_order', label: 'PO', count: allDocuments.filter((d) => d.documentType === 'purchase_order').length },
    { id: 'delivery_order', label: 'Surat Jalan', count: allDocuments.filter((d) => d.documentType === 'delivery_order').length },
    { id: 'bast', label: 'BAST', count: allDocuments.filter((d) => d.documentType === 'bast').length },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><FolderOpen className="w-5 h-5 text-blue-600" />Document Archive Hub</h2>
        <p className="text-xs text-slate-500 mt-1">Pusat arsip dokumen bisnis dari order, pengiriman, penagihan hingga pembayaran.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ['Invoice', allDocuments.filter((d) => d.documentType === 'invoice').length, 'Faktur penjualan'],
          ['Kuitansi', allDocuments.filter((d) => d.documentType === 'payment_receipt').length, 'Bukti penerimaan pembayaran'],
          ['Dokumen Bisnis', allDocuments.filter((d) => !['invoice', 'payment_receipt'].includes(d.documentType)).length, 'Quotation, PO, Surat Jalan, BAST, dll.'],
        ].map(([label, count, desc]) => (
          <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{count}</p>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <Input placeholder="Cari nomor dokumen, judul, atau customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {filters.map((tab) => (
            <button key={tab.id} onClick={() => setDocTypeFilter(tab.id)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${docTypeFilter === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {tab.label} <span className="opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
              <tr><th className="px-6 py-3">Nomor</th><th className="px-6 py-3">Tipe</th><th className="px-6 py-3">Dokumen & Customer</th><th className="px-6 py-3">Tanggal</th><th className="px-6 py-3 text-right">Nilai</th><th className="px-6 py-3 text-right">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDocs.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">Belum ada dokumen pada arsip.</td></tr> : filteredDocs.map((doc) => (
                <tr key={`${doc.documentType}-${doc.id}`} onClick={() => handleOpenDoc(doc)} className={`hover:bg-slate-50 transition-colors ${doc.actionType ? 'cursor-pointer' : ''}`}>
                  <td className="px-6 py-3.5 font-mono text-xs font-semibold text-blue-600">{doc.documentNumber}</td>
                  <td className="px-6 py-3.5"><span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase">{TYPE_ICONS[doc.documentType]}{TYPE_LABELS[doc.documentType]}</span></td>
                  <td className="px-6 py-3.5 text-xs"><p className="font-semibold text-slate-900 line-clamp-1">{doc.title}</p><p className="text-[10px] text-slate-500">{doc.customerName || 'Dokumen internal'}</p></td>
                  <td className="px-6 py-3.5 text-xs text-slate-700">{formatIndoDate(doc.date)}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-slate-900 text-xs">{doc.amount !== undefined ? formatRupiah(doc.amount) : '-'}</td>
                  <td className="px-6 py-3.5 text-right">{doc.actionType ? <button onClick={(e) => { e.stopPropagation(); handleOpenDoc(doc); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Buka dokumen"><Eye className="w-4 h-4" /></button> : <span className="text-[10px] text-slate-400">Arsip</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
