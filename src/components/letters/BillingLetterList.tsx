import React, { useState, useMemo } from 'react';
import { BillingLetter } from '../../types';
import { StorageService } from '../../lib/storage';
import { formatRupiah, formatIndoDate, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  Mail,
  Search,
  Plus,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export interface BillingLetterListProps {
  onViewLetter: (id: string) => void;
  onCreateNewLetter: () => void;
}

export const BillingLetterList: React.FC<BillingLetterListProps> = ({
  onViewLetter,
  onCreateNewLetter,
}) => {
  const [letters, setLetters] = useState(StorageService.getBillingLetters());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [letterToDelete, setLetterToDelete] = useState<BillingLetter | null>(null);

  const refreshData = () => {
    setLetters(StorageService.getBillingLetters());
  };

  const filteredLetters = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return letters.filter((l) => {
      const match =
        !q ||
        (l.letterNumber || '').toLowerCase().includes(q) ||
        (l.customerName || '').toLowerCase().includes(q) ||
        (l.invoiceNumber || '').toLowerCase().includes(q) ||
        (l.subject || '').toLowerCase().includes(q);

      if (!match) return false;
      if (selectedType !== 'all' && l.letterType !== selectedType) return false;
      return true;
    });
  }, [letters, searchQuery, selectedType]);

  const handleExportCSV = () => {
    const data = filteredLetters.map((l) => ({
      'No. Surat': l.letterNumber,
      'Jenis Dokumen': l.letterType,
      'No. Faktur Terkait': l.invoiceNumber,
      'Pelanggan': l.customerName,
      'Tanggal Surat': l.letterDate,
      'Batas Akhir Bayar': l.paymentDeadline,
      'Sisa Tagihan Pokok': l.outstandingAmount,
      'Denda Keterlambatan': l.penaltiesAmount,
      'Perihal': l.subject,
      'Status': l.status,
    }));
    exportToCSV(`Daftar_Surat_Tagihan_${new Date().toISOString().split('T')[0]}`, data);
  };

  const handleDeleteConfirm = () => {
    if (!letterToDelete) return;
    try {
      StorageService.deleteBillingLetter(letterToDelete.id);
      setLetterToDelete(null);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus surat tagihan');
    }
  };

  const getLetterTypeBadge = (type: BillingLetter['letterType']) => {
    switch (type) {
      case 'sp1':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold uppercase">SP-1 (Reminder)</span>;
      case 'sp2':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">SP-2 (Warning)</span>;
      case 'sp3':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase">SP-3 (Final)</span>;
      case 'somasi':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">Somasi Hukum</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase">Surat</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Billing & Overdue Letters
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Formal tiered collection reminder letters (SP-1, SP-2, SP-3 / Legal Notice)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={onCreateNewLetter}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Issue Letter
          </Button>
        </div>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Total Letters Issued
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-slate-900 mt-1 tabular-nums tracking-tight truncate">
              {letters.length}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">Formal collection correspondence</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Total Overdue Under Notice
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-amber-600 mt-1 tabular-nums tracking-tight truncate" title={formatRupiah(letters.reduce((sum, l) => sum + l.outstandingAmount, 0))}>
              {formatRupiah(letters.reduce((sum, l) => sum + l.outstandingAmount, 0))}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">Active collection amount</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs min-w-0 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              SP-3 & Legal Notices
            </p>
            <p className="text-lg sm:text-xl xl:text-2xl font-bold text-rose-600 mt-1 tabular-nums tracking-tight truncate">
              {letters.filter((l) => l.letterType === 'sp3' || l.letterType === 'somasi').length}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">Escalated collection documents</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search letter number, subject, customer, or invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'sp1', label: 'SP-1' },
            { id: 'sp2', label: 'SP-2' },
            { id: 'sp3', label: 'SP-3' },
            { id: 'somasi', label: 'Somasi' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedType === type.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Letters Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3">Letter Number & Subject</th>
                <th className="px-6 py-3">Customer & Invoice</th>
                <th className="px-6 py-3">Letter Date & Deadline</th>
                <th className="px-6 py-3 text-right">Overdue Balance</th>
                <th className="px-6 py-3 text-center">Type</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No billing letters found.
                  </td>
                </tr>
              ) : (
                filteredLetters.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => onViewLetter(l.id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-mono text-xs font-semibold text-blue-600">{l.letterNumber}</p>
                      <p className="text-xs font-medium text-slate-800 line-clamp-1">{l.subject}</p>
                    </td>

                    <td className="px-6 py-3.5 text-xs">
                      <p className="font-semibold text-slate-900">{l.customerName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Invoice: {l.invoiceNumber}</p>
                    </td>

                    <td className="px-6 py-3.5 text-xs">
                      <p className="text-slate-800">{formatIndoDate(l.letterDate)}</p>
                      <p className="text-[10px] text-rose-600 font-medium">
                        Deadline: {formatIndoDate(l.paymentDeadline)}
                      </p>
                    </td>

                    <td className="px-6 py-3.5 text-right font-semibold text-rose-600 text-xs">
                      {formatRupiah(l.outstandingAmount)}
                      {l.penaltiesAmount > 0 && (
                        <p className="text-[10px] text-slate-400 font-normal">
                          + Denda {formatRupiah(l.penaltiesAmount)}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-center">
                      {getLetterTypeBadge(l.letterType)}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onViewLetter(l.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="View & Print Letter"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setLetterToDelete(l)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Letter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!letterToDelete}
        title="Hapus Surat Tagihan"
        message={`Apakah Anda yakin ingin menghapus surat tagihan ${letterToDelete?.letterNumber} untuk pelanggan ${letterToDelete?.customerName}?`}
        confirmText="Hapus Surat"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setLetterToDelete(null)}
        onCancel={() => setLetterToDelete(null)}
      />
    </div>
  );
};
