import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../../lib/storage';
import { NotificationItem } from '../../types';
import { Bell, CheckCheck, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { formatIndoDate } from '../../lib/utils';

export interface NotificationDropdownProps {
  onNavigate: (tab: string, id?: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    setNotifications(StorageService.getNotifications());
  };

  useEffect(() => {
    loadNotifications();
    const unsub = StorageService.subscribe(loadNotifications);
    return unsub;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleItemClick = (notif: NotificationItem) => {
    StorageService.markNotificationAsRead(notif.id);
    setIsOpen(false);
    if (notif.linkModule) {
      onNavigate(notif.linkModule, notif.linkId);
    }
  };

  const handleMarkAllRead = () => {
    StorageService.markAllNotificationsAsRead();
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="btn-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-800">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Tidak ada notifikasi</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                    !notif.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{notif.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatIndoDate(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
