import React, { useState, useRef, useEffect } from 'react';
import { StorageService, generateId } from '../../lib/storage';
import { Organization, BankAccount } from '../../types';
import { SUPABASE_SQL_MIGRATION } from '../../lib/supabaseMigration';
import { SupabaseService, MigrationResult } from '../../lib/supabaseService';
import { isSupabaseConfigured } from '../../lib/supabase';
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
  Layers,
  Users,
  Lock,
  ArrowRight,
  AlertCircle,
  Server,
  CloudUpload,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'bank' | 'formats' | 'database'>('company');
  const [org, setOrg] = useState<Organization>(StorageService.getOrganization());
  const [isSaved, setIsSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingSignature, setIsDraggingSignature] = useState(false);
  const [previewDocType, setPreviewDocType] = useState<'invoice' | 'letter' | 'receipt'>('invoice');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    authenticated: boolean;
    userEmail?: string;
    organizationId?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (activeTab === 'database') {
      SupabaseService.checkConnection().then(setConnectionStatus);
    }
  }, [activeTab]);

  const handleRunMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      // Repair any legacy non-UUID product ids before pushing to Supabase,
      // otherwise the upsert fails silently for every product created
      // before this fix.
      StorageService.repairLegacyProductIds();

      const payload = {
        organization: StorageService.getOrganization(),
        customers: StorageService.getCustomers(),
        products: StorageService.getProducts(),
        invoices: StorageService.getInvoices(),
        payments: StorageService.getPayments(),
        billingLetters: StorageService.getBillingLetters(),
        documents: StorageService.getDocuments(),
        auditLogs: StorageService.getAuditLogs(),
        bankTransactions: StorageService.getBankTransactions(),
      };

      const result = await SupabaseService.migrateLocalStorageToSupabase(payload);
      setMigrationResult(result);
    } catch (err: any) {
      setMigrationResult({
        success: false,
        message: err.message || 'Gagal menjalankan migrasi.',
        counts: {
          organizations: 0,
          customers: 0,
          products: 0,
          invoices: 0,
          invoiceItems: 0,
          payments: 0,
          billingLetters: 0,
          documents: 0,
          auditLogs: 0,
          bankTransactions: 0,
        },
        errors: [err.message],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedOrg = {
      ...org,
      signatureName: org.signatureName || org.directorName || '',
      directorName: org.signatureName || org.directorName || '',
    };
    setOrg(updatedOrg);
    StorageService.saveOrganization(updatedOrg);
    SupabaseService.saveOrganization(updatedOrg).catch((err) => {
      console.warn('Supabase organization save warning:', err);
    });
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
      id: generateId(),
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

                  <div className="mt-6 text-[10px] text-slate-400 italic text-center py-2 bg-slate-50 rounded border border-dashed border-slate-200">
                    [ Konten rincian item transaksi dokumen dicetak di bawah garis kop surat ini ]
                  </div>

                  {/* Simulated Paper Signature Footer */}
                  <div className="mt-8 pt-4 border-t border-dashed border-slate-300 flex justify-end">
                    <div className="text-right space-y-1 max-w-[240px]">
                      <p className="text-[10px] text-slate-500">{org.city || 'Jakarta'}, 22 Agustus 2026</p>
                      <p className="text-[11px] font-bold text-slate-800 uppercase leading-tight">{org.name || 'PT Nama Perusahaan'}</p>

                      <div className="h-14 flex items-center justify-end my-1">
                        {org.signatureImage ? (
                          <img
                            src={org.signatureImage}
                            alt="Cap & Tanda Tangan"
                            className="max-h-12 max-w-[140px] object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="border border-dashed border-slate-300 rounded px-3 py-1 text-[9px] text-slate-400">
                            [ Cap & Tanda Tangan ]
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900 underline uppercase tracking-tight">
                          {org.signatureName || org.directorName || 'Nama Penandatangan'}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium">
                          {org.signatureRole || 'Jabatan / Posisi Penandatangan'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Signer Configuration Section (Nama, Jabatan, & Otorisasi) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-2xs">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-emerald-600" />
                Pejabat Penandatangan Dokumen Resmi (Nama & Jabatan)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur nama dan jabatan pejabat berwenang yang akan dicantumkan secara otomatis pada kolom tanda tangan di seluruh dokumen resmi (Faktur/Invoice, Surat Tagihan, Kuitansi, dan Laporan).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama Lengkap Penandatangan"
                placeholder="cth. Budi Hartono, SE, Ak., CA"
                value={org.signatureName || org.directorName || ''}
                onChange={(e) => setOrg({ ...org, signatureName: e.target.value, directorName: e.target.value })}
                helperText="Tertera pada teks bergaris bawah penandatangan dokumen"
                required
              />
              <Input
                label="Jabatan Penandatangan (Job Title)"
                placeholder="cth. Direktur Keuangan (CFO) / Finance Manager"
                value={org.signatureRole || ''}
                onChange={(e) => setOrg({ ...org, signatureRole: e.target.value })}
                helperText="Tertera persis di bawah nama penandatangan di seluruh dokumen"
                required
              />
            </div>

            {/* Quick Position Presets */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Pilihan Cepat Template Jabatan:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Direktur Keuangan (CFO)',
                  'Finance & Accounting Manager',
                  'Direktur Utama (CEO)',
                  'Head of Finance & Billing',
                  'Finance & Treasury Officer',
                  'Kuasa Direksi',
                  'General Manager',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setOrg({ ...org, signatureRole: preset })}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                      org.signatureRole === preset
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Text Fields for Company Identity & Tax Defaults */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-2xs">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-900">Rincian Teks Identitas Perusahaan & Default Perpajakan</h3>
              <p className="text-xs text-slate-500">Informasi ini otomatis dicantumkan pada teks kop surat, footer, dan default kalkulasi perpajakan.</p>
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

            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Tab 4: Database & Supabase Migration Hub */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Top Status & Cloud Connection Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Pusat Migrasi Data & Single Source of Truth Supabase
                    </h3>
                    <p className="text-xs text-slate-500">
                      Migrasikan seluruh data transaksi lokal ke PostgreSQL Supabase & kelola isolasi Row Level Security (RLS).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => SupabaseService.checkConnection().then(setConnectionStatus)}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Tes Koneksi
                </Button>

                <Button
                  size="sm"
                  onClick={handleRunMigration}
                  isLoading={isMigrating}
                  leftIcon={<CloudUpload className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Sinkron / Migrasi ke Supabase
                </Button>
              </div>
            </div>

            {/* Connection Info Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Status Cloud Database</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {isSupabaseConfigured ? 'Supabase PostgreSQL Aktif' : 'Mode Offline / Local DB'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {isSupabaseConfigured
                    ? 'Endpoint & API key terpasang di workspace.'
                    : 'Kredensial Supabase berjalan via adapter lokal.'}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Row Level Security (RLS)</span>
                </div>
                <div className="text-sm font-bold text-slate-900">Isolasi Multi-Tenant Enforced</div>
                <div className="text-xs text-slate-500 mt-1">
                  Semua tabel terisolasi via <code>organization_id</code>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Tenant ID Aktif</span>
                </div>
                <div className="text-sm font-mono font-bold text-purple-700 truncate">
                  {org.id || 'org-001'}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">{org.name}</div>
              </div>
            </div>

            {/* Migration Result Banner */}
            {migrationResult && (
              <div
                className={`p-4 rounded-xl border ${
                  migrationResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  {migrationResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="text-sm font-bold">{migrationResult.message}</div>
                    {migrationResult.success && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs text-emerald-800 font-medium">
                        <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                          📄 Faktur: <strong>{migrationResult.counts.invoices}</strong> ({migrationResult.counts.invoiceItems} baris)
                        </div>
                        <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                          👥 Pelanggan: <strong>{migrationResult.counts.customers}</strong>
                        </div>
                        <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                          📦 Produk: <strong>{migrationResult.counts.products}</strong>
                        </div>
                        <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                          💳 Pembayaran: <strong>{migrationResult.counts.payments}</strong>
                        </div>
                        <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                          ✉️ Surat Tagihan: <strong>{migrationResult.counts.billingLetters}</strong>
                        </div>
                        <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                          📁 Dokumen: <strong>{migrationResult.counts.documents}</strong>
                        </div>
                        <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                          🛡️ Audit Logs: <strong>{migrationResult.counts.auditLogs}</strong>
                        </div>
                        <div className="p-2 bg-white/70 rounded-lg border border-emerald-200">
                          🏢 Organisasi: <strong>{migrationResult.counts.organizations}</strong>
                        </div>
                      </div>
                    )}
                    {migrationResult.errors.length > 0 && (
                      <div className="pt-2 text-xs text-rose-700">
                        {migrationResult.errors.map((e, idx) => (
                          <div key={idx}>• {e}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Multi-Tenant & Role Matrix Security Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Matriks Hak Akses & Keamanan Multi-Tenant (RBAC & RLS)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengguna hanya dapat mengakses data organisasi milik mereka sendiri. Pembatasan divalidasi langsung di tingkat PostgreSQL database.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Role Pengguna</th>
                    <th className="py-2.5 px-3">Hak Akses Data</th>
                    <th className="py-2.5 px-3">Invoice & Tagihan</th>
                    <th className="py-2.5 px-3">Pembayaran & Kuitansi</th>
                    <th className="py-2.5 px-3">Hapus Rekor</th>
                    <th className="py-2.5 px-3">Setelan Tenant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-purple-700">Owner (Direktur)</td>
                    <td className="py-2.5 px-3">Semua data organisasi</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Buat, Edit, Kirim</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Catat & Validasi</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Diizinkan</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Penuh (Termasuk Rekening)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-blue-700">Admin Operasional</td>
                    <td className="py-2.5 px-3">Semua data organisasi</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Buat, Edit, Kirim</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Catat & Validasi</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Diizinkan</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Edit Profil</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">Finance & Akuntansi</td>
                    <td className="py-2.5 px-3">Invoice, Bayar, Pajak, Bank</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Buat & Edit</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">Catat & Rekonsiliasi</td>
                    <td className="py-2.5 px-3 text-amber-600 font-semibold">Draft Saja</td>
                    <td className="py-2.5 px-3 text-slate-400">Hanya Lihat</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-amber-700">Staff Penagihan</td>
                    <td className="py-2.5 px-3">Invoice & Surat Tagihan</td>
                    <td className="py-2.5 px-3 text-blue-600 font-semibold">Draft & Surat Tagihan</td>
                    <td className="py-2.5 px-3 text-slate-400">Hanya Lihat</td>
                    <td className="py-2.5 px-3 text-slate-400">Tidak Diizinkan</td>
                    <td className="py-2.5 px-3 text-slate-400">Tidak Diizinkan</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-700">Viewer / Auditor</td>
                    <td className="py-2.5 px-3">Semua Laporan & Faktur</td>
                    <td className="py-2.5 px-3 text-slate-400">Hanya Lihat (Read-Only)</td>
                    <td className="py-2.5 px-3 text-slate-400">Hanya Lihat (Read-Only)</td>
                    <td className="py-2.5 px-3 text-slate-400">Tidak Diizinkan</td>
                    <td className="py-2.5 px-3 text-slate-400">Tidak Diizinkan</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* DDL Schema Viewer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-700" />
                  Supabase PostgreSQL Schema & RLS Security Script
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salin skrip SQL ini ke SQL Editor di dashboard Supabase Anda untuk menerapkan seluruh tabel dan RLS.
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

            <div className="p-4 bg-slate-900 rounded-xl text-slate-200 text-xs font-mono max-h-96 overflow-y-auto leading-relaxed border border-slate-800">
              <pre>{SUPABASE_SQL_MIGRATION}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
