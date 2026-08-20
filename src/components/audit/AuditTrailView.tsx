import React, { useState, useMemo } from 'react';
import { StorageService } from '../../lib/storage';
import { AuditLog } from '../../types';
import { exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { History, Search, Download, ShieldCheck, UserCheck, Clock, FileText } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState(StorageService.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return logs.filter((log) => {
      const match =
        !q ||
        (log.description || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q) ||
        (log.recordTitle || '').toLowerCase().includes(q) ||
        (log.recordId || '').toLowerCase().includes(q) ||
        (log.userName || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.entityId || '').toLowerCase().includes(q);

      if (!match) return false;
      const logEntity = log.entityType || log.module || '';
      if (entityFilter !== 'all' && logEntity !== entityFilter) return false;
      return true;
    });
  }, [logs, searchQuery, entityFilter]);

  const handleExportCSV = () => {
    const data = filteredLogs.map((l) => ({
      'Waktu Log': new Date(l.timestamp).toLocaleString('id-ID'),
      'Pengguna': l.userName || '',
      'Peran': l.userRole || '',
      'Aksi': l.action || '',
      'Entitas': l.entityType || l.module || '',
      'ID Entitas': l.entityId || l.recordId || '',
      'Deskripsi Aktivitas': l.description || l.details || '',
    }));
    exportToCSV(`Audit_Trail_Log_${new Date().toISOString().split('T')[0]}`, data);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Audit Trail & Log Aktivitas Keuangan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rekam jejak kepatuhan perbankan & akuntansi atas setiap perubahan faktur, penerimaan kas, dan surat tagihan
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Log Audit
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Cari aktivitas, nama pengguna, atau nomor dokumen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Semua Log' },
            { id: 'invoice', label: 'Invoice' },
            { id: 'payment', label: 'Pembayaran' },
            { id: 'billing_letter', label: 'Surat Tagihan' },
            { id: 'customer', label: 'Pelanggan' },
            { id: 'settings', label: 'Pengaturan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setEntityFilter(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                entityFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Waktu (WIB)</th>
              <th className="py-3 px-4">Pengguna & Peran</th>
              <th className="py-3 px-4">Kategori Entitas</th>
              <th className="py-3 px-4">Aksi</th>
              <th className="py-3 px-4">Deskripsi Rinci Perubahan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  Tidak ada catatan audit trail yang cocok.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{log.userName}</p>
                    <p className="text-[10px] text-slate-400 font-medium capitalize">{log.userRole}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {(log.entityType || log.module || 'System').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-blue-600 capitalize">
                    {log.action || 'Log'}
                  </td>
                  <td className="py-3 px-4 text-slate-800 leading-relaxed font-medium">
                    {log.description || log.details || log.recordTitle || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
