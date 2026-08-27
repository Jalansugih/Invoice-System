import React, { useState } from 'react';
import { TaxTransaction } from '../../types/tax';
import { formatRupiah, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Coins,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface TaxCreditsViewProps {
  taxTransactions?: TaxTransaction[];
  credits?: TaxTransaction[];
  year: number;
  onRefresh?: () => void;
  onAddCredit?: () => void;
}

export const TaxCreditsView: React.FC<TaxCreditsViewProps> = ({
  taxTransactions = [],
  credits = [],
  year,
  onRefresh,
  onAddCredit,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allTx = credits.length > 0 ? credits : taxTransactions;

  // Tax credit transactions are prepayments/withholdings: PPh 23 (withheld by customers), PPh 22, PPh 25 (monthly installments)
  const creditTaxes = allTx.filter(
    (t) =>
      t.taxType === 'PPh23' ||
      t.taxType === 'PPh22' ||
      t.taxType === 'PPh25' ||
      (t.taxType === 'PPhFinal' && t.paymentStatus === 'paid')
  );

  const filteredCredits = creditTaxes.filter((t) => {
    if (selectedType !== 'all' && t.taxType !== selectedType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        t.partyName.toLowerCase().includes(q) ||
        t.partyNpwp.toLowerCase().includes(q) ||
        (t.withholdingSlipNumber && t.withholdingSlipNumber.toLowerCase().includes(q)) ||
        (t.taxInvoiceNumber && t.taxInvoiceNumber.toLowerCase().includes(q)) ||
        (t.sourceDocNumber && t.sourceDocNumber.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalPph23 = creditTaxes
    .filter((t) => t.taxType === 'PPh23')
    .reduce((sum, t) => sum + t.taxAmount, 0);

  const totalPph22 = creditTaxes
    .filter((t) => t.taxType === 'PPh22')
    .reduce((sum, t) => sum + t.taxAmount, 0);

  const totalPph25 = creditTaxes
    .filter((t) => t.taxType === 'PPh25')
    .reduce((sum, t) => sum + t.taxAmount, 0);

  const totalTaxCredits = totalPph23 + totalPph22 + totalPph25;

  const handleExportCSV = () => {
    const data = filteredCredits.map((t) => ({
      'No. Bukti Potong / NTPN': t.withholdingSlipNumber || t.ntpn || t.taxInvoiceNumber || t.sourceDocNumber,
      'Jenis PPh': t.taxType,
      'Nama Pemotong / Pihak': t.partyName,
      'NPWP Pemotong': t.partyNpwp,
      'Tanggal Bukti Potong': t.transactionDate,
      'Masa / Tahun': `${t.periodMonth}/${t.periodYear}`,
      'DPP / Objek Pemotongan (Rp)': t.dpp,
      'Tarif Pajak (%)': `${t.taxRate}%`,
      'Jumlah PPh Dipotong (Rp)': t.taxAmount,
      'Status Dokumen': t.isCreditable ? 'Dapat Dikreditkan' : 'Perlu Verifikasi',
    }));
    exportToCSV(`Kredit_Pajak_SPT1771_${year}`, data);
  };

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Kredit Pajak (Lampiran III)
          </span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {formatRupiah(totalTaxCredits)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            Pengurang PPh Terutang Tahun {year}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            PPh Pasal 23 (Dipotong Klien)
          </span>
          <p className="text-xl font-bold text-blue-600 mt-1 font-mono tracking-tight">
            {formatRupiah(totalPph23)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">Jasa & Sewa Non-Final</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            PPh Pasal 22 (Instansi/Impor)
          </span>
          <p className="text-xl font-bold text-emerald-600 mt-1 font-mono tracking-tight">
            {formatRupiah(totalPph22)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">Pembelian oleh BUMN/Pemerintah</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            PPh Pasal 25 (Angsuran Sendiri)
          </span>
          <p className="text-xl font-bold text-purple-600 mt-1 font-mono tracking-tight">
            {formatRupiah(totalPph25)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">Setoran Masa Berjalan</div>
        </div>
      </div>

      {/* Control Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pusat Kredit Pajak & Bukti Potong (e-Bupot Unifikasi)
            </h3>
            <p className="text-xs text-slate-500">
              Sinkronisasi bukti potong yang dapat dikreditkan pada SPT Tahunan Badan Formulir 1771-III
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV / Excel
            </Button>
            {onAddCredit && (
              <Button size="sm" onClick={onAddCredit} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Tambah Bukti
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                selectedType === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Jenis Kredit
            </button>
            <button
              onClick={() => setSelectedType('PPh23')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                selectedType === 'PPh23'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              PPh 23 Dipotong ({creditTaxes.filter((t) => t.taxType === 'PPh23').length})
            </button>
            <button
              onClick={() => setSelectedType('PPh22')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                selectedType === 'PPh22'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              PPh 22 ({creditTaxes.filter((t) => t.taxType === 'PPh22').length})
            </button>
            <button
              onClick={() => setSelectedType('PPh25')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                selectedType === 'PPh25'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              PPh 25 Angsuran ({creditTaxes.filter((t) => t.taxType === 'PPh25').length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari bukti potong / NPWP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Credit Taxes Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Bukti Potong / NTPN</th>
                <th className="py-3 px-3">Jenis PPh</th>
                <th className="py-3 px-3">Pemotong / Rekanan</th>
                <th className="py-3 px-3">NPWP Pemotong</th>
                <th className="py-3 px-3">Tanggal Bukti</th>
                <th className="py-3 px-3 text-right">DPP Objek</th>
                <th className="py-3 px-3 text-right">PPh Dipotong</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCredits.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {item.withholdingSlipNumber || item.ntpn || item.taxInvoiceNumber || item.sourceDocNumber || 'DRAFT-BUPOT'}
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant="neutral" size="sm">
                      {item.taxType}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{item.partyName}</div>
                    <div className="text-[11px] text-slate-500">{item.notes || item.sourceDocNumber}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">{item.partyNpwp}</td>
                  <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                    {item.transactionDate}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">
                    {formatRupiah(item.dpp)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                    {formatRupiah(item.taxAmount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant={item.paymentStatus === 'paid' || item.isCreditable ? 'success' : 'info'} size="sm">
                      {item.paymentStatus === 'paid' || item.isCreditable ? 'Tervalidasi DJP' : 'Draf Sistem'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
