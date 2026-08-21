import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Mail,
  CreditCard,
  FolderOpen,
  BarChart3,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user: authUser, signOut } = useAuth();
  const org = StorageService.getOrganization();
  const user = authUser || StorageService.getUser();
  const invoices = StorageService.getInvoices();
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      badge: null,
    },
    {
      id: 'products',
      label: 'Products & Services',
      icon: Package,
      badge: null,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: FileText,
      badge: overdueCount > 0 ? `${overdueCount}` : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'billing_letters',
      label: 'Billing Letters',
      icon: Mail,
      badge: null,
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      badge: null,
    },
    {
      id: 'documents',
      label: 'Document Hub',
      icon: FolderOpen,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: History,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings & DB',
      icon: Settings,
      badge: 'SQL',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
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
    : 'JD';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0F172A] text-white transition-all duration-200 ease-in-out lg:static shrink-0 border-r border-slate-800/80',
          isCollapsed ? 'w-20' : 'w-64',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className={cn('flex items-center justify-between border-b border-slate-800/80 h-16', isCollapsed ? 'px-4' : 'px-6')}>
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden select-none"
          >
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt={org.name}
                className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5 shrink-0 border border-slate-700/60"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-xs">
                {org.name ? org.name.slice(0, 1).toUpperCase() : 'B'}
              </div>
            )}
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight text-white truncate">
                {org.name || 'BillingFlow'}
              </span>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <div
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'px-4 py-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors text-sm',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                  isCollapsed && 'justify-center px-2'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-blue-400' : 'text-slate-400')} />
                {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span
                    className={cn(
                      'ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0F172A]">
          <div
            onClick={() => handleNavClick('settings')}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors',
              isCollapsed && 'justify-center p-1'
            )}
            title="Account & Organization Settings"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                {userInitials}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{org.name || 'PT. Inovasi Jaya'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
