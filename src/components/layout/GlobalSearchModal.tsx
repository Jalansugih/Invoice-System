import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../../lib/storage';
import { Search, FileText, Users, CreditCard, Mail, X, ArrowRight, Package } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, id?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState(StorageService.getInvoices());
  const [customers, setCustomers] = useState(StorageService.getCustomers());
  const [payments, setPayments] = useState(StorageService.getPayments());
  const [billingLetters, setBillingLetters] = useState(StorageService.getBillingLetters());
  const [products, setProducts] = useState(StorageService.getProducts());

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setInvoices(StorageService.getInvoices());
      setCustomers(StorageService.getCustomers());
      setPayments(StorageService.getPayments());
      setBillingLetters(StorageService.getBillingLetters());
      setProducts(StorageService.getProducts());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedInvoices = invoices.filter(
      (i) =>
        i.invoiceNumber?.toLowerCase().includes(q) ||
        i.customerName?.toLowerCase().includes(q) ||
        i.poNumber?.toLowerCase().includes(q) ||
        i.referenceNumber?.toLowerCase().includes(q)
    );

    const matchedCustomers = customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.pic?.toLowerCase().includes(q)
    );

    const matchedPayments = payments.filter(
      (p) =>
        p.paymentNumber?.toLowerCase().includes(q) ||
        p.receiptNumber?.toLowerCase().includes(q) ||
        p.customerName?.toLowerCase().includes(q) ||
        p.invoiceNumber?.toLowerCase().includes(q) ||
        p.referenceNumber?.toLowerCase().includes(q)
    );

    const matchedLetters = billingLetters.filter(
      (l) =>
        l.letterNumber?.toLowerCase().includes(q) ||
        l.customerName?.toLowerCase().includes(q) ||
        l.invoiceNumber?.toLowerCase().includes(q) ||
        l.subject?.toLowerCase().includes(q)
    );

    const matchedProducts = products.filter(
      (pr) =>
        pr.name?.toLowerCase().includes(q) ||
        pr.code?.toLowerCase().includes(q) ||
        pr.category?.toLowerCase().includes(q) ||
        pr.description?.toLowerCase().includes(q)
    );

    return {
      invoices: matchedInvoices,
      customers: matchedCustomers,
      payments: matchedPayments,
      billingLetters: matchedLetters,
      products: matchedProducts,
      total:
        matchedInvoices.length +
        matchedCustomers.length +
        matchedPayments.length +
        matchedLetters.length +
        matchedProducts.length,
    };
  }, [query, invoices, customers, payments, billingLetters, products]);

  if (!isOpen) return null;

  const handleSelect = (tab: string, id?: string) => {
    onNavigate(tab, id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24 text-center">
        <div
          className="relative w-full max-w-2xl transform rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="flex items-center border-b border-slate-200 px-4 py-3.5 bg-slate-50/50">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari invoice, nomor tagihan, pelanggan, pembayaran, produk..."
              className="w-full bg-transparent border-0 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-200/80 text-slate-600 rounded border border-slate-300">
              ESC
            </kbd>
          </div>

          {/* Search Content */}
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {!query.trim() ? (
              <div className="py-10 text-center">
                <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">Pencarian Global BillingFlow</p>
                <p className="text-xs text-slate-400 mt-1">
                  Ketik nomor faktur (e.g. INV/2026/08/00001), nama PT, atau nomor kuitansi.
                </p>
              </div>
            ) : results?.total === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                Tidak ditemukan hasil untuk "{query}"
              </div>
            ) : (
              <div className="space-y-4">
                {/* Invoices */}
                {results && results.invoices.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      Invoice ({results.invoices.length})
                    </h4>
                    <div className="space-y-1">
                      {results.invoices.map((inv) => (
                        <div
                          key={inv.id}
                          onClick={() => handleSelect('invoices', inv.id)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50/60 cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-blue-600 font-mono">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-xs text-slate-700">{inv.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {formatRupiah(inv.grandTotal)}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers */}
                {results && results.customers.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      Pelanggan ({results.customers.length})
                    </h4>
                    <div className="space-y-1">
                      {results.customers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelect('customers', c.id)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-indigo-50/60 cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-800">{c.name}</span>
                            <span className="text-[11px] text-slate-400">{c.city}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500">PIC: {c.pic}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payments */}
                {results && results.payments.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                      Pembayaran ({results.payments.length})
                    </h4>
                    <div className="space-y-1">
                      {results.payments.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelect('payments', p.id)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-emerald-50/60 cursor-pointer group transition-colors"
                        >
                          <div>
                            <span className="text-xs font-semibold text-emerald-600 font-mono">
                              {p.receiptNumber}
                            </span>
                            <span className="text-xs text-slate-700 ml-2">{p.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {formatRupiah(p.amount)}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Surat Tagihan */}
                {results && results.billingLetters.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                      Surat Tagihan ({results.billingLetters.length})
                    </h4>
                    <div className="space-y-1">
                      {results.billingLetters.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => handleSelect('billing_letters', l.id)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/60 cursor-pointer group transition-colors"
                        >
                          <div>
                            <span className="text-xs font-semibold text-amber-700 font-mono">
                              {l.letterNumber}
                            </span>
                            <span className="text-xs text-slate-700 ml-2">{l.customerName}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products */}
                {results && results.products.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-500" />
                      Produk / Jasa ({results.products.length})
                    </h4>
                    <div className="space-y-1">
                      {results.products.map((pr) => (
                        <div
                          key={pr.id}
                          onClick={() => handleSelect('products', pr.id)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-purple-50/60 cursor-pointer group transition-colors"
                        >
                          <div>
                            <span className="text-xs font-semibold text-slate-800">{pr.name}</span>
                            <span className="text-[11px] text-slate-400 ml-2">({pr.category})</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-900">
                            {formatRupiah(pr.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
