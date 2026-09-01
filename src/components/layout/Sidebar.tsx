import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Mail,
  CreditCard,
  Landmark,
  FolderOpen,
  BarChart3,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  ShieldCheck,
  Receipt,
  FileSpreadsheet,
  ClipboardList,
  BookOpen,
  HelpCircle,
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

interface NavGroup {
  groupTitle?: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string | number | null;
    badgeVariant?: 'default' | 'danger' | 'success' | 'warning' | 'info';
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
  onOpenGuide,
}) => {
  const { user: authUser, signOut } = useAuth();
  const org = StorageService.getOrganization();
  const user = authUser || StorageService.getUser();
  const invoices = StorageService.getInvoices();
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'Operasional & Billing',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Eksekutif',
          icon: LayoutDashboard,
        },
        {
          id: 'customers',
          label: 'Data Pelanggan',
          icon: Users,
        },
        {
          id: 'products',
          label: 'Produk & Jasa',
          icon: Package,
        },
        {
          id: 'invoices',
          label: 'Faktur Penjualan',
          icon: FileText,
          badge: overdueCount > 0 ? overdueCount : null,
          badgeVariant: 'danger',
        },
        { id: 'business_documents', label: 'Order & Dokumen Transaksi', icon: ClipboardList },
        {
          id: 'billing_letters',
          label: 'Surat Tagihan (SP)',
          icon: Mail,
        },
      ],
    },
    {
      groupTitle: 'Keuangan & Kas',
      items: [
        {
          id: 'payments',
          label: 'Penerimaan Kas',
          icon: CreditCard,
        },
        {
          id: 'reconciliation',
          label: 'Rekonsiliasi Bank',
          icon: Landmark,
          badge: 'Bank Feed',
          badgeVariant: 'success',
        },
        {
          id: 'documents',
          label: 'Arsip Dokumen',
          icon: FolderOpen,
        },
      ],
    },
    {
      groupTitle: 'Pajak & Laporan',
      items: [
        {
          id: 'tax_reports',
          label: 'Laporan Pajak (DJP)',
          icon: Receipt,
          badge: 'PPh & PPN',
          badgeVariant: 'info',
        },
        {
          id: 'reports',
          label: 'Laporan Keuangan',
          icon: BarChart3,
        },
        {
          id: 'audit',
          label: 'Jejak Audit Sistem',
          icon: History,
        },
      ],
    },
    {
      groupTitle: 'Sistem',
      items: [
        {
          id: 'settings',
          label: 'Pengaturan & DB',
          icon: Settings,
          badge: 'SQL',
          badgeVariant: 'default',
        },
      ],
    },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ID';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B0F17] text-slate-300 transition-all duration-200 ease-in-out lg:static shrink-0 border-r border-slate-800/60 select-none',
          isCollapsed ? 'w-20' : 'w-64',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Workspace Organization Switcher Header */}
        <div
          className={cn(
            'flex items-center justify-between border-b border-slate-800/80 h-16 transition-all',
            isCollapsed ? 'px-3 justify-center' : 'px-4'
          )}
        >
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden min-w-0"
          >
            {/* Monogram Emblem */}
            <div className="w-8 h-8 rounded-sm overflow-hidden flex items-center justify-center shrink-0 shadow-xs border-[0.5px] border-slate-700/40 bg-slate-200">
  <img 
    src="/logo-rk-bendahara.png" 
    alt="Logo" 
    className="w-full h-full object-cover" 
  />
</div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white tracking-tight truncate">
                    Rajakas<span className="text-sm font-bold text-blue-400">.id</span>
                  </span>
                  <span className="px-1.5 py-0.2 bg-blue-500/20 text-white/30 border border-white/30 text-[9px] font-bold rounded">
                    ERP
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 truncate">
                  {org.name || 'PT. Inovasi Jaya'}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors"
              title="Ciutkan Menu"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && group.groupTitle && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {group.groupTitle}
                </p>
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`nav-item-${item.id}`}
                      onClick={() => handleNavClick(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left group relative',
                        isActive
                          ? 'bg-slate-800/90 text-white font-semibold shadow-xs border border-slate-700/60'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200',
                        isCollapsed && 'justify-center px-2 py-2.5'
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                      )}

                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-blue-400'
                            : 'text-slate-400 group-hover:text-slate-300'
                        )}
                      />

                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}

                      {!isCollapsed && item.badge !== undefined && item.badge !== null && (
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0',
                            item.badgeVariant === 'danger'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : item.badgeVariant === 'success'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.badgeVariant === 'info'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Collapsed Expand Trigger */}
        {isCollapsed && (
          <div className="p-2 border-t border-slate-800/80 flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Perluas Menu"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User Profile & Company Metadata Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070A0F]">
          <div
            onClick={() => handleNavClick('settings')}
            className={cn(
              'flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors group',
              isCollapsed && 'justify-center p-1'
            )}
            title="Pengaturan Akun & Organisasi"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                {userInitials}
              </div>
            )}

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider',
                      user.role === 'owner' && 'bg-purple-950/80 text-purple-300 border border-purple-800/60',
                      user.role === 'admin' && 'bg-blue-950/80 text-blue-300 border border-blue-800/60',
                      user.role === 'finance' && 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60',
                      user.role === 'staff' && 'bg-amber-950/80 text-amber-300 border border-amber-800/60',
                      user.role === 'viewer' && 'bg-slate-800 text-slate-300 border border-slate-700'
                    )}
                  >
                    {user.role}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {org.name ? org.name.split(' ')[0] : 'Tenant'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
