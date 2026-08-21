import React, { useState, useMemo } from 'react';
import { TaxTransaction, TaxPeriodSummary, TaxType } from '../../types/tax';
import { formatRupiah, formatIndoDate, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  FileText,
  Download,
  Search,
  Plus,
  Settings,
  Users,
  Building,
  Landmark,
  Globe,
  Receipt,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface TaxWithholdingViewProps {
  transactions: TaxTransaction[];
  periodSummary: TaxPeriodSummary;
  onDrilldown: (tx: TaxTransaction) => void;
  onOpenNewModal: () => void;
  onOpenConfigModal: () => void;
}

export const TaxWithholdingView: React.FC<TaxWithholdingViewProps> = ({
  transactions,
  periodSummary,
  onDrilldown,
  onOpenNewModal,
  onOpenConfigModal,
}) => {
  const [selectedPphTab, setSelectedPphTab] = useState<TaxType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const pphTransactions = useMemo(() => {
    return transactions.filter((t) => t.taxType !== 'PPN' && t.taxType !== 'PPhBadan');
  }, [transactions]);

  const pphTabs: { id: TaxType | 'ALL'; label: string; desc: string; count: number; icon: any }[] = [
    {
      id: 'ALL',
      label: 'Semua PPh Unifikasi',
      desc: 'Semua pemotongan/pemungutan PPh',
      count: pphTransactions.length,
      icon: Receipt,
    },
    {
      id: 'PPh21',
      label: 'PPh 21',
      desc: 'Gaji, Upah, Honorarium Pegawai & Ahli',
      count: pphTransactions.filter((t) => t.taxType === 'PPh21').length,
      icon: Users,
    },
    {
      id: 'PPh22',
      label: 'PPh 22',
      desc: 'Pemungutan Pengadaan Barang / BUMN',
      count: pphTransactions.filter((t) => t.taxType === 'PPh22').length,
      icon: Building,
    },
    {
      id: 'PPh23',
      label: 'PPh 23',
      desc: 'Jasa Konsultan, Manajemen, Dividen, Royalti',
      count: pphTransactions.filter((t) => t.taxType === 'PPh23').length,
      icon: FileText,
    },
    {
      id: 'PPh25',
      label: 'PPh 25',
      desc: 'Angsuran Pajak Bulanan Badan (Kredit)',
      count: pphTransactions.filter((t) => t.taxType === 'PPh25').length,
      icon: Landmark,
    },
    {
      id: 'PPh26',
      label: 'PPh 26',
      desc: 'Pemotongan Subjek Pajak Luar Negeri',
      count: pphTransactions.filter((t) => t.taxType === 'PPh26').length,
      icon: Globe,
    },
    {
      id: 'PPhFinal',
      label: 'PPh Final',
      desc: 'Pasal 4(2) Sewa Gedung, Konstruksi',
      count: pphTransactions.filter((t) => t.taxType === 'PPhFinal').length,
      icon: Receipt,
    },
  ];

  const filteredList = useMemo(() => {
    let list = pphTransactions;
    if (selectedPphTab !== 'ALL') {
      list = list.filter((t) => t.taxType === selectedPphTab);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) =>
        t.partyName.toLowerCase().includes(q) ||
        t.sourceDocNumber.toLowerCase().includes(q) ||
        (t.withholdingSlipNumber && t.withholdingSlipNumber.toLowerCase().includes(q)) ||
        (t.ntpn && t.ntpn.toLowerCase().includes(q)) ||
        t.taxCode.toLowerCase().includes(q)
    );
  }, [pphTransactions, selectedPphTab, searchQuery]);

  // Aggregate Totals
  const totalWithheldPayable = filteredList
    .filter((t) => t.category === 'withheld_payable' || t.category === 'final_tax')
    .reduce((sum, t) => sum + t.taxAmount, 0);

  const totalCredits = filteredList
    .filter((t) => t.category === 'tax_credit' || t.category === 'prepaid_tax')
    .reduce((sum, t) => sum + t.taxAmount, 0);

  const totalPaid = filteredList
    .filter((t) => t.paymentStatus === 'paid')
    .reduce((sum, t) => sum + t.taxAmount, 0);

  const handleExportCSV = () => {
    const data = filteredList.map((t) => ({
      'Nomor Transaksi': t.transactionNumber,
      'Jenis PPh': t.taxType,
      'Kode Objek Pajak': t.taxCode,
      'Nomor Bukti Potong': t.withholdingSlipNumber || '-',
      'Tanggal': t.transactionDate,
      'Pihak Terkait': t.partyName,
      'NPWP': t.partyNpwp,
      'Dasar Pengenaan Pajak (DPP)': t.dpp,
      'Tarif (%)': t.taxRate,
      'Nilai Pajak (Rp)': t.taxAmount,
      'Kategori': t.category,
      'Status Setor': t.paymentStatus,
      'NTPN': t.ntpn || '-',
    }));
    exportToCSV(`PPh_Unifikasi_${selectedPphTab}_${periodSummary.year}_Masa${periodSummary.month}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total PPh Terutang Dipotong (Hutang Pajak)
          </span>
          <p className="text-xl font-bold text-rose-600 mt-1 font-mono tracking-tight">
            {formatRupiah(totalWithheldPayable)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Kewajiban potong/pungut disetor ke Kas Negara (PPh 21, PPh 4(2))
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Kredit Pajak Perusahaan (Prepaid Tax)
          </span>
          <p className="text-xl font-bold text-blue-600 mt-1 font-mono tracking-tight">
            {formatRupiah(totalCredits)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Bukti Potong PPh 23 dari klien & Angsuran PPh 25 pengurang PPh Badan
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pajak PPh Tervalidasi NTPN (Lunas)
          </span>
          <p className="text-xl font-bold text-emerald-600 mt-1 font-mono tracking-tight">
            {formatRupiah(totalPaid)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Telah memiliki bukti setor NTPN / Bukti Pemindahbukuan sah
          </p>
        </div>
      </div>

      {/* Control Actions Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            SPT Masa PPh Unifikasi & Rekapitulasi Bukti Potong
          </h3>
          <p className="text-xs text-slate-500">
            Dikelola dengan skema e-Bupot Unifikasi DJP (PER-24/PJ/2021 stdd PER-17/PJ/2021)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenConfigModal}
            leftIcon={<Settings className="w-4 h-4 text-slate-600" />}
          >
            Konfigurasi Tarif & Aturan Pajak
          </Button>
          <Button
            size="sm"
            onClick={onOpenNewModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            + Catat Bukti Potong / PPh Baru
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Ekspor CSV e-Bupot
          </Button>
        </div>
      </div>

      {/* PPh Subtabs Nav */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {pphTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedPphTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedPphTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-700">
            Daftar Bukti Pemotongan & Transaksi PPh ({filteredList.length} entri)
          </p>
          <div className="w-full sm:w-80">
            <Input
              placeholder="Cari lawan transaksi, no bupot, NTPN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Table of Withholding Taxes */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Jenis & Kode</th>
                <th className="py-3 px-4">No. Bukti Potong / SSP</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Pihak Terkait & NPWP</th>
                <th className="py-3 px-4 text-right">DPP (Rp)</th>
                <th className="py-3 px-3 text-right">Tarif</th>
                <th className="py-3 px-4 text-right">Pajak (Rp)</th>
                <th className="py-3 px-4">Klasifikasi / NTPN</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada data transaksi PPh pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredList.map((t) => {
                  const isCredit = t.category === 'tax_credit' || t.category === 'prepaid_tax';

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => onDrilldown(t)}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              t.taxType === 'PPh23'
                                ? 'info'
                                : t.taxType === 'PPh21'
                                ? 'warning'
                                : t.taxType === 'PPh25'
                                ? 'success'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {t.taxType}
                          </Badge>
                          <span className="font-mono text-[11px] text-slate-500 font-semibold">
                            {t.taxCode}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {t.withholdingSlipNumber || t.sourceDocNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {formatIndoDate(t.transactionDate)}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate">{t.partyName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{t.partyNpwp || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                        {formatRupiah(t.dpp)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {t.taxRate}%
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                          isCredit ? 'text-blue-700' : 'text-rose-700'
                        }`}
                      >
                        {formatRupiah(t.taxAmount)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isCredit
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {isCredit ? 'Kredit Pajak (Prepaid)' : 'Hutang Pajak (Withheld)'}
                          </span>
                          {t.ntpn && (
                            <p className="text-[10px] font-mono text-emerald-700 font-semibold">
                              NTPN: {t.ntpn}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={
                            t.paymentStatus === 'paid'
                              ? 'success'
                              : t.paymentStatus === 'credited'
                              ? 'info'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {t.paymentStatus === 'paid'
                            ? 'Lunas'
                            : t.paymentStatus === 'credited'
                            ? 'Dikreditkan'
                            : 'Belum Setor'}
                        </Badge>
                      </td>
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onDrilldown(t)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Drill-down Detail"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
