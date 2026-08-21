import React, { useState } from 'react';
import { TaxRateConfig, TaxType } from '../../types/tax';
import { TaxService } from '../../lib/taxService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { X, Settings, Plus, Check, Edit3, ShieldAlert } from 'lucide-react';

interface TaxConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const TaxConfigModal: React.FC<TaxConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [configs, setConfigs] = useState<TaxRateConfig[]>(TaxService.getTaxConfigs());
  const [editingConfig, setEditingConfig] = useState<TaxRateConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [taxType, setTaxType] = useState<TaxType>('PPN');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState<number>(11);
  const [kap, setKap] = useState('411211');
  const [kjs, setKjs] = useState('100');
  const [legalBasis, setLegalBasis] = useState('UU HPP No. 7/2021');
  const [isDeductible, setIsDeductible] = useState(true);

  if (!isOpen) return null;

  const reloadConfigs = () => {
    setConfigs(TaxService.getTaxConfigs());
  };

  const handleStartEdit = (cfg: TaxRateConfig) => {
    setEditingConfig(cfg);
    setIsCreating(false);
    setTaxType(cfg.taxType);
    setCode(cfg.code);
    setName(cfg.name);
    setCategory(cfg.category);
    setDescription(cfg.description);
    setRate(cfg.rate);
    setKap(cfg.kap);
    setKjs(cfg.kjs);
    setLegalBasis(cfg.legalBasis);
    setIsDeductible(cfg.isDeductible);
  };

  const handleStartCreate = () => {
    setEditingConfig(null);
    setIsCreating(true);
    setTaxType('PPh23');
    setCode('');
    setName('');
    setCategory('PPh Pemotongan');
    setDescription('');
    setRate(2);
    setKap('411124');
    setKjs('104');
    setLegalBasis('PMK No. 141/PMK.03/2015');
    setIsDeductible(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert('Mohon lengkapi kode dan nama tarif pajak.');
      return;
    }

    TaxService.saveTaxConfig({
      id: editingConfig ? editingConfig.id : undefined,
      taxType,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      rate: Number(rate) || 0,
      kap: kap.trim(),
      kjs: kjs.trim(),
      legalBasis: legalBasis.trim(),
      isDeductible,
      isActive: true,
    });

    setEditingConfig(null);
    setIsCreating(false);
    reloadConfigs();
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sistem Konfigurasi & Master Tarif Pajak
              </h3>
              <p className="text-xs text-slate-500">
                Sesuaikan tarif, Kode Akun Pajak (KAP), Kode Jenis Setoran (KJS), dan aturan tanpa merombak sistem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">
              Daftar Objek & Aturan Pajak Aktif ({configs.length})
            </p>
            {!isCreating && !editingConfig && (
              <Button
                size="sm"
                onClick={handleStartCreate}
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                + Tambah Objek / Tarif Pajak
              </Button>
            )}
          </div>

          {/* Form Create/Edit Drawer */}
          {(isCreating || editingConfig) && (
            <form onSubmit={handleSave} className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/70 pb-3">
                <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  {isCreating ? 'Tambah Objek Tarif Pajak Baru' : `Edit Konfigurasi: ${editingConfig?.name}`}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingConfig(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenis Pajak
                  </label>
                  <select
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as TaxType)}
                    className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PPN">PPN (Pajak Pertambahan Nilai)</option>
                    <option value="PPh21">PPh 21 (Gaji / Tenaga Ahli)</option>
                    <option value="PPh22">PPh 22 (Pengadaan / Impor)</option>
                    <option value="PPh23">PPh 23 (Jasa / Royalti / Bunga)</option>
                    <option value="PPh25">PPh 25 (Angsuran Pajak)</option>
                    <option value="PPh26">PPh 26 (Subjek Luar Negeri)</option>
                    <option value="PPhFinal">PPh Final Pasal 4 ayat (2)</option>
                    <option value="PPhBadan">PPh Badan (Tahunan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Pajak (Tax Code)
                  </label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: PPH23-JASA-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tarif (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                    placeholder="11"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Objek / Deskripsi Ringkas
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: PPh 23 Jasa Manajemen & Konsultan"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori / Kelompok
                  </label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Contoh: Jasa Teknik & Konsultan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Akun Pajak (KAP)
                  </label>
                  <Input
                    value={kap}
                    onChange={(e) => setKap(e.target.value)}
                    placeholder="Contoh: 411124"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Jenis Setoran (KJS)
                  </label>
                  <Input
                    value={kjs}
                    onChange={(e) => setKjs(e.target.value)}
                    placeholder="Contoh: 104"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dasar Hukum / Regulasi
                  </label>
                  <Input
                    value={legalBasis}
                    onChange={(e) => setLegalBasis(e.target.value)}
                    placeholder="Contoh: PMK No. 141/2015"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chkDeductible"
                  checked={isDeductible}
                  onChange={(e) => setIsDeductible(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="chkDeductible" className="text-xs text-slate-700 cursor-pointer">
                  Dapat dikreditkan / deductible secara fiskal
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-blue-200/70">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingConfig(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Simpan Konfigurasi
                </Button>
              </div>
            </form>
          )}

          {/* Table List of Tax Configs */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama & Deskripsi Objek</th>
                  <th className="py-3 px-3 text-right">Tarif</th>
                  <th className="py-3 px-3">KAP / KJS</th>
                  <th className="py-3 px-4">Dasar Hukum</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {configs.map((cfg) => (
                  <tr key={cfg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          cfg.taxType === 'PPN'
                            ? 'info'
                            : cfg.taxType === 'PPhBadan'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {cfg.taxType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {cfg.code}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900">{cfg.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{cfg.description}</p>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                      {cfg.rate}%
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {cfg.kap} / {cfg.kjs}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                      {cfg.legalBasis}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleStartEdit(cfg)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Konfigurasi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ketentuan Kepatuhan Perpajakan</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Konfigurasi tarif ini memisahkan aturan perpajakan (Tax Rules) dari kode program aplikasi, sehingga ketika ada penyesuaian tarif regulasi DJP baru (seperti PPN 12% atau TER PPh 21), staf finance dapat memperbaruinya langsung.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};
