import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Building2,
  Users,
  FileText,
  CreditCard,
  Mail,
  Landmark,
  Receipt,
  ShieldCheck,
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  ChevronRight,
  Printer,
  FileSignature,
  Database,
  HelpCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'workflow' | 'modules' | 'roles' | 'shortcuts'>('quickstart');
  const [stepIndex, setStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const quickStartSteps = [
    {
      step: 1,
      title: 'Lengkapi Profil & Penandatangan Dokumen',
      icon: Building2,
      badge: 'Langkah Pertama',
      color: 'blue',
      tabTarget: 'settings',
      tabLabel: 'Buka Pengaturan',
      description:
        'Sebelum mencetak transaksi, atur identitas resmi perusahaan Anda di menu Pengaturan agar kop surat dan tanda tangan terisi otomatis.',
      keyPoints: [
        'Isi Nama Perusahaan, Alamat, No. NPWP, dan Telepon/Email resmi.',
        'Unggah Logo Perusahaan dan Cap/Stempel Perusahaan.',
        'Atur Nama Lengkap Penandatangan dan Jabatan Resmi (cth. Direktur Keuangan / Finance Manager) yang akan dicetak di seluruh Faktur, SP, dan Kuitansi.',
        'Tentukan default PPN (11%) dan termin jatuh tempo faktur.',
      ],
    },
    {
      step: 2,
      title: 'Daftarkan Pelanggan & Katalog Produk/Jasa',
      icon: Users,
      badge: 'Master Data',
      color: 'indigo',
      tabTarget: 'customers',
      tabLabel: 'Buka Data Pelanggan',
      description:
        'Siapkan master data kontak klien dan produk atau layanan yang Anda sediakan untuk mempercepat proses pembuatan tagihan.',
      keyPoints: [
        'Menu Pelanggan: Simpan nama perusahaan klien, PIC, email penagihan, alamat, serta plafon kredit/termin khusus.',
        'Menu Produk & Jasa: Daftarkan kode item (SKU), deskripsi jasa/barang, satuan (unit/jam/bulan), dan harga standar.',
        'Dukungan PPN & PPh per produk untuk kalkulasi otomatis saat pembuatan invoice.',
      ],
    },
    {
      step: 3,
      title: 'Buat & Terbitkan Faktur Penjualan (Invoice)',
      icon: FileText,
      badge: 'Penerbitan Tagihan',
      color: 'emerald',
      tabTarget: 'invoices',
      tabLabel: 'Buka Faktur Penjualan',
      description:
        'Buat invoice penagihan resmi dengan kalkulasi pajak dan jatuh tempo otomatis yang siap dicetak atau diunduh sebagai PDF.',
      keyPoints: [
        'Klik tombol "+ New Invoice" di navbar atas kapan saja untuk membuat faktur baru secara instan.',
        'Pilih Pelanggan dan tambahkan baris item produk/jasa.',
        'Sistem otomatis menghitung Subtotal, Diskon, PPN 11%, dan PPh (PPh 23 / PPh 4 ayat 2).',
        'Cetak Faktur berstandar akuntansi lengkap dengan kop surat, QR verifikasi, dan tanda tangan pejabat berwenang.',
      ],
    },
    {
      step: 4,
      title: 'Catat Penerimaan Pembayaran & Cetak Kuitansi',
      icon: CreditCard,
      badge: 'Pelunasan Kas',
      color: 'amber',
      tabTarget: 'payments',
      tabLabel: 'Buka Penerimaan Kas',
      description:
        'Catat setoran pembayaran dari klien. Sistem otomatis memperbarui saldo sisa tagihan dan mengubah status invoice menjadi Paid/Partial.',
      keyPoints: [
        'Dukungan pembayaran penuh (Lunas) maupun bertahap (Cicilan / Uang Muka).',
        'Pilih metode pembayaran (Transfer Bank Mandiri/BCA, Giro, Tunai) dan nomor referensi mutasi bank.',
        'Otomatis terbitkan Kuitansi Resmi yang dapat dicetak atau disimpan sebagai arsip penerimaan kas.',
      ],
    },
    {
      step: 5,
      title: 'Pantau Piutang, Surat Tagihan (SP), & Laporan',
      icon: Landmark,
      badge: 'Monitoring & Rekonsiliasi',
      color: 'purple',
      tabTarget: 'dashboard',
      tabLabel: 'Buka Dashboard',
      description:
        'Kendalikan arus kas masuk secara menyeluruh dengan sistem peringatan otomatis dan laporan terintegrasi.',
      keyPoints: [
        'Dashboard Eksekutif: Pantau total piutang aktif, tagihan jatuh tempo (Overdue), dan umur piutang (Aging).',
        'Surat Tagihan (SP): Terbitkan surat peringatan resmi (SP1, SP2, SP3) satu klik untuk invoice yang menunggak.',
        'Rekonsiliasi Bank: Cocokkan mutasi mutasi rekening koran dengan bukti pembayaran kas.',
        'Laporan Pajak & DJP: Rekapitulasi masa pajak PPN dan PPh 23 siap lapor.',
      ],
    },
  ];

  const currentStep = quickStartSteps[stepIndex];

  const handleNavigateAndClose = (tabTarget?: string) => {
    if (tabTarget && onNavigateToTab) {
      onNavigateToTab(tabTarget);
    }
    onClose();
  };

  const markAsSeenAndClose = () => {
    try {
      localStorage.setItem('billingflow_has_seen_guide', 'true');
    } catch {
      // ignore storage errors
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs select-none">
      <div
        id="user-guide-modal-container"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Petunjuk Penggunaan Aplikasi BillingFlow
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/40">
                  Panduan Pengguna
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Panduan praktis langkah demi langkah untuk mengoperasikan sistem billing & keuangan bisnis Anda.
              </p>
            </div>
          </div>

          <button
            id="btn-close-user-guide"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guide Category Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
          {[
            { id: 'quickstart', label: 'Panduan Mulai Cepat (1-2-3)', icon: Sparkles },
            { id: 'workflow', label: 'Alur Kerja Finansial', icon: ArrowRight },
            { id: 'modules', label: 'Daftar Menu & Fitur', icon: FileText },
            { id: 'roles', label: 'Peran Pengguna (RBAC)', icon: ShieldCheck },
            { id: 'shortcuts', label: 'Pintasan & Tips', icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-white shadow-2xs font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-blue-600' : 'text-slate-400')} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: QUICK START STEPPER */}
          {activeTab === 'quickstart' && (
            <div className="space-y-6">
              {/* Stepper Progress Indicator */}
              <div className="grid grid-cols-5 gap-2">
                {quickStartSteps.map((s, idx) => {
                  const isCurrent = idx === stepIndex;
                  const isDone = idx < stepIndex;
                  return (
                    <button
                      key={s.step}
                      onClick={() => setStepIndex(idx)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer',
                        isCurrent
                          ? 'bg-blue-50 border-blue-500 shadow-2xs'
                          : isDone
                          ? 'bg-slate-50 border-emerald-300 text-slate-700'
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        )}
                      >
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-semibold line-clamp-1 leading-tight',
                          isCurrent ? 'text-blue-700 font-bold' : isDone ? 'text-slate-800' : 'text-slate-500'
                        )}
                      >
                        {s.title.split(' ')[0]} {s.title.split(' ')[1]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Step Detailed Card */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <currentStep.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                          {currentStep.badge}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Langkah {stepIndex + 1} dari 5
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {currentStep.title}
                      </h3>
                    </div>
                  </div>

                  {currentStep.tabTarget && (
                    <button
                      onClick={() => handleNavigateAndClose(currentStep.tabTarget)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                    >
                      {currentStep.tabLabel}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {currentStep.description}
                </p>

                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-900 block">
                    Poin Penting & Cara Melakukannya:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentStep.keyPoints.map((point, pIdx) => (
                      <div
                        key={pIdx}
                        className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 leading-snug">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stepper Navigation Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                    stepIndex === 0
                      ? 'text-slate-300 border border-slate-200 bg-slate-50 cursor-not-allowed'
                      : 'text-slate-700 border border-slate-300 hover:bg-slate-100'
                  )}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Langkah Sebelumnya
                </button>

                <div className="flex items-center gap-2">
                  {stepIndex < quickStartSteps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setStepIndex((prev) => Math.min(quickStartSteps.length - 1, prev + 1))}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                    >
                      Langkah Selanjutnya
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={markAsSeenAndClose}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Selesai & Mulai Gunakan Aplikasi
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Alur Standar Siklus Penagihan & Keuangan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proses bisnis terintegrasi dari penerbitan invoice hingga laporan audit dan pajak:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                  {[
                    {
                      phase: '1. Penerbitan Faktur',
                      icon: FileText,
                      color: 'bg-blue-600',
                      desc: 'Buat tagihan baru dengan nomor faktur unik, hitung PPN/PPh, dan kirimkan ke klien.',
                    },
                    {
                      phase: '2. Monitoring & Reminder',
                      icon: Mail,
                      color: 'bg-amber-600',
                      desc: 'Pantau jatuh tempo di dashboard. Buat Surat Peringatan (SP1/SP2/SP3) jika menunggak.',
                    },
                    {
                      phase: '3. Penerimaan & Kuitansi',
                      icon: CreditCard,
                      color: 'bg-emerald-600',
                      desc: 'Catat mutasi masuk, saldo piutang otomatis berkurang, dan cetak kuitansi lunas.',
                    },
                    {
                      phase: '4. Rekonsiliasi & Pajak',
                      icon: Landmark,
                      color: 'bg-purple-600',
                      desc: 'Cocokkan bukti bank feed, rekap masa pajak PPh/PPN, dan periksa jejak audit.',
                    },
                  ].map((wf, idx) => {
                    const Icon = wf.icon;
                    return (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 relative">
                        <div className={cn('w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold', wf.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{wf.phase}</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{wf.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Dokumen Guide */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Arti Status Pada Faktur Penjualan:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-200 text-amber-900">Unpaid / Belum Lunas</span>
                    <p className="text-[11px] text-slate-700 mt-2">Faktur telah terbit namun belum ada pembayaran yang diterima.</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-200 text-rose-900">Overdue / Jatuh Tempo</span>
                    <p className="text-[11px] text-slate-700 mt-2">Tanggal jatuh tempo telah lewat dan tagihan belum diselesaikan.</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-200 text-blue-900">Partial / Bayar Sebagian</span>
                    <p className="text-[11px] text-slate-700 mt-2">Klien telah mencicil pembayaran namun masih menyisakan saldo piutang.</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-200 text-emerald-900">Paid / Lunas</span>
                    <p className="text-[11px] text-slate-700 mt-2">Tagihan telah terbayar penuh 100% dan saldo piutang menjadi Rp 0.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM MODULES */}
          {activeTab === 'modules' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Dashboard Eksekutif',
                  icon: Sparkles,
                  desc: 'Ringkasan performa finansial real-time: Total Omzet, Piutang Tertunda, Rasio Penagihan, dan Grafik Arus Kas.',
                },
                {
                  title: 'Data Pelanggan & Rekanan',
                  icon: Users,
                  desc: 'Buku alamat rekanan bisnis, informasi kontak PIC, riwayat transaksi lengkap, dan riwayat sisa piutang.',
                },
                {
                  title: 'Produk & Jasa',
                  icon: FileText,
                  desc: 'Katalog tarif barang/jasa standar dengan konfigurasi tarif PPN dan klasifikasi objek pajak PPh.',
                },
                {
                  title: 'Faktur Penjualan (Invoices)',
                  icon: Printer,
                  desc: 'Pembuatan faktur multi-item dengan kalkulasi diskon, PPN 11%, PPh 23, cetak PDF profesional, dan QR verifikasi.',
                },
                {
                  title: 'Surat Tagihan & Somasi (SP)',
                  icon: Mail,
                  desc: 'Penerbitan surat tagihan resmi berjenjang (SP1, SP2, SP3) untuk menagih piutang yang telah lewat jatuh tempo.',
                },
                {
                  title: 'Penerimaan Kas & Kuitansi',
                  icon: CreditCard,
                  desc: 'Pencatatan pembayaran kas/bank dengan penerbitan bukti kuitansi resmi bertanda tangan pejabat.',
                },
                {
                  title: 'Rekonsiliasi Mutasi Bank',
                  icon: Landmark,
                  desc: 'Pencocokan mutasi bank feed dengan transaksi pembayaran untuk memastikan akurasi saldo buku kas.',
                },
                {
                  title: 'Laporan Pajak & DJP',
                  icon: Receipt,
                  desc: 'Rekapitulasi otomatis Masa Pajak PPN (Faktur Masukan/Keluaran) dan Bukti Potong PPh 23 untuk pelaporan pajak.',
                },
                {
                  title: 'Pengaturan & Penandatangan',
                  icon: FileSignature,
                  desc: 'Pengaturan kop surat, logo, cap stempel, nama & jabatan penandatangan resmi, serta koneksi database PostgreSQL Supabase.',
                },
                {
                  title: 'Jejak Audit Sistem',
                  icon: ShieldCheck,
                  desc: 'Pencatatan riwayat perubahan data (siapa, kapan, dan aksi apa yang dilakukan) untuk transparansi dan kepatuhan.',
                },
              ].map((mod, idx) => {
                const Icon = mod.icon;
                return (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white flex gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{mod.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{mod.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Hak Akses & Otorisasi Pengguna (Role-Based Access Control)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sistem membatasi wewenang aksi berdasarkan 5 tingkat peran untuk menjaga keamanan data finansial:
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      role: 'Owner (Pemilik Bisnis)',
                      color: 'bg-purple-100 text-purple-800 border-purple-200',
                      desc: 'Akses penuh tanpa batas: manajemen database, konfigurasi penandatangan resmi, hapus transaksi, dan ekspor data audit.',
                    },
                    {
                      role: 'Admin (Administrator Sistem)',
                      color: 'bg-blue-100 text-blue-800 border-blue-200',
                      desc: 'Mengelola pengguna, master data pelanggan/produk, pembuatan semua dokumen, serta pengaturan profil perusahaan.',
                    },
                    {
                      role: 'Finance (Bagian Keuangan & Pajak)',
                      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      desc: 'Membuat dan menerbitkan faktur, mencatat penerimaan kas & kuitansi, rekonsiliasi bank, dan mengakses laporan perpajakan.',
                    },
                    {
                      role: 'Staff (Staf Operasional)',
                      color: 'bg-amber-100 text-amber-800 border-amber-200',
                      desc: 'Membuat draf faktur dan menambah data pelanggan baru. Tidak dapat menghapus transaksi atau mengubah konfigurasi sistem.',
                    },
                    {
                      role: 'Viewer (Hanya Lihat / Auditor)',
                      color: 'bg-slate-100 text-slate-800 border-slate-200',
                      desc: 'Akses read-only untuk memantau data, mencetak dokumen, dan melihat laporan tanpa izin menambah atau mengubah data.',
                    },
                  ].map((r, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={cn('px-2.5 py-1 text-xs font-bold rounded-lg border', r.color)}>
                          {r.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 sm:max-w-md">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SHORTCUTS & TIPS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Pintasan Keyboard & Tips Produktivitas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Pencarian Global Instan</h4>
                      <p className="text-[11px] text-slate-500">Cari invoice, pelanggan, atau kuitansi dari mana saja</p>
                    </div>
                    <kbd className="px-2.5 py-1 rounded bg-white text-slate-800 border border-slate-300 font-mono text-xs font-bold shadow-2xs">
                      Ctrl + K
                    </kbd>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Buat Faktur Cepat</h4>
                      <p className="text-[11px] text-slate-500">Tombol "+ New Invoice" di pojok kanan atas</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">
                      + New Invoice
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Simpan / Cetak PDF</h4>
                      <p className="text-[11px] text-slate-500">Dialog cetak dokumen berstandar kertas A4</p>
                    </div>
                    <kbd className="px-2.5 py-1 rounded bg-white text-slate-800 border border-slate-300 font-mono text-xs font-bold shadow-2xs">
                      Ctrl + P
                    </kbd>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Ubah Penandatangan Dokumen</h4>
                      <p className="text-[11px] text-slate-500">Atur nama & jabatan di menu Pengaturan</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">
                      Pengaturan & DB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0 gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Anda dapat membuka panduan ini kembali kapan saja melalui tombol bantuan di navigasi.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={markAsSeenAndClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
