import React, { useState, useEffect } from 'react';
import { StorageService } from './lib/storage';
import { Invoice, Payment, Customer, BillingLetter } from './types';
import { useAuth } from './components/auth/Auth';
import { Login } from './components/auth/Login';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerModal } from './components/customers/CustomerModal';
import { ProductList } from './components/products/ProductList';
import { InvoiceList } from './components/invoices/InvoiceList';
import { InvoiceFormModal } from './components/invoices/InvoiceFormModal';
import { InvoiceDetailView } from './components/invoices/InvoiceDetailView';
import { BillingLetterList } from './components/letters/BillingLetterList';
import { BillingLetterModal } from './components/letters/BillingLetterModal';
import { BillingLetterPrintView } from './components/letters/BillingLetterPrintView';
import { PaymentList } from './components/payments/PaymentList';
import { PaymentModal } from './components/payments/PaymentModal';
import { ReceiptPrintView } from './components/payments/ReceiptPrintView';
import { DocumentHub } from './components/documents/DocumentHub';
import { FinancialReportsView } from './components/reports/FinancialReportsView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Sub-detail / Print views
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [viewingLetterId, setViewingLetterId] = useState<string | null>(null);
  const [viewingReceiptPayment, setViewingReceiptPayment] = useState<Payment | null>(null);

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [invoiceCustomerTarget, setInvoiceCustomerTarget] = useState<Customer | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);

  const [isLetterModalOpen, setIsLetterModalOpen] = useState<boolean>(false);
  const [letterTargetInvoice, setLetterTargetInvoice] = useState<Invoice | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);

  // Reset drill-down views on top-level navigation tab switch
  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    setViewingInvoiceId(null);
    setViewingLetterId(null);
    setViewingReceiptPayment(null);
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick Action handlers
  const handleQuickAction = (action: 'new_invoice' | 'new_payment' | 'new_letter' | 'new_customer') => {
    if (action === 'new_invoice') {
      setInvoiceToEdit(null);
      setInvoiceCustomerTarget(null);
      setIsInvoiceModalOpen(true);
    } else if (action === 'new_payment') {
      setPaymentTargetInvoice(null);
      setIsPaymentModalOpen(true);
    } else if (action === 'new_letter') {
      setLetterTargetInvoice(null);
      setIsLetterModalOpen(true);
    } else if (action === 'new_customer') {
      setIsCustomerModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl mb-4 animate-pulse">
          BF
        </div>
        <p className="text-sm font-medium text-slate-300">Memuat sesi akun BillingFlow...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] text-[#1E293B] font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <Navbar
          currentTab={currentTab}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={(tab, id) => {
            setCurrentTab(tab);
            if (id && tab === 'invoices') setViewingInvoiceId(id);
          }}
          onNavigateInvoice={(id) => {
            setCurrentTab('invoices');
            setViewingInvoiceId(id);
          }}
          onQuickAction={handleQuickAction}
          onQuickInvoice={() => handleQuickAction('new_invoice')}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* 1. Drill-down Detail / Print Views */}
            {viewingInvoiceId && (
              <InvoiceDetailView
                invoiceId={viewingInvoiceId}
                onBack={() => setViewingInvoiceId(null)}
                onEditInvoice={(inv) => {
                  setInvoiceToEdit(inv);
                  setIsInvoiceModalOpen(true);
                }}
                onRecordPayment={(inv) => {
                  setPaymentTargetInvoice(inv);
                  setIsPaymentModalOpen(true);
                }}
                onCreateLetter={(inv) => {
                  setLetterTargetInvoice(inv);
                  setIsLetterModalOpen(true);
                }}
                onViewLetter={(letId) => {
                  setViewingInvoiceId(null);
                  setCurrentTab('billing_letters');
                  setViewingLetterId(letId);
                }}
                onInvoiceDeleted={() => setViewingInvoiceId(null)}
              />
            )}

            {!viewingInvoiceId && viewingLetterId && (
              (() => {
                const letDoc = StorageService.getBillingLetters().find((l) => l.id === viewingLetterId);
                if (!letDoc) return <BillingLetterList onViewLetter={(id) => setViewingLetterId(id)} onCreateNewLetter={() => handleQuickAction('new_letter')} />;
                return <BillingLetterPrintView letter={letDoc} onBack={() => setViewingLetterId(null)} />;
              })()
            )}

            {!viewingInvoiceId && !viewingLetterId && viewingReceiptPayment && (
              <ReceiptPrintView
                payment={viewingReceiptPayment}
                onBack={() => setViewingReceiptPayment(null)}
              />
            )}

            {/* 2. Top-Level Tab Views (Rendered when no drill-down is open) */}
            {!viewingInvoiceId && !viewingLetterId && !viewingReceiptPayment && (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardView
                    onNavigate={(tab) => handleSelectTab(tab)}
                    onQuickAction={handleQuickAction}
                    onViewInvoice={(id) => {
                      setCurrentTab('invoices');
                      setViewingInvoiceId(id);
                    }}
                    onRecordPaymentForInvoice={(inv) => {
                      setPaymentTargetInvoice(inv);
                      setIsPaymentModalOpen(true);
                    }}
                    onCreateLetterForInvoice={(inv) => {
                      setLetterTargetInvoice(inv);
                      setIsLetterModalOpen(true);
                    }}
                  />
                )}

                {currentTab === 'customers' && (
                  <CustomerList
                    onCreateInvoiceForCustomer={(cust) => {
                      setInvoiceCustomerTarget(cust);
                      setInvoiceToEdit(null);
                      setIsInvoiceModalOpen(true);
                    }}
                    onViewInvoice={(id) => {
                      setCurrentTab('invoices');
                      setViewingInvoiceId(id);
                    }}
                  />
                )}

                {currentTab === 'products' && <ProductList />}

                {currentTab === 'invoices' && (
                  <InvoiceList
                    onViewInvoice={(id) => setViewingInvoiceId(id)}
                    onEditInvoice={(inv) => {
                      setInvoiceToEdit(inv);
                      setIsInvoiceModalOpen(true);
                    }}
                    onRecordPayment={(inv) => {
                      setPaymentTargetInvoice(inv);
                      setIsPaymentModalOpen(true);
                    }}
                    onCreateLetter={(inv) => {
                      setLetterTargetInvoice(inv);
                      setIsLetterModalOpen(true);
                    }}
                    onCreateNewInvoice={() => handleQuickAction('new_invoice')}
                  />
                )}

                {currentTab === 'billing_letters' && (
                  <BillingLetterList
                    onViewLetter={(id) => setViewingLetterId(id)}
                    onCreateNewLetter={() => handleQuickAction('new_letter')}
                  />
                )}

                {currentTab === 'payments' && (
                  <PaymentList
                    onViewReceipt={(p) => setViewingReceiptPayment(p)}
                    onCreateNewPayment={() => handleQuickAction('new_payment')}
                  />
                )}

                {currentTab === 'documents' && (
                  <DocumentHub
                    onViewInvoice={(id) => {
                      setCurrentTab('invoices');
                      setViewingInvoiceId(id);
                    }}
                    onViewLetter={(id) => {
                      setCurrentTab('billing_letters');
                      setViewingLetterId(id);
                    }}
                    onViewReceipt={(p) => {
                      setCurrentTab('payments');
                      setViewingReceiptPayment(p);
                    }}
                  />
                )}

                {currentTab === 'reports' && <FinancialReportsView />}

                {currentTab === 'audit' && <AuditTrailView />}

                {currentTab === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectResult={(type, id) => {
          if (type === 'invoice') {
            setCurrentTab('invoices');
            setViewingInvoiceId(id);
          } else if (type === 'customer') {
            setCurrentTab('customers');
          } else if (type === 'letter') {
            setCurrentTab('billing_letters');
            setViewingLetterId(id);
          } else if (type === 'product') {
            setCurrentTab('products');
          }
        }}
      />

      {/* Universal Invoice Creator / Editor Modal */}
      <InvoiceFormModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setInvoiceToEdit(null);
          setInvoiceCustomerTarget(null);
        }}
        invoiceToEdit={invoiceToEdit}
        initialCustomer={invoiceCustomerTarget}
        onSuccess={(saved) => {
          setViewingInvoiceId(saved.id);
        }}
      />

      {/* Universal Payment Recorder Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentTargetInvoice(null);
        }}
        targetInvoice={paymentTargetInvoice}
        onSuccess={(saved) => {
          setViewingReceiptPayment(saved);
        }}
      />

      {/* Universal Billing Letter Generator Modal */}
      <BillingLetterModal
        isOpen={isLetterModalOpen}
        onClose={() => {
          setIsLetterModalOpen(false);
          setLetterTargetInvoice(null);
        }}
        initialInvoice={letterTargetInvoice}
        onSuccess={(saved) => {
          setViewingLetterId(saved.id);
        }}
      />

      {/* Universal Customer Form Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={() => {
          setCurrentTab('customers');
        }}
      />
    </div>
  );
}
