import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, Package, FileText, Mail, CreditCard, Wallet, Truck,
  Link as LinkIcon, FolderOpen, BarChart3, Settings, History, ChevronLeft,
  ChevronRight, Building2, ShieldCheck, Receipt,
  ClipboardList, BookOpen, ChevronDown, Landmark,
  ShoppingCart, Banknote, Boxes, BookOpenCheck, UserCog, SlidersHorizontal,
  DatabaseBackup, Percent, FileBarChart2,
} from 'lucide-react';
import { StorageService } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { useAuth } from '../auth/Auth';

export interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenGuide?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number | null;
  badgeVariant?: 'default' | 'danger' | 'success' | 'warning' | 'info';
  children?: NavItem[];
}
interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab, onSelectTab, isCollapsed, onToggleCollapse, isOpenMobile, onCloseMobile,
}) => {
  const { user: authUser } = useAuth();
  const org = StorageService.getOrganization();
  const user = authUser || StorageService.getUser();
  const overdueCount = StorageService.getInvoices().filter((i) => i.status === 'overdue').length;

  const navGroups: NavGroup[] = useMemo(() => [
    {
      id: 'master-data', label: 'Master Data', icon: DatabaseBackup,
      items: [
        { id: 'products', label: 'Produk & Jasa', icon: Package },
        { id: 'customers', label: 'Pelanggan', icon: Users },
        { id: 'suppliers', label: 'Supplier / Vendor', icon: Truck },
        { id: 'coa', label: 'Kategori Akun (COA)', icon: BookOpenCheck },
      ],
    },
    {
      id: 'transactions', label: 'Transaksi', icon: Receipt,
      items: [
        { id: 'invoices', label: 'Penjualan', icon: FileText, badge: overdueCount > 0 ? overdueCount : null, badgeVariant: 'danger' },
        { id: 'purchases', label: 'Pembelian', icon: ShoppingCart },
        { id: 'expenses', label: 'Pengeluaran', icon: Wallet },
        { id: 'payments', label: 'Pembayaran', icon: CreditCard },
      ],
    },
    {
      id: 'finance', label: 'Keuangan', icon: Banknote,
      items: [
        { id: 'cash_bank', label: 'Kas & Bank', icon: Landmark },
        { id: 'inventory', label: 'Persediaan (Stok)', icon: Boxes },
      ],
    },
    {
      id: 'documents-audit', label: 'Dokumen & Audit', icon: FolderOpen,
      items: [
        { id: 'business_documents', label: 'Order & Dokumen Transaksi', icon: ClipboardList },
        { id: 'billing_letters', label: 'Surat Tagihan', icon: Mail },
        { id: 'documents', label: 'Arsip Dokumen', icon: FolderOpen },
        { id: 'audit', label: 'Jejak Audit Sistem', icon: History },
        { id: 'payment_gateway', label: 'Payment Gateway', icon: LinkIcon, badge: 'Online', badgeVariant: 'info' },
      ],
    },
    {
      id: 'reports', label: 'Laporan', icon: BarChart3,
      items: [
        { id: 'report_summary', label: 'Ringkasan Keuangan', icon: FileBarChart2 },
        { id: 'report_profit_loss', label: 'Laba Rugi', icon: BarChart3 },
        { id: 'report_balance_sheet', label: 'Neraca', icon: Landmark },
        { id: 'report_cash_flow', label: 'Arus Kas', icon: Wallet },
        { id: 'report_general_ledger', label: 'Buku Besar', icon: BookOpen },
        { id: 'report_tax', label: 'Laporan Pajak', icon: Percent },
        { id: 'report_stock', label: 'Laporan Stok', icon: Boxes },
      ],
    },
    {
      id: 'account-system', label: 'Akun & Sistem', icon: ShieldCheck,
      items: [
        { id: 'users_access', label: 'Pengguna & Hak Akses', icon: UserCog },
        {
          id: 'settings', label: 'Pengaturan', icon: Settings,
          children: [
            { id: 'settings_company', label: 'Profil Perusahaan', icon: Building2 },
            { id: 'settings_tax', label: 'Preferensi Pajak', icon: Percent },
            { id: 'settings_integrations', label: 'Integrasi & Notifikasi', icon: SlidersHorizontal },
            { id: 'settings_backup', label: 'Backup Data', icon: DatabaseBackup },
          ],
        },
      ],
    },
  ], [overdueCount]);

  const topDashboard: NavItem = { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard };

  // Every group starts expanded; user can collapse the ones they don't need.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((g) => [g.id, true]))
  );
  // Nested items (e.g. "Pengaturan" > sub-halaman) track their own open state.
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const isItemOrChildActive = (item: NavItem): boolean =>
    item.id === currentTab || !!item.children?.some((c) => c.id === currentTab);

  const activeGroup = navGroups.find((g) => g.items.some(isItemOrChildActive))?.id;

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const toggleGroup = (id: string) => {
    if (isCollapsed) return;
    setOpenGroups((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const toggleItem = (id: string, defaultOpen: boolean) => {
    if (isCollapsed) return;
    setOpenItems((prev) => ({ ...prev, [id]: !(prev[id] ?? defaultOpen) }));
  };

  const userInitials = user.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'ID';

  const renderItem = (item: NavItem, nested = false) => {
    const Icon = item.icon;
    const hasChildren = !!item.children?.length;
    const childActive = !!item.children?.some((c) => c.id === currentTab);
    const isActive = currentTab === item.id;
    const isOpen = openItems[item.id] ?? childActive;

    const button = (
      <button
        key={item.id}
        id={`nav-item-${item.id}`}
        onClick={() => (hasChildren ? toggleItem(item.id, childActive) : handleNavClick(item.id))}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left group relative',
          isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-900 hover:text-white',
          isCollapsed && 'justify-center px-2 py-2.5',
          nested && !isCollapsed && 'py-1.5'
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />}
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
        {!isCollapsed && hasChildren && (
          <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform', isOpen ? 'rotate-0' : '-rotate-90')} />
        )}
        {!isCollapsed && !hasChildren && item.badge != null && (
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0',
            item.badgeVariant === 'danger' ? 'bg-rose-100 text-rose-700' :
            item.badgeVariant === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-slate-700 text-slate-200'
          )}>{item.badge}</span>
        )}
      </button>
    );

    if (!hasChildren) return button;

    return (
      <div key={item.id}>
        {button}
        {(isOpen || isCollapsed) && (
          <div className={cn('space-y-0.5 mt-0.5', !isCollapsed && 'ml-3 pl-3 border-l border-slate-800/80')}>
            {item.children!.map((child) => renderItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpenMobile && <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden" onClick={onCloseMobile} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B0F17] text-slate-300 transition-all duration-200 ease-in-out lg:static shrink-0 border-r border-slate-800/60 select-none',
        isCollapsed ? 'w-20' : 'w-64', isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className={cn('flex items-center justify-between border-b border-slate-800/80 h-16', isCollapsed ? 'px-3 justify-center' : 'px-4')}>
          <div onClick={() => handleNavClick('dashboard')} className="flex items-center gap-3 cursor-pointer overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-sm overflow-hidden flex items-center justify-center shrink-0 border border-slate-700/40 bg-slate-200">
              <img src="/logo-rk-bendahara.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white tracking-tight truncate">Rajakas<span className="text-blue-400">.id</span></span>
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-200 border border-blue-400/20 text-[9px] font-bold rounded">ERP</span>
                </div>
                <span className="text-[11px] text-slate-400 truncate">{org.name || 'Perusahaan'}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={onToggleCollapse} className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white" title="Ciutkan menu">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
          {renderItem(topDashboard)}

          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            const expanded = (openGroups[group.id] ?? true) || activeGroup === group.id;
            return (
              <div key={group.id} className="pt-2">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300',
                    isCollapsed && 'justify-center px-0'
                  )}
                  title={isCollapsed ? group.label : undefined}
                >
                  <GroupIcon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expanded ? 'rotate-0' : '-rotate-90')} />
                    </>
                  )}
                </button>
                {(expanded || isCollapsed) && (
                  <div className="space-y-0.5 mt-0.5">{group.items.map((item) => renderItem(item))}</div>
                )}
              </div>
            );
          })}
        </div>

        {isCollapsed && (
          <div className="p-2 border-t border-slate-800/80 flex justify-center">
            <button onClick={onToggleCollapse} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white" title="Perluas menu">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-3 border-t border-slate-800/80 bg-[#070A0F]">
          <div onClick={() => handleNavClick('settings')} className={cn('flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer group', isCollapsed && 'justify-center p-1')} title="Pengaturan akun">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">{userInitials}</div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">{user.role}</span>
                  <span className="text-[10px] text-slate-400 truncate">{org.name ? org.name.split(' ')[0] : 'Tenant'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
