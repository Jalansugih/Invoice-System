import React, { useState, useRef } from 'react';
import { StorageService } from '../../lib/storage';
import { Organization, BankAccount } from '../../types';
import { SUPABASE_SQL_MIGRATION } from '../../lib/supabaseMigration';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import {
  Settings,
  Building2,
  CreditCard,
  Hash,
  Database,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Eye,
  FileSignature,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'bank' | 'formats' | 'database'>('company');
  const [org, setOrg] = useState<Organization>(StorageService.getOrganization());
  const [isSaved, setIsSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingSignature, setIsDraggingSignature] = useState(false);
  const [previewDocType, setPreviewDocType] = useState<'invoice' | 'letter' | 'receipt'>('invoice');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveOrganization(org);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const processImageFile = (file: File, callback: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid (PNG, JPG, JPEG, SVG, WebP).');
      return;
    }

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          callback(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const outputDataUrl = canvas.toDataURL(format, 0.92);
          callback(outputDataUrl);
        } else {
          callback(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, (dataUrl) => {
        setOrg((prev) => ({ ...prev, logoUrl: dataUrl }));
      });
    }
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, (dataUrl) => {
        setOrg((prev) => ({ ...prev, logoUrl: dataUrl }));
      });
    }
  };

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, (dataUrl) => {
        setOrg((prev) => ({ ...prev, signatureImage: dataUrl }));
      });
    }
  };

  const handleSignatureDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingSignature(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, (dataUrl) => {
        setOrg((prev) => ({ ...prev, signatureImage: dataUrl }));
      });
    }
  };

  const handleAddBank = () => {
    const newBank: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: 'Bank Mandiri',
      accountNumber: '',
      accountHolder: org.name,
      branch: 'KCP Jakarta Sudirman',
      isDefault: false,
    };
    setOrg({
      ...org,
      bankAccounts: [...org.bankAccounts, newBank],
    });
  };

  const handleRemoveBank = (id: string) => {
    if (org.bankAccounts.length <= 1) {
      alert('Minimal harus ada 1 rekening bank penagihan aktif.');
      return;
    }
    setOrg({
      ...org,
      bankAccounts: org.bankAccounts.filter((b) => b.id !== id),
    });
  };

  const handleBankChange = (id: string, field: keyof BankAccount, value: any) => {
    const updated = org.bankAccounts.map((b) => {
      if (b.id === id) return { ...b, [field]: value };
      return b;
    });
    setOrg({ ...org, bankAccounts: updated });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleResetData = () => {
    const proceed = confirm('Apakah Anda yakin ingin mereset seluruh data ke data demo awal?');
    if (proceed) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Pengaturan Sistem & Database Supabase
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi identitas perusahaan, logo kop surat, rekening bank, format nomor invoice, dan migrasi SQL
          </p>
        </div>

        {isSaved && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Perubahan Berhasil Disimpan
          </span>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'company', label: 'Profil & Kop Surat', icon: Building2 },
          { id: 'bank', label: 'Rekening Bank Penagihan', icon: CreditCard },
          { id: 'formats', label: 'Format Nomor Dokumen', icon: Hash },
          { id: 'database', label: 'Supabase SQL Schema', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs px-4 py-2.5 font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Company Profile & Logo / Kop Surat */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="space-y-6">
          {/* 1. Logo & Kop Surat Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-2xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  Logo Perusahaan & Kop Surat Resmi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload logo perusahaan untuk dicantumkan pada bagian kop surat dokumen cetak (Invoice, Surat Tagihan, & Kuitansi).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Logo Uploader Area */}
              <div className="md:col-span-6 space-y-4">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={handleLogoDrop}
                  onClick={() => logoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[160px] ${
                    isDraggingLogo
                      ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
                  }`}
                >
                  {org.logoUrl ? (
                    <div className="space-y-3 flex flex-col items-center">
                      <div className="relative group p-3 bg-white rounded-xl border border-slate-200 shadow-2xs max-w-[220px]">
                        <img
                          src={org.logoUrl}
                          alt="Logo Perusahaan"
                          className="max-h-20 max-w-full object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-blue-600 hover:underline flex items-center justify-center gap-1">
                          <Upload className="w-3.5 h-3.5" /> Ganti File Logo
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tarik & lepas file baru atau klik di sini</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Klik untuk Upload Logo atau Drag & Drop
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Format PNG (transparan disarankan), JPG, SVG, WebP (Maks. 2MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct URL input & Action buttons */}
                <div className="space-y-2">
                  <Input
                    label="Atau Gunakan Tautan URL Gambar Logo"
                    placeholder="https://domain.com/logo.png"
                    value={org.logoUrl || ''}
                    onChange={(e) => setOrg({ ...org, logoUrl: e.target.value })}
                  />

                  {org.logoUrl && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Logo aktif digunakan
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrg({ ...org, logoUrl: '' })}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Logo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Digital Stamp / Signature Upload Area */}
              <div className="md:col-span-6 space-y-4">
                <input
                  type="file"
                  ref={signatureInputRef}
                  onChange={handleSignatureFileChange}
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingSignature(true);
                  }}
                  onDragLeave={() => setIsDraggingSignature(false)}
                  onDrop={handleSignatureDrop}
                  onClick={() => signatureInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[160px] ${
                    isDraggingSignature
                      ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                      : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/30'
                  }`}
                >
                  {org.signatureImage ? (
                    <div className="space-y-3 flex flex-col items-center">
                      <div className="relative group p-3 bg-white rounded-xl border border-slate-200 shadow-2xs max-w-[200px]">
                        <img
                          src={org.signatureImage}
                          alt="Tanda Tangan & Cap Resmi"
                          className="max-h-16 max-w-full object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-emerald-600 hover:underline flex items-center justify-center gap-1">
                          <FileSignature className="w-3.5 h-3.5" /> Ganti Cap / Tanda Tangan
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tarik & lepas file atau klik untuk mengganti</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                        <FileSignature className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Upload Cap Perusahaan / Tanda Tangan Digital
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Format PNG transparan disarankan (Opsional)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    label="Tautan URL Gambar Cap / Tanda Tangan (Opsional)"
                    placeholder="https://domain.com/signature.png"
                    value={org.signatureImage || ''}
                    onChange={(e) => setOrg({ ...org, signatureImage: e.target.value })}
                  />

                  {org.signatureImage && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cap / Tanda Tangan Aktif
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrg({ ...org, signatureImage: '' })}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Cap
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Interactive Letterhead Print Preview */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Pratinjau Hasil Kop Surat Pada Dokumen Cetak
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  {[
                    { id: 'invoice', label: 'Faktur (Invoice)' },
                    { id: 'letter', label: 'Surat Tagihan' },
                    { id: 'receipt', label: 'Kuitansi' },
                  ].map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setPreviewDocType(doc.id as any)}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        previewDocType === doc.id
                          ? 'bg-white text-blue-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {doc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Paper Letterhead */}
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-xs max-w-2xl mx-auto">
                  {/* Kop Surat Rendering */}
                  <div className={`pb-4 ${previewDocType === 'letter' ? 'border-b-4 border-double border-slate-900' : 'border-b-2 border-slate-900'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        {org.logoUrl ? (
                          <img
                            src={org.logoUrl}
                            alt={org.name}
                            className="h-12 w-auto max-w-[140px] object-contain shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
                            {org.name ? org.name.slice(0, 2).toUpperCase() : 'BF'}
                          </div>
                        )}
                        <div>
                          <h4 className="text-base font-bold text-slate-900 leading-tight">{org.name || 'Nama Perusahaan'}</h4>
                          {org.tagline && <p className="text-[11px] text-slate-500 font-medium">{org.tagline}</p>}
                          <p className="text-[10px] text-slate-600 mt-1 leading-normal">
                            {org.address || 'Alamat Perusahaan'}, {org.city} {org.province} {org.postalCode}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            Telp: {org.phone || '-'} | Email: {org.email || '-'} | NPWP: {org.npwp || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {previewDocType === 'invoice' && 'FAKTUR / INVOICE'}
                          {previewDocType === 'letter' && 'SURAT PERINGATAN'}
                          {previewDocType === 'receipt' && 'KUITANSI PEMBAYARAN'}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-700">
                          {previewDocType === 'invoice' && 'INV/2026/08/00001'}
                          {previewDocType === 'letter' && 'ST/2026/08/00001'}
                          {previewDocType === 'receipt' && 'KWT/2026/08/00001'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-400 italic text-center">
                    [ Konten rincian item transaksi dokumen dicetak di bawah garis kop surat ini ]
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Text Fields for Company Identity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-2xs">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-900">Rincian Teks Identitas Perusahaan</h3>
              <p className="text-xs text-slate-500">Informasi ini otomatis dicantumkan pada teks kop surat dan penandatangan dokumen.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama Perusahaan / Merk Dagang"
                value={org.name}
                onChange={(e) => setOrg({ ...org, name: e.target.value })}
                required
              />
              <Input
                label="Tagline / Bidang Usaha"
                value={org.tagline}
                onChange={(e) => setOrg({ ...org, tagline: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="NPWP Perusahaan"
                value={org.npwp}
                onChange={(e) => setOrg({ ...org, npwp: e.target.value })}
                required
              />
              <Input
                label="Email Resmi Finance"
                value={org.email}
                onChange={(e) => setOrg({ ...org, email: e.target.value })}
                required
              />
              <Input
                label="No. Telepon / Hotline"
                value={org.phone}
                onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-4">
              <Input
                label="Alamat Kantor Pusat"
                value={org.address}
                onChange={(e) => setOrg({ ...org, address: e.target.value })}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Kota"
                  value={org.city}
                  onChange={(e) => setOrg({ ...org, city: e.target.value })}
                  required
                />
                <Input
                  label="Provinsi"
                  value={org.province}
                  onChange={(e) => setOrg({ ...org, province: e.target.value })}
                  required
                />
                <Input
                  label="Kode Pos"
                  value={org.postalCode}
                  onChange={(e) => setOrg({ ...org, postalCode: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Nama Pejabat Penandatangan"
                value={org.directorName || org.signatureName || ''}
                onChange={(e) => setOrg({ ...org, directorName: e.target.value, signatureName: e.target.value })}
                helperText="Tertera pada kolom tanda tangan dokumen resmi"
              />
              <Input
                label="Default Termin Jatuh Tempo (Hari)"
                type="number"
                value={org.defaultPaymentTermsDays}
                onChange={(e) => setOrg({ ...org, defaultPaymentTermsDays: Number(e.target.value) })}
              />
              <Input
                label="Default Tarif PPN (%)"
                type="number"
                value={org.defaultTaxRate}
                onChange={(e) => setOrg({ ...org, defaultTaxRate: Number(e.target.value) })}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                Simpan Profil & Kop Surat
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Bank Accounts */}
      {activeTab === 'bank' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Rekening Bank Penagihan</h3>
              <p className="text-xs text-slate-500">Nomor rekening transfer yang dicantumkan pada instruksi pembayaran invoice.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBank}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Tambah Rekening
            </Button>
          </div>

          <div className="space-y-4">
            {org.bankAccounts.map((bank, index) => (
              <div
                key={bank.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Rekening #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBank(bank.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Hapus Rekening"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nama Bank"
                    placeholder="Bank Central Asia (BCA)"
                    value={bank.bankName}
                    onChange={(e) => handleBankChange(bank.id, 'bankName', e.target.value)}
                  />
                  <Input
                    label="Nomor Rekening"
                    placeholder="8830-192-881"
                    value={bank.accountNumber}
                    onChange={(e) => handleBankChange(bank.id, 'accountNumber', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Atas Nama (Account Holder)"
                    placeholder="PT BillingFlow Solusi Indonesia"
                    value={bank.accountHolder}
                    onChange={(e) => handleBankChange(bank.id, 'accountHolder', e.target.value)}
                  />
                  <Input
                    label="Kantor Cabang"
                    placeholder="KCU Jakarta Thamrin"
                    value={bank.branch || ''}
                    onChange={(e) => handleBankChange(bank.id, 'branch', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                StorageService.saveOrganization(org);
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 3000);
              }}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Simpan Daftar Rekening
            </Button>
          </div>
        </div>
      )}

      {/* Tab 3: Document Formats */}
      {activeTab === 'formats' && (
        <form onSubmit={handleSaveCompany} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-2xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900">Format Penomoran Otomatis Dokumen</h3>
            <p className="text-xs text-slate-500">Pola prefix dan urutan penomoran invoice, kuitansi, dan surat tagihan.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Prefix Invoice"
              value={org.invoicePrefix || 'INV'}
              onChange={(e) => setOrg({ ...org, invoicePrefix: e.target.value })}
              helperText="Contoh hasil: INV/2026/08/00001"
            />
            <Input
              label="Prefix Surat Tagihan"
              value={org.billingLetterPrefix || 'ST'}
              onChange={(e) => setOrg({ ...org, billingLetterPrefix: e.target.value })}
              helperText="Contoh hasil: ST/2026/08/00001"
            />
            <Input
              label="Prefix Kuitansi Pembayaran"
              value={org.receiptPrefix || 'KWT'}
              onChange={(e) => setOrg({ ...org, receiptPrefix: e.target.value })}
              helperText="Contoh hasil: KWT/2026/08/00001"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetData}
              className="text-rose-600 hover:bg-rose-50"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Reset Data Demo
            </Button>

            <Button type="submit" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Simpan Format Dokumen
            </Button>
          </div>
        </form>
      )}

      {/* Tab 4: Database & Supabase SQL */}
      {activeTab === 'database' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Supabase & PostgreSQL Production Schema</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Seluruh skrip DDL SQL lengkap dengan tabel relasional, triggers saldo otomatis, RLS policies, dan index.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopySql}
              leftIcon={<Copy className="w-4 h-4" />}
            >
              {copiedSql ? 'Tersalin!' : 'Copy SQL Schema'}
            </Button>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl text-slate-200 text-xs font-mono max-h-96 overflow-y-auto leading-relaxed">
            <pre>{SUPABASE_SQL_MIGRATION}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
