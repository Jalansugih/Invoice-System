import React, { useState } from 'react';
import { FiscalCorrection, CorporateIncomeTaxSummary } from '../../types/tax';
import { TaxService } from '../../lib/taxService';
import { formatRupiah, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit3,
  Calculator,
  ShieldCheck,
  Download,
  Info,
  Check,
  X,
  Building2,
  TrendingUp,
  Percent,
  Sparkles,
} from 'lucide-react';

interface TaxCorporateIncomeViewProps {
  year: number;
  citSummary: CorporateIncomeTaxSummary;
  corrections: FiscalCorrection[];
  onRefresh: () => void;
}

export const TaxCorporateIncomeView: React.FC<TaxCorporateIncomeViewProps> = ({
  year,
  citSummary,
  corrections,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCorrection, setEditingCorrection] = useState<FiscalCorrection | null>(null);

  // Form State
  const [accountCode, setAccountCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [commercialAmount, setCommercialAmount] = useState<number>(0);
  const [positiveCorrection, setPositiveCorrection] = useState<number>(0);
  const [negativeCorrection, setNegativeCorrection] = useState<number>(0);
  const [category, setCategory] = useState<FiscalCorrection['category']>('non_deductible_expense');
  const [reason, setReason] = useState('');
  const [legalBasis, setLegalBasis] = useState('Pasal 9 ayat (1) UU PPh');

  const handleOpenCreate = () => {
    setEditingCorrection(null);
    setAccountCode('6-2005');
    setAccountName('');
    setCommercialAmount(0);
    setPositiveCorrection(0);
    setNegativeCorrection(0);
    setCategory('non_deductible_expense');
    setReason('');
    setLegalBasis('Pasal 9 ayat (1) UU PPh');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FiscalCorrection) => {
    setEditingCorrection(item);
    setAccountCode(item.accountCode);
    setAccountName(item.accountName);
    setCommercialAmount(item.commercialAmount);
    setPositiveCorrection(item.positiveCorrection);
    setNegativeCorrection(item.negativeCorrection);
    setCategory(item.category);
    setReason(item.reason);
    setLegalBasis(item.legalBasis);
    setIsModalOpen(true);
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || (positiveCorrection === 0 && negativeCorrection === 0)) {
      alert('Mohon isi nama akun dan nilai koreksi fiskal.');
      return;
    }

    TaxService.saveFiscalCorrection({
      id: editingCorrection ? editingCorrection.id : undefined,
      year,
      accountCode,
      accountName,
      commercialAmount,
      positiveCorrection,
      negativeCorrection,
      category,
      categoryLabel:
        positiveCorrection > 0 ? 'Koreksi Fiskal Positif' : 'Koreksi Fiskal Negatif',
      reason,
      legalBasis,
    });

    setIsModalOpen(false);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus item koreksi fiskal ini?')) {
      TaxService.deleteFiscalCorrection(id);
      onRefresh();
    }
  };

  const handleExportCSV = () => {
    const data = corrections.map((c) => ({
      'Tahun Pajak': c.year,
      'Kode Akun': c.accountCode,
      'Nama Akun GL': c.accountName,
      'Komersial (Rp)': c.commercialAmount,
      'Koreksi Positif (Rp)': c.positiveCorrection,
      'Koreksi Negatif (Rp)': c.negativeCorrection,
      'Fiskal (Rp)': c.fiscalAmount,
      'Keterangan': c.reason,
      'Dasar Hukum': c.legalBasis,
    }));
    exportToCSV(`Rekonsiliasi_Fiskal_SPT1771_${year}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Executive PPh Badan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Laba Bersih Komersial (Sebelum Pajak)
          </span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {formatRupiah(citSummary.commercialNetProfitBeforeTax)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Dari Laporan Laba Rugi Akuntansi {year}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Koreksi Fiskal Bersih
          </span>
          <p className="text-xl font-bold text-purple-600 mt-1 font-mono tracking-tight">
            +{formatRupiah(citSummary.totalPositiveCorrections - citSummary.totalNegativeCorrections)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
            <span className="text-rose-600 font-semibold">+{formatRupiah(citSummary.totalPositiveCorrections)} Positif</span>
            <span className="text-emerald-600 font-semibold">-{formatRupiah(citSummary.totalNegativeCorrections)} Negatif</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Penghasilan Kena Pajak (PKP)
          </span>
          <p className="text-xl font-bold text-blue-600 mt-1 font-mono tracking-tight">
            {formatRupiah(citSummary.taxableIncome)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Dasar pengenaan tarif PPh Badan Form 1771
          </p>
        </div>

        <div
          className={`border rounded-xl p-4 shadow-xs ${
            citSummary.taxUnderpaidOverpaid > 0
              ? 'bg-rose-50/40 border-rose-200'
              : 'bg-emerald-50/40 border-emerald-200'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            PPh Kurang / (Lebih) Bayar (Ps. 29/28A)
          </span>
          <p
            className={`text-xl font-bold mt-1 font-mono tracking-tight ${
              citSummary.taxUnderpaidOverpaid > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {citSummary.taxUnderpaidOverpaid > 0
              ? formatRupiah(citSummary.taxUnderpaidOverpaid)
              : `(${formatRupiah(Math.abs(citSummary.taxUnderpaidOverpaid))})`}
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            {citSummary.taxUnderpaidOverpaid > 0
              ? 'Kurang Bayar Pasal 29 disetor via SSP'
              : 'Lebih Bayar Pasal 28A dapat direstitusi/kompensasi'}
          </p>
        </div>
      </div>

      {/* Fasilitas Pasal 31E UU HPP Calculation Showcase Card */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm">
                Fasilitas Pajak UU HPP No. 7/2021
              </Badge>
              <span className="text-xs text-blue-200 font-mono">Pasal 31E ayat (1)</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Perhitungan PPh Badan dengan Pengurangan Tarif 50%
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Wajib Pajak Badan dalam negeri dengan peredaran bruto s/d Rp 50 Miliar mendapat fasilitas pengurangan tarif sebesar 50% dari tarif 22% (<strong>Tarif Efektif 11%</strong>) atas Penghasilan Kena Pajak dari bagian peredaran bruto sampai dengan Rp 4,8 Miliar.
            </p>
          </div>

          {/* Breakdown Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 min-w-[300px] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-300">Total Omzet Bruto:</span>
              <span className="font-mono font-bold">{formatRupiah(citSummary.grossRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Batas Fasilitas Psl 31E:</span>
              <span className="font-mono font-bold text-amber-300">Rp 4.800.000.000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Tarif Fasilitas 50% x 22%:</span>
              <span className="font-mono font-bold text-emerald-300">11% (Efektif)</span>
            </div>
            <div className="pt-2 border-t border-white/20 flex justify-between text-sm">
              <span className="font-bold">PPh Terutang Badan:</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatRupiah(citSummary.taxPayableFinal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Credits Summary Breakdown Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Kredit Pajak Pengurang PPh Badan (Tax Credits Form 1771-III & IV)
          </p>
          <span className="font-mono font-bold text-blue-800 text-sm">
            Total Kredit: {formatRupiah(citSummary.totalTaxCredits)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px]">PPh 22 (Pengadaan / Impor):</span>
            <span className="font-mono font-bold text-slate-900 mt-1 block">
              {formatRupiah(citSummary.taxCreditPph22)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px]">PPh 23 (Bukti Potong Jasa & Royalti):</span>
            <span className="font-mono font-bold text-slate-900 mt-1 block">
              {formatRupiah(citSummary.taxCreditPph23)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[11px]">PPh 25 (Setoran Angsuran Bulanan):</span>
            <span className="font-mono font-bold text-slate-900 mt-1 block">
              {formatRupiah(citSummary.taxCreditPph25Installments)}
            </span>
          </div>
        </div>
      </div>

      {/* Fiscal Corrections Table */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Kertas Kerja Rekonsiliasi Fiskal (Form SPT 1771-I)
            </h4>
            <p className="text-xs text-slate-500">
              Penyesuaian laba akuntansi komersial menjadi penghasilan neto fiskal sesuai UU PPh
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + Tambah Koreksi Fiskal
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Ekspor Rekonsiliasi CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Kode & Akun Komersial</th>
                <th className="py-3 px-4 text-right">Komersial (Rp)</th>
                <th className="py-3 px-4 text-right text-rose-600">Koreksi Positif (+)</th>
                <th className="py-3 px-4 text-right text-emerald-600">Koreksi Negatif (-)</th>
                <th className="py-3 px-4 text-right">Fiskal (Rp)</th>
                <th className="py-3 px-4">Keterangan / Alasan</th>
                <th className="py-3 px-4">Dasar Hukum</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {corrections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada item koreksi fiskal. Klik tombol di atas untuk menambahkan.
                  </td>
                </tr>
              ) : (
                corrections.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-500">
                          {c.accountCode}
                        </span>
                        <span className="font-semibold text-slate-900">{c.accountName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatRupiah(c.commercialAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                      {c.positiveCorrection > 0 ? `+${formatRupiah(c.positiveCorrection)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {c.negativeCorrection > 0 ? `-${formatRupiah(c.negativeCorrection)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(c.fiscalAmount)}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600 truncate">
                      {c.reason}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-500 font-mono text-[11px] truncate">
                      {c.legalBasis}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
              <tr>
                <td className="py-3 px-4">TOTAL KOREKSI FISKAL</td>
                <td className="py-3 px-4 text-right font-mono">
                  {formatRupiah(corrections.reduce((sum, c) => sum + c.commercialAmount, 0))}
                </td>
                <td className="py-3 px-4 text-right font-mono text-rose-600">
                  +{formatRupiah(citSummary.totalPositiveCorrections)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-600">
                  -{formatRupiah(citSummary.totalNegativeCorrections)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-blue-700">
                  {formatRupiah(corrections.reduce((sum, c) => sum + c.fiscalAmount, 0))}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Fiscal Correction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingCorrection ? 'Edit Item Koreksi Fiskal' : 'Tambah Koreksi Fiskal Positif/Negatif'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Akun GL
                  </label>
                  <Input
                    value={accountCode}
                    onChange={(e) => setAccountCode(e.target.value)}
                    placeholder="6-2005"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Akun Komersial
                  </label>
                  <Input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Beban Jamuan Tanpa Daftar Nominatif"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nilai Beban / Pendapatan Komersial (Rp)
                </label>
                <Input
                  type="number"
                  value={commercialAmount || ''}
                  onChange={(e) => setCommercialAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">
                    Koreksi Positif (Menambah Laba)
                  </label>
                  <Input
                    type="number"
                    value={positiveCorrection || ''}
                    onChange={(e) => {
                      setPositiveCorrection(parseFloat(e.target.value) || 0);
                      if (parseFloat(e.target.value) > 0) setNegativeCorrection(0);
                    }}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                    Koreksi Negatif (Mengurangi Laba)
                  </label>
                  <Input
                    type="number"
                    value={negativeCorrection || ''}
                    onChange={(e) => {
                      setNegativeCorrection(parseFloat(e.target.value) || 0);
                      if (parseFloat(e.target.value) > 0) setPositiveCorrection(0);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori Koreksi
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800"
                >
                  <option value="entertainment_non_nominative">Beban Entertainment Non-Nominatif (PMK 02/2010)</option>
                  <option value="non_deductible_expense">Beban Natura / Non-Deductible (Pasal 9 UU PPh)</option>
                  <option value="depreciation_diff">Beda Waktu Penyusutan Fiskal vs Komersial</option>
                  <option value="tax_penalty">Sanksi Denda & Bunga Keterlambatan Pajak</option>
                  <option value="final_tax_income">Pendapatan Dikenakan PPh Final (Bunga Deposito)</option>
                  <option value="other">Koreksi Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alasan & Keterangan Koreksi
                </label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Penjelasan fiskal kenapa tidak dapat dibiayakan"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dasar Hukum Perpajakan
                </label>
                <Input
                  value={legalBasis}
                  onChange={(e) => setLegalBasis(e.target.value)}
                  placeholder="Pasal 9 ayat (1) UU PPh & PMK No. ..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Simpan Koreksi Fiskal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
