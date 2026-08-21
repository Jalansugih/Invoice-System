import React, { useState } from 'react';
import { TaxAuditLogItem } from '../../types/tax';
import { formatIndoDate } from '../../lib/utils';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  History,
  Search,
  ShieldCheck,
  User,
  Clock,
  ArrowRight,
  FileCheck2,
  Lock,
} from 'lucide-react';

interface TaxAuditTrailViewProps {
  logs: TaxAuditLogItem[];
}

export const TaxAuditTrailView: React.FC<TaxAuditTrailViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (selectedAction !== 'ALL' && log.action !== selectedAction) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.user.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q) ||
      (log.reason && log.reason.toLowerCase().includes(q)) ||
      log.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Audit Trail & Jejak Kepatuhan Perpajakan (Tax Compliance Logs)
          </h3>
          <p className="text-xs text-slate-300">
            Setiap perubahan tarif, penyesuaian koreksi fiskal, rekonsiliasi, dan pelaporan SPT terekam permanen untuk kebutuhan audit KAP & DJP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" size="sm">
            {logs.length} Total Riwayat Aksi
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedAction('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                selectedAction === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Aksi
            </button>
            <button
              onClick={() => setSelectedAction('reconcile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                selectedAction === 'reconcile'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
              }`}
            >
              Rekonsiliasi
            </button>
            <button
              onClick={() => setSelectedAction('file')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                selectedAction === 'file'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              Pelaporan / SPT
            </button>
            <button
              onClick={() => setSelectedAction('update')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                selectedAction === 'update'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              Perubahan Data
            </button>
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Cari pengguna, objek pajak, alasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Timeline Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu & Tanggal</th>
                <th className="py-3 px-4">Pengguna & Peran</th>
                <th className="py-3 px-4">Tindakan</th>
                <th className="py-3 px-4">Objek / Target</th>
                <th className="py-3 px-4">Perubahan Nilai</th>
                <th className="py-3 px-4">Alasan & Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada riwayat log audit yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                          {log.user.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{log.user}</p>
                          <p className="text-[10px] text-slate-500">{log.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          log.action === 'file'
                            ? 'success'
                            : log.action === 'reconcile'
                            ? 'info'
                            : log.action === 'approve'
                            ? 'success'
                            : log.action === 'delete'
                            ? 'danger'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {log.action.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs">
                      {log.target}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      {log.previousValue && log.newValue ? (
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <span className="line-through text-slate-400">{log.previousValue}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-bold text-blue-700">{log.newValue}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-700">
                          {log.newValue || '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs text-[11px] truncate">
                      {log.reason || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
