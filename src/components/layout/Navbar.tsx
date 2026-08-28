import React, { useState } from 'react';
import { StorageService } from '../../lib/storage';
import { UserRole } from '../../types';
import { useAuth } from '../auth/Auth';
import {
  Search,
  Plus,
  Menu,
  ChevronRight,
  UserCheck,
  FilePlus,
  CreditCard,
  MailPlus,
  UserPlus,
  LogOut,
  HelpCircle,
  BookOpen,
  RefreshCw,
  CloudOff,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

export interface NavbarProps {
  currentTab?: string;
  onToggleSidebar?: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenSearch: () => void;
  onNavigate?: (tab: string, id?: string) => void;
  onNavigateInvoice?: (id: string) => void;
  onQuickAction?: (action: 'new_invoice' | 'new_payment' | 'new_letter' | 'new_customer') => void;
  onQuickInvoice?: () => void;
  onOpenGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab = 'dashboard',
  onToggleSidebar,
  onOpenMobileSidebar,
  onOpenSearch,
  onNavigate,
  onNavigateInvoice,
  onQuickAction,
  onQuickInvoice,
  onOpenGuide,
}) => {
  const { user: authUser, signOut, signInDemoUser, refreshSession } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [syncFailureCount, setSyncFailureCount] = useState(() => StorageService.getSyncFailures().length);
  const user = authUser || StorageService.getUser();

  React.useEffect(() => {
    return StorageService.subscribeSyncStatus(() => {
      setSyncFailureCount(StorageService.getSyncFailures().length);
    });
  }, []);

  const handleRetrySync = async () => {
    setIsRetryingSync(true);
    try {
      await StorageService.retryFailedSyncs();
    } finally {
      setIsRetryingSync(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    signInDemoUser(newRole);
  };

  const tabTitles: Record<string, string> = {
    dashboard: 'Financial Overview',
    customers: 'Customer Directory',
    products: 'Products & Price List',
    invoices: 'Invoice & Billing Management',
    billing_letters: 'Billing & Overdue Letters',
    payments: 'Payment Receipts',
    reconciliation: 'Bank Reconciliation & Feed',
    tax_reports: 'Laporan Pajak Perusahaan',
    documents: 'Document Archive Hub',
    reports: 'Financial & Aging Reports',
    audit: 'System Audit Trail',
    settings: 'Organization & Database Settings',
  };

  const currentTitle = tabTitles[currentTab] || 'Financial Overview';

  const handleCreateInvoice = () => {
    if (onQuickInvoice) {
      onQuickInvoice();
    } else if (onQuickAction) {
      onQuickAction('new_invoice');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-20">
      {/* Left: Mobile Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <button
          id="btn-sidebar-toggle"
          onClick={onOpenMobileSidebar || onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none lg:hidden shrink-0"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clean Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 truncate">
          <span className="capitalize">{currentTab === 'dashboard' ? 'Dashboard' : 'BillingFlow'}</span>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-medium truncate">{currentTitle}</span>
        </div>

        {/* Global Search Bar Trigger */}
        <button
          id="btn-open-search"
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 w-full max-w-[200px] sm:max-w-xs md:max-w-sm rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-300 hover:bg-white hover:text-slate-600 transition-all shadow-2xs ml-auto sm:ml-4"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">Search invoice, customer, receipt...</span>
          <kbd className="hidden md:inline-block ml-auto text-[10px] font-mono uppercase px-1.5 py-0.5 bg-slate-200/80 text-slate-600 rounded border border-slate-300">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Notifications & Role */}
      <div className="flex items-center gap-3 ml-3 shrink-0">
        {/* New Invoice Button */}
        <div className="relative">
          <button
            id="btn-navbar-new-invoice"
            onClick={handleCreateInvoice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Invoice</span>
          </button>
        </div>

        {/* Cloud Sync Failure Indicator */}
        {syncFailureCount > 0 && (
          <button
            type="button"
            onClick={handleRetrySync}
            disabled={isRetryingSync}
            title={`${syncFailureCount} data belum berhasil tersimpan ke cloud (Supabase). Klik untuk coba lagi.`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-700 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isRetryingSync ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudOff className="w-3.5 h-3.5" />
            )}
            {syncFailureCount} belum sinkron
          </button>
        )}

        {/* Notification Bell */}
        <NotificationDropdown
          onNavigate={(tab, id) => {
            if (onNavigate) onNavigate(tab, id);
            else if (onNavigateInvoice && id) onNavigateInvoice(id);
          }}
        />

        {/* Role Switcher Pill */}
        <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            Role:
          </span>
          <select
            id="select-user-role"
            value={user.role}
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            className="text-xs font-medium py-1 px-2 rounded-md border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            title="Switch User Role"
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="finance">Finance</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer (Read-Only)</option>
          </select>
        </div>

        {/* Help / Panduan Penggunaan Button */}
        {onOpenGuide && (
          <button
            id="btn-navbar-guide"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Buka Petunjuk Penggunaan Aplikasi"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span className="hidden md:inline">Panduan</span>
          </button>
        )}

        {/* Session Refresh Button */}
        <button
          type="button"
          id="btn-navbar-refresh-session"
          onClick={handleRefresh}
          title="Segarkan Sesi Autentikasi (Refresh Session)"
          className={`p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer ${
            isRefreshing ? 'animate-spin text-blue-600' : ''
          }`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Sign Out Button */}
        <button
          type="button"
          id="btn-navbar-signout"
          onClick={() => signOut()}
          title="Keluar Akun (Sign Out)"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
