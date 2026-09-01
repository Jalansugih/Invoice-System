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
import { BankReconciliationView } from './components/reconciliation/BankReconciliationView';
import { TaxReportsView } from './components/tax/TaxReportsView';
import { DocumentHub } from './components/documents/DocumentHub';
import { BusinessDocumentsView } from './components/business/BusinessDocumentsView';
import { FinancialReportsView } from './components/reports/FinancialReportsView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { SettingsView } from './components/settings/SettingsView';
import { UserGuideModal } from './components/guide/UserGuideModal';

export default function App() {
  const { user, loading, signOut } = useAuth();
  
  // Read initial route from window.location.pathname
  const getInitialTabFromUrl = (): string => {
    if (typeof window === 'undefined') return 'dashboard';
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const validTabs = [
      'dashboard',
      'invoices',
      'customers',
      'products',
      'payments',
      'letters',
      'billing_letters',
      'reconciliation',
      'tax',
      'tax_reports',
      'documents',
      'business_documents',
      'reports',
      'audit',
      'settings',
    ];
    if (path === 'letters') return 'billing_letters';
    if (path === 'tax') return 'tax_reports';
    if (validTabs.includes(path)) return path;
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<string>(getInitialTabFromUrl);
  const [showExplicitLogin, setShowExplicitLogin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    return path === '/login' || path === '/auth' || path.startsWith('/login');
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

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

  // Sync browser URL with current tab and popstate events
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (path === 'login' || path === 'auth') {
        setShowExplicitLogin(true);
      } else {
        setShowExplicitLogin(false);
        const nextTab = getInitialTabFromUrl();
        setCurrentTab(nextTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser URL bar when tab changes
  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    setShowExplicitLogin(false);
    setViewingInvoiceId(null);
    setViewingLetterId(null);
    setViewingReceiptPayment(null);

    try {
      const targetUrl = tab === 'dashboard' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ tab }, '', targetUrl);
      }
    } catch {
      // ignore
    }
  };

  // Auto open guide on very first time use
  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('billingflow_has_seen_guide');
      if (!hasSeen) {
        setIsGuideModalOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

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

  if (!user || showExplicitLogin) {
    return (
      <Login
        onSuccess={() => {
          setShowExplicitLogin(false);
          try {
            if (window.location.pathname === '/login' || window.location.pathname === '/auth') {
              window.history.replaceState(null, '', '/');
            }
          } catch {
            // ignore
          }
        }}
      />
    );
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
        onOpenGuide={() => setIsGuideModalOpen(true)}
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
          onOpenGuide={() => setIsGuideModalOpen(true)}
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
                    onOpenGuide={() => setIsGuideModalOpen(true)}
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
                    onNavigateReconciliation={() => setCurrentTab('reconciliation')}
                  />
                )}

                {currentTab === 'reconciliation' && (
                  <BankReconciliationView
                    onViewInvoice={(id) => {
                      setCurrentTab('invoices');
                      setViewingInvoiceId(id);
                    }}
                    onViewReceipt={(p) => {
                      setCurrentTab('payments');
                      setViewingReceiptPayment(p);
                    }}
                  />
                )}

                {currentTab === 'tax_reports' && (
                  <TaxReportsView
                    onViewSourceInvoice={(id) => {
                      setCurrentTab('invoices');
                      setViewingInvoiceId(id);
                    }}
                  />
                )}

                {currentTab === 'business_documents' && <BusinessDocumentsView />}

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
        onNavigate={(tab, id) => {
          setIsSearchModalOpen(false);
          setCurrentTab(tab);
          if (tab === 'invoices' && id) {
            setViewingInvoiceId(id);
          } else if (tab === 'billing_letters' && id) {
            setViewingLetterId(id);
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

      {/* Interactive First-Time & On-Demand User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onNavigateToTab={(tab) => handleSelectTab(tab)}
      />
    </div>
  );
}
