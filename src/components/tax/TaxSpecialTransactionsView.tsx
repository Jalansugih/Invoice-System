import React, { useState } from 'react';
import { RelatedPartyTransaction, FlaggedExpenseItem } from '../../types/tax';
import { TaxService } from '../../lib/taxService';
import { formatRupiah, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  HelpCircle,
  Building,
  DollarSign,
  Download,
  Plus,
  ShieldCheck,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface TaxSpecialTransactionsViewProps {
  relatedPartyTransactions?: RelatedPartyTransaction[];
  flaggedExpenses?: FlaggedExpenseItem[];
  transactions?: any[];
  year: number;
  onRefresh?: () => void;
  onAddTransaction?: () => void;
}

export const TaxSpecialTransactionsView: React.FC<TaxSpecialTransactionsViewProps> = ({
  relatedPartyTransactions,
  flaggedExpenses,
  transactions,
  year,
  onRefresh = () => {},
  onAddTransaction,
}) => {
  const actualRelatedParties = relatedPartyTransactions || TaxService.getRelatedPartyTransactions();
  const actualFlaggedExpenses = flaggedExpenses || TaxService.getFlaggedExpenses();
  const [activeTab, setActiveTab] = useState<'related_parties' | 'flagged_expenses'>('related_parties');

  const handleUpdateTreatment = (
    id: string,
    treatment: FlaggedExpenseItem['treatment'],
    fiscalCategory: FlaggedExpenseItem['fiscalCategory']
  ) => {
    TaxService.updateFlaggedExpenseTreatment(id, treatment, fiscalCategory);
    onRefresh();
  };

  const handleExportRelatedPartyCSV = () => {
    const data = actualRelatedParties.map((r) => ({
      'Pihak Berelasi': r.partyName,
      'NPWP': r.partyNpwp,
      'Jenis Hubungan': r.relationshipType,
      'Jenis Transaksi': r.transactionType,
      'Nilai Transaksi (Rp)': r.transactionAmount || r.amount,
      'Metode Transfer Pricing': r.pricingMethod,
      'Ketersediaan Dokumen TP (Local File)': r.hasTpDocumentation ? 'Ada' : 'Tidak Ada',
      'Status Form 1771-IIIA': r.status,
    }));
    exportToCSV(`Lampiran_3A_Hubungan_Istimewa_${year}`, data);
  };

  const handleExportFlaggedExpensesCSV = () => {
    const data = actualFlaggedExpenses.map((f) => ({
      'Tanggal': f.date,
      'Akun Akuntansi': f.accountName,
      'Deskripsi / Catatan': f.description,
      'Nominal (Rp)': f.amount,
      'Alasan Perlu Diperiksa': f.flagReason,
      'Perlakuan Pajak': f.treatment,
      'Kategori Fiskal': f.fiscalCategory,
    }));
    exportToCSV(`Biaya_Perlu_Pemeriksaan_${year}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Transaksi Khusus & Pengawasan Biaya
            </h3>
            <p className="text-xs text-slate-500">
              Monitoring transaksi hubungan istimewa (Form 1771-IIIA) & uji kelayakan biaya fiskal (Deductible vs Non-Deductible)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={activeTab === 'related_parties' ? handleExportRelatedPartyCSV : handleExportFlaggedExpensesCSV}
              className="gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('related_parties')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'related_parties'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            1. Transaksi Hubungan Istimewa (Form 1771-IIIA/B)
            <Badge variant={activeTab === 'related_parties' ? 'default' : 'neutral'} size="sm">
              {relatedPartyTransactions.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('flagged_expenses')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'flagged_expenses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            2. Biaya yang Perlu Diperiksa (Non-Deductible Risk)
            <Badge variant={activeTab === 'flagged_expenses' ? 'default' : 'warning'} size="sm">
              {flaggedExpenses.length}
            </Badge>
          </button>
        </div>
      </div>

      {/* TAB 1: TRANSAKSI HUBUNGAN ISTIMEWA */}
      {activeTab === 'related_parties' && (
        <div className="space-y-4">
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <Building className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Ketentuan Form 1771-IIIA & PMK 172/2023</h4>
              <p className="mt-1 leading-relaxed">
                Wajib Pajak yang melakukan transaksi dengan pihak yang memiliki hubungan istimewa (kepemilikan saham &ge; 25%, penguasaan, atau hubungan keluarga) wajib mengisi Lampiran Khusus 3A dan menyiapkan Dokumen Penentuan Harga Transfer (Transfer Pricing Documentation / TP Doc).
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Pihak Berelasi & NPWP</th>
                    <th className="py-3 px-3">Jenis Hubungan</th>
                    <th className="py-3 px-3">Bentuk Transaksi</th>
                    <th className="py-3 px-3 text-right">Nilai Transaksi</th>
                    <th className="py-3 px-3 text-center">Metode Harga Wajar</th>
                    <th className="py-3 px-3 text-center">Dokumen TP</th>
                    <th className="py-3 px-3 text-center">Status Form 1771-3A</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relatedPartyTransactions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.partyName}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          NPWP: {item.partyNpwp}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{item.relationshipLabel || item.relationshipType}</td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{item.transactionTypeLabel || item.transactionType}</span>
                        <div className="text-[11px] text-slate-500">{item.description || item.notes}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.transactionAmount || item.amount)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <Badge variant="neutral" size="sm">
                          {item.pricingMethod}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={item.hasTpDocumentation || item.transferPricingDocRef ? 'success' : 'warning'} size="sm">
                          {item.hasTpDocumentation || item.transferPricingDocRef ? 'Dokumen Siap' : 'Perlu Disusun'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={item.status === 'confirmed' || item.status === 'documented' ? 'success' : 'info'} size="sm">
                          {item.status === 'confirmed' || item.status === 'documented' ? 'Dikonfirmasi' : 'Draf'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BIAYA YANG PERLU DIPERIKSA */}
      {activeTab === 'flagged_expenses' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Deteksi Biaya Berisiko Koreksi Fiskal (Pasal 9 UU PPh)</h4>
              <p className="mt-1 leading-relaxed">
                Biaya untuk kepentingan pribadi pemegang saham/direksi, natura/kenikmatan yang tidak berkaitan langsung dengan pekerjaan, sanksi administrasi/denda pajak, dan biaya tanpa bukti nominatif yang lengkap tidak dapat dikurangkan dari penghasilan bruto (Non-Deductible Expense).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {flaggedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">{expense.date}</span>
                      <Badge variant="neutral" size="sm">
                        {expense.accountCode} - {expense.accountName}
                      </Badge>
                      <Badge
                        variant={
                          expense.treatment === 'positive_correction'
                            ? 'danger'
                            : expense.treatment === 'deductible'
                            ? 'success'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {expense.treatment === 'positive_correction'
                          ? 'Koreksi Positif (Non-Deductible)'
                          : expense.treatment === 'deductible'
                          ? 'Deductible (Dapat Dibiayakan)'
                          : 'Perlu Pemeriksaan'}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{expense.description}</h4>

                    <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-100 text-xs text-rose-900">
                      <span className="font-semibold">Potensi Risiko:</span> {expense.flagReason}
                    </div>

                    {expense.suggestedAction && (
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Rekomendasi Pajak:</span>{' '}
                        {expense.suggestedAction}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400 font-bold uppercase">Nominal Biaya</div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {formatRupiah(expense.amount)}
                      </div>
                    </div>

                    {/* Quick Treatment Selector */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={expense.treatment === 'positive_correction' ? 'danger' : 'outline'}
                        onClick={() =>
                          handleUpdateTreatment(
                            expense.id,
                            'positive_correction',
                            'biaya_3m_non_deductible'
                          )
                        }
                        className="text-xs h-8"
                      >
                        Koreksi Positif
                      </Button>
                      <Button
                        size="sm"
                        variant={expense.treatment === 'deductible' ? 'success' : 'outline'}
                        onClick={() =>
                          handleUpdateTreatment(expense.id, 'deductible', 'deductible')
                        }
                        className="text-xs h-8"
                      >
                        Dapat Dibiayakan
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
