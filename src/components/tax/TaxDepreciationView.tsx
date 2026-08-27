import React, { useState } from 'react';
import { FixedAssetItem, FiscalAssetCategory } from '../../types/tax';
import { TaxService } from '../../lib/taxService';
import { formatRupiah, exportToCSV } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Download,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  Calculator,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

interface TaxDepreciationViewProps {
  assets: FixedAssetItem[];
  year: number;
  onRefresh?: () => void;
}

export const TaxDepreciationView: React.FC<TaxDepreciationViewProps> = ({
  assets,
  year,
  onRefresh = () => {},
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAssetItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Peralatan & Komputer');
  const [acquisitionDate, setAcquisitionDate] = useState('2025-01-01');
  const [acquisitionCost, setAcquisitionCost] = useState<number>(0);
  const [commercialUsefulLifeYears, setCommercialUsefulLifeYears] = useState<number>(4);
  const [fiscalCategory, setFiscalCategory] = useState<FiscalAssetCategory>('group_1');
  const [notes, setNotes] = useState('');

  const totalAcquisition = assets.reduce((sum, a) => sum + a.acquisitionCost, 0);
  const totalCommDep = assets.reduce((sum, a) => sum + a.commercialDepreciationAnnual, 0);
  const totalFiscDep = assets.reduce((sum, a) => sum + a.fiscalDepreciationAnnual, 0);
  const totalDiff = totalCommDep - totalFiscDep;
  const totalNetBookValue = assets.reduce((sum, a) => sum + a.bookValueCommercial, 0);

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setName('');
    setCategory('Peralatan & Komputer');
    setAcquisitionDate(`${year}-01-15`);
    setAcquisitionCost(10000000);
    setCommercialUsefulLifeYears(4);
    setFiscalCategory('group_1');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FixedAssetItem) => {
    setEditingAsset(item);
    setName(item.name);
    setCategory(item.category);
    setAcquisitionDate(item.acquisitionDate);
    setAcquisitionCost(item.acquisitionCost);
    setCommercialUsefulLifeYears(item.commercialUsefulLifeYears);
    setFiscalCategory(item.fiscalCategory);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || acquisitionCost <= 0) {
      alert('Mohon lengkapi nama aset dan nilai perolehan.');
      return;
    }

    let fiscalLife = 4;
    let fiscalRate = 25;
    if (fiscalCategory === 'group_1') {
      fiscalLife = 4;
      fiscalRate = 25;
    } else if (fiscalCategory === 'group_2') {
      fiscalLife = 8;
      fiscalRate = 12.5;
    } else if (fiscalCategory === 'group_3') {
      fiscalLife = 16;
      fiscalRate = 6.25;
    } else if (fiscalCategory === 'group_4') {
      fiscalLife = 20;
      fiscalRate = 5;
    } else if (fiscalCategory === 'building_permanent') {
      fiscalLife = 20;
      fiscalRate = 5;
    } else if (fiscalCategory === 'building_non_permanent') {
      fiscalLife = 10;
      fiscalRate = 10;
    }

    TaxService.saveFixedAsset({
      id: editingAsset ? editingAsset.id : undefined,
      name,
      category,
      acquisitionDate,
      acquisitionCost,
      commercialUsefulLifeYears,
      commercialMethod: 'straight_line',
      fiscalCategory,
      fiscalUsefulLifeYears: fiscalLife,
      fiscalMethod: 'straight_line',
      fiscalRate,
      status: 'verified',
      notes,
    });

    setIsModalOpen(false);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan aset tetap ini?')) {
      TaxService.deleteFixedAsset(id);
      onRefresh();
    }
  };

  const handleExportCSV = () => {
    const data = assets.map((a) => ({
      'Kode Aset': a.code,
      'Nama Aset': a.name,
      'Kategori': a.category,
      'Tgl Perolehan': a.acquisitionDate,
      'Harga Perolehan (Rp)': a.acquisitionCost,
      'Masa Manfaat Komersial (Th)': a.commercialUsefulLifeYears,
      'Golongan Fiskal': a.fiscalCategory,
      'Masa Manfaat Fiskal (Th)': a.fiscalUsefulLifeYears,
      'Tarif Fiskal (%)': `${a.fiscalRate}%`,
      'Penyusutan Komersial (Rp)': a.commercialDepreciationAnnual,
      'Penyusutan Fiskal (Rp)': a.fiscalDepreciationAnnual,
      'Selisih / Beda Waktu (Rp)': a.depreciationDifference,
      'Nilai Buku Komersial (Rp)': a.bookValueCommercial,
    }));
    exportToCSV(`Daftar_Penyusutan_Fiskal_PMK72_${year}`, data);
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Nilai Perolehan Aset
          </span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
            {formatRupiah(totalAcquisition)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">{assets.length} Aset Terdaftar</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Penyusutan Komersial Tahunan
          </span>
          <p className="text-xl font-bold text-blue-600 mt-1 font-mono tracking-tight">
            {formatRupiah(totalCommDep)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">Dicatat di Beban Laba Rugi</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Penyusutan Fiskal (PMK 72/2023)
          </span>
          <p className="text-xl font-bold text-emerald-600 mt-1 font-mono tracking-tight">
            {formatRupiah(totalFiscDep)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">Dasar Pengurang Laba Fiskal</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Selisih Beda Waktu (Koreksi)
          </span>
          <p
            className={`text-xl font-bold mt-1 font-mono tracking-tight ${
              totalDiff > 0 ? 'text-purple-600' : 'text-slate-700'
            }`}
          >
            {totalDiff > 0 ? `+${formatRupiah(totalDiff)}` : formatRupiah(totalDiff)}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalDiff > 0 ? 'Koreksi Fiskal Positif' : 'Tidak Ada Selisih'}
          </div>
        </div>
      </div>

      {/* Action Header & Regulation Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftar Aset Tetap & Amortisasi Fiskal
            </h3>
            <p className="text-xs text-slate-500">
              Sesuai PMK No. 72 Tahun 2023 dan Pasal 11 Undang-Undang Pajak Penghasilan (UU HPP)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdd} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Tambah Aset Baru
            </Button>
          </div>
        </div>

        {/* PMK Reference Info */}
        <div className="mt-4 p-3.5 bg-blue-50/60 rounded-lg border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Ketentuan Golongan Fiskal (Metode Garis Lurus):</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              <div>• <strong>Golongan 1:</strong> 4 Tahun (25%)</div>
              <div>• <strong>Golongan 2:</strong> 8 Tahun (12.5%)</div>
              <div>• <strong>Golongan 3:</strong> 16 Tahun (6.25%)</div>
              <div>• <strong>Bangunan Permanen:</strong> 20 Tahun (5%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Aset & Kode</th>
                <th className="py-3 px-3">Tgl Perolehan</th>
                <th className="py-3 px-3 text-right">Nilai Perolehan</th>
                <th className="py-3 px-3 text-center">Umur Komersial</th>
                <th className="py-3 px-3 text-center">Golongan Fiskal</th>
                <th className="py-3 px-3 text-right">Peny. Komersial</th>
                <th className="py-3 px-3 text-right">Peny. Fiskal</th>
                <th className="py-3 px-3 text-right">Selisih (Beda Waktu)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{asset.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <span>{asset.code}</span>
                      <span>•</span>
                      <span>{asset.category}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                    {asset.acquisitionDate}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                    {formatRupiah(asset.acquisitionCost)}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-700">
                    {asset.commercialUsefulLifeYears} Tahun
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant="neutral" size="sm">
                      {asset.fiscalCategory.toUpperCase()} ({asset.fiscalUsefulLifeYears} Th / {asset.fiscalRate}%)
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-600">
                    {formatRupiah(asset.commercialDepreciationAnnual)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600">
                    {formatRupiah(asset.fiscalDepreciationAnnual)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {asset.depreciationDifference > 0 ? (
                      <span className="text-purple-600">+{formatRupiah(asset.depreciationDifference)}</span>
                    ) : asset.depreciationDifference < 0 ? (
                      <span className="text-amber-600">({formatRupiah(Math.abs(asset.depreciationDifference))})</span>
                    ) : (
                      <span className="text-slate-400">Rp 0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant={asset.status === 'verified' ? 'success' : 'warning'} size="sm">
                      {asset.status === 'verified' ? 'Terverifikasi' : 'Perlu Review'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(asset)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Aset"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Hapus Aset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit Aset */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingAsset ? 'Edit Data Aset Tetap' : 'Tambah Aset Tetap Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Aset Tetap *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Laptop MacBook Pro M3 Tim IT"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Akuntansi</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Peralatan & Komputer">Peralatan & Komputer</option>
                    <option value="Kendaraan">Kendaraan</option>
                    <option value="Peralatan & Inventaris">Peralatan & Inventaris</option>
                    <option value="Gedung & Bangunan">Gedung & Bangunan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Perolehan *</label>
                  <input
                    type="date"
                    required
                    value={acquisitionDate}
                    onChange={(e) => setAcquisitionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai Perolehan (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={acquisitionCost || ''}
                  onChange={(e) => setAcquisitionCost(Number(e.target.value))}
                  placeholder="Misal: 25000000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Masa Manfaat Komersial</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={commercialUsefulLifeYears}
                    onChange={(e) => setCommercialUsefulLifeYears(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">Tahun (kebijakan internal)</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Golongan Fiskal (PMK 72)</label>
                  <select
                    value={fiscalCategory}
                    onChange={(e) => setFiscalCategory(e.target.value as FiscalAssetCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="group_1">Golongan 1 (4 Th - 25%)</option>
                    <option value="group_2">Golongan 2 (8 Th - 12.5%)</option>
                    <option value="group_3">Golongan 3 (16 Th - 6.25%)</option>
                    <option value="group_4">Golongan 4 (20 Th - 5%)</option>
                    <option value="building_permanent">Bangunan Permanen (20 Th - 5%)</option>
                    <option value="building_non_permanent">Bangunan Non-Permanen (10 Th - 10%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Bukti Pembelian</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Faktur Pajak Masukan No. 010.001-26.11223344"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Simpan Aset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
