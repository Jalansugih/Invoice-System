import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth';
import { StorageService } from '../../lib/storage';
import { Button } from '../ui/Button';
import {
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowRight,
  UserCheck,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  BookOpen,
  Wallet,
  FileText,
} from 'lucide-react';
import { UserRole } from '../../types';

interface LoginProps {
  onSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const {
    user,
    signInWithPassword,
    signInWithGoogle,
    signUpWithPassword,
    resetPasswordForEmail,
    updateUserPassword,
    signInDemoUser,
    isConfigured,
    backendHealth,
    isPasswordRecovery,
    setIsPasswordRecovery,
    loading,
  } = useAuth();

  const org = StorageService.getOrganization();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState(org.name || 'PT Solusi Finansial Indonesia');
  const [role, setRole] = useState<UserRole>('owner');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(error.message || 'Gagal memulai proses login Google.');
        setIsGoogleSubmitting(false);
      }
      // On success the browser is redirected to Google, so we deliberately
      // leave isGoogleSubmitting=true (spinner stays) until the page unloads.
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memulai login Google.');
      setIsGoogleSubmitting(false);
    }
  };

  // Auto-switch to reset mode if incoming state is password recovery
  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('reset');
      setSuccessMsg('Sesi pemulihan akun Supabase terdeteksi. Silakan masukkan kata sandi baru Anda.');
    }
  }, [isPasswordRecovery]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Password Reset Flow
    if (mode === 'reset') {
      if (!password || password.length < 6) {
        setErrorMsg('Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi tidak cocok.');
        return;
      }
      setIsSubmitting(true);
      try {
        const { error } = await updateUserPassword(password);
        if (error) {
          setErrorMsg(error.message || 'Gagal memperbarui kata sandi di Supabase Auth.');
        } else {
          setSuccessMsg('Kata sandi berhasil diperbarui! Mengalihkan ke dashboard...');
          setIsPasswordRecovery(false);
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1000);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Terjadi kesalahan saat mereset password.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 2. Forgot Password Flow
    if (mode === 'forgot') {
      if (!email) {
        setErrorMsg('Harap masukkan alamat email Anda.');
        return;
      }
      setIsSubmitting(true);
      try {
        const { error } = await resetPasswordForEmail(email);
        if (error) {
          setErrorMsg(error.message || 'Gagal mengirim email reset password via Supabase.');
        } else {
          setSuccessMsg(
            'Tautan pemulihan kata sandi telah dikirim ke email Anda via Supabase Auth. Silakan periksa inbox/spam.'
          );
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 3. Validation for Sign In & Sign Up
    if (!email || !password) {
      setErrorMsg('Harap isi alamat email dan kata sandi.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Harap isi nama lengkap Anda.');
        return;
      }
      if (!organizationName.trim()) {
        setErrorMsg('Harap isi nama perusahaan atau organisasi Anda.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Kata sandi minimal harus 6 karakter.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithPassword({ email: email.trim(), password });
        if (error) {
          setErrorMsg(error.message || 'Gagal login. Periksa kembali email dan kata sandi Anda.');
        } else {
          setSuccessMsg('Autentikasi Supabase berhasil! Mengalihkan ke dashboard...');
          if (onSuccess) onSuccess();
        }
      } else {
        const { error } = await signUpWithPassword({
          email: email.trim(),
          password,
          name: name.trim(),
          role,
          organizationName: organizationName.trim(),
        });
        if (error) {
          setErrorMsg(error.message || 'Gagal mendaftar akun baru ke Supabase.');
        } else {
          setSuccessMsg('Pendaftaran berhasil! Akun dan tenant organisasi Anda di Supabase telah siap.');
          if (onSuccess) onSuccess();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan pada sistem autentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (selectedRole: UserRole) => {
    signInDemoUser(selectedRole);
    if (onSuccess) onSuccess();
  };

  // Pre-fill helper for convenience
  const handlePreFill = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 auth-bg-pattern relative overflow-x-hidden font-sans antialiased text-slate-800 selection:bg-brand-500 selection:text-white">
      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-300/30 rounded-full blur-3xl auth-animated-blob" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-cyan-200/40 rounded-full blur-3xl auth-animated-blob-delay" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl auth-animated-blob" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={org.name}
              className="h-10 w-auto max-w-[160px] object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Wallet className="w-5 h-5" />
            </div>
          )}
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              {org.name || 'BillingFlow'}
            </span>
            <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 rounded-full">
              Portal Manajemen
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="#"
            id="link-user-guide-ebook"
            target="_blank"
            rel="noopener noreferrer"
            title="Buka panduan penggunaan aplikasi"
            className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Panduan Penggunaan</span>
          </a>
          <div className="h-4 w-px bg-slate-300 hidden sm:block" />
          <div className="text-xs text-slate-500 font-medium hidden sm:flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            E-Sistem Terenkripsi
          </div>
        </div>
      </header>

      {/* Konten Utama Login */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Sisi Kiri: Informasi & Branding */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left px-2 sm:px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/70 border border-brand-200 text-brand-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              Sistem Faktur & Keuangan Bisnis Terpadu
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Kelola Faktur & Tagihan <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-600">Lebih Transparan</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Selamat datang di <strong>{org.name || 'BillingFlow Enterprise'}</strong>. Akses dasbor faktur, surat tagihan, pajak DJP, dan rekonsiliasi bank dalam satu tempat terpadu.
            </p>

            {/* Fitur Unggulan */}
            <div className="grid grid-cols-2 gap-4 pt-2 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-slate-200/80 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Faktur & Pajak Otomatis</h4>
                  <p className="text-xs text-slate-500">Invoice, PPN & pelaporan instan</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-slate-200/80 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Keamanan Tinggi</h4>
                  <p className="text-xs text-slate-500">Row Level Security multi-tenant</p>
                </div>
              </div>
            </div>

            {/* Status Singkat */}
            <div className="pt-4 border-t border-slate-200/80 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-500">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold">AF</div>
                <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold">BS</div>
                <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">SR</div>
              </div>
              <span>Digunakan oleh tim keuangan dengan database Supabase multi-tenant</span>
            </div>
          </div>

          {/* Sisi Kanan: Kartu Form Login */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm auth-glass-card rounded-2xl p-6 sm:p-7 shadow-xl shadow-brand-500/10 border border-brand-100 relative">

              {/* Header Form */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-1.5">
                  <h2 className="text-xl font-bold text-slate-900">
                    {mode === 'signin' && 'Masuk Portal'}
                    {mode === 'signup' && 'Daftar Organisasi'}
                    {mode === 'forgot' && 'Lupa Kata Sandi'}
                    {mode === 'reset' && 'Atur Ulang Kata Sandi'}
                  </h2>
                  <span
                    id="badge-backend-status"
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                      isConfigured
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                        : 'bg-brand-50 text-brand-700 border-brand-200/60'
                    }`}
                  >
                    <Database className="w-3 h-3" />
                    {isConfigured ? (backendHealth.connected ? 'Live' : 'Cloud') : 'Demo'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {mode === 'signin' && 'Silakan masukkan kredensial akun Anda'}
                  {mode === 'signup' && 'Buat akun baru & tenant organisasi Anda'}
                  {mode === 'forgot' && 'Masukkan email untuk memulihkan akun Anda'}
                  {mode === 'reset' && 'Masukkan kata sandi baru untuk akun Anda'}
                </p>

              </div>

              {/* Currently Signed-In Banner */}
              {user && (
                <div className="mb-4 p-3.5 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-brand-900 truncate">
                      Sedang masuk: <span className="font-bold">{user.name}</span>
                    </p>
                    <p className="text-[11px] text-brand-700 truncate">{user.email} • Role: {user.role.toUpperCase()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSuccess && onSuccess()}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Lanjut &rarr;
                  </button>
                </div>
              )}

              {/* Mode Switcher Tabs / Back Navigation */}
              {mode === 'signin' || mode === 'signup' ? (
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-4">
                  <button
                    type="button"
                    id="tab-signin"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      mode === 'signin'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Masuk (Sign In)
                  </button>
                  <button
                    type="button"
                    id="tab-signup"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Daftar Organisasi Baru
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pb-3 mb-1 border-b border-slate-200/80">
                  <button
                    type="button"
                    id="btn-back-to-signin"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setIsPasswordRecovery(false);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Halaman Masuk
                  </button>
                  <span className="text-xs font-semibold text-brand-600">
                    {mode === 'reset' ? 'Atur Ulang Kata Sandi' : 'Lupa Kata Sandi'}
                  </span>
                </div>
              )}

              {/* Alert Messages */}
              {errorMsg && (
                <div id="alert-auth-error" className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-snug">{errorMsg}</div>
                </div>
              )}

              {successMsg && (
                <div id="alert-auth-success" className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-snug">{successMsg}</div>
                </div>
              )}

              {/* Tombol Login Google */}
              {(mode === 'signin' || mode === 'signup') && (
                <>
                  <button
                    type="button"
                    id="btn-google-signin"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleSubmitting || isSubmitting}
                    className="w-full mb-4 py-2.5 px-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 text-xs hover:border-brand-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGoogleSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.11C3.24 21.3 7.28 24 12 24z" />
                        <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.26A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.26 5.39l4.01-3.11z" />
                        <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.79l3.45-3.45C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
                      </svg>
                    )}
                    <span>{isGoogleSubmitting ? 'Mengalihkan ke Google...' : 'Masuk dengan Google'}</span>
                  </button>

                  <div className="relative flex py-1 items-center mb-4">
                    <div className="flex-grow border-t border-slate-200" />
                    <span className="flex-shrink mx-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">atau dengan email</span>
                    <div className="flex-grow border-t border-slate-200" />
                  </div>
                </>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Nama Perusahaan / Organisasi (Tenant Baru)
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          id="input-signup-org"
                          placeholder="cth. PT Solusi Digital Nusantara"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          className="block w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-xs font-medium"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Setiap organisasi akan memiliki partisi data dan isolasi RLS tersendiri di Supabase.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Nama Lengkap Pengguna
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          id="input-signup-name"
                          placeholder="cth. Ir. Budi Santoso"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="block w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-xs font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Peran & Hak Akses (Role)
                      </label>
                      <select
                        id="select-signup-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                      >
                        <option value="owner">Owner (Direktur / Pemilik Usaha - Akses Penuh)</option>
                        <option value="admin">Admin Operasional (Kelola Invoice, Klien, Produk)</option>
                        <option value="finance">Finance & Akuntansi (Input Pembayaran, Pajak, Rekonsiliasi)</option>
                        <option value="staff">Staff Penagihan (Draft Tagihan & Surat Tagihan)</option>
                        <option value="viewer">Viewer / Auditor (Hanya Lihat Laporan & Faktur)</option>
                      </select>
                    </div>
                  </>
                )}

                {mode !== 'reset' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Alamat Email
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="input-auth-email"
                        placeholder="nama@perusahaan.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-xs font-medium"
                        required
                      />
                    </div>
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        {mode === 'reset' ? 'Kata Sandi Baru' : 'Kata Sandi'}
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          id="btn-forgot-password-link"
                          onClick={() => {
                            setMode('forgot');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-xs font-semibold text-brand-600 hover:underline transition-colors cursor-pointer"
                        >
                          Lupa?
                        </button>
                      )}
                    </div>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="input-auth-password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-xs font-medium"
                        required
                      />
                      <button
                        type="button"
                        id="btn-toggle-password-visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {mode === 'signup' && (
                      <p className="text-[10px] text-slate-500 mt-1">Minimal 6 karakter dengan kombinasi huruf & angka.</p>
                    )}
                  </div>
                )}

                {mode === 'reset' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="input-auth-confirm-password"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-xs font-medium"
                        required
                      />
                    </div>
                  </div>
                )}

                {mode === 'signin' && (
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 text-brand-600 bg-slate-100 border-slate-300 rounded focus:ring-brand-500 focus:ring-2 cursor-pointer" />
                      <span className="ml-2 text-xs font-medium text-slate-600">Ingat sesi saya</span>
                    </label>
                  </div>
                )}

                <Button
                  type="submit"
                  id="btn-auth-submit"
                  className="w-full justify-center py-2.5 px-4 !bg-brand-600 hover:!bg-brand-700 shadow-md shadow-brand-500/30 hover:shadow-brand-500/40 focus:!ring-brand-500 rounded-xl mt-1"
                  isLoading={isSubmitting || loading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {mode === 'signin'
                    ? 'Masuk ke Portal'
                    : mode === 'signup'
                    ? 'Daftar & Buat Tenant Baru'
                    : mode === 'reset'
                    ? 'Simpan Kata Sandi Baru'
                    : 'Kirim Tautan Reset'}
                </Button>
              </form>

              {/* Footer Kartu Login */}
              <div className="mt-6 pt-4 border-t border-slate-200/80 text-center">
                <p className="text-xs text-slate-500">
                  Belum memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold text-brand-600 hover:underline cursor-pointer"
                  >
                    Daftar Organisasi Baru
                  </button>
                </p>
              </div>

              {/* Quick Demo Access - All 5 Roles.
                  Only shown when Supabase is NOT configured (local/offline dev
                  fallback). On a real deployment with a live backend, showing
                  one-click "log in as Owner/Admin/..." buttons on the public
                  login screen would let anyone bypass real authentication, so
                  this panel must never render once isConfigured is true. */}
              {!isConfigured && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                      Pilih Cepat Akun Demo (5 Role):
                    </span>
                  </div>
                  <div className="mb-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2 text-[10px] text-amber-800">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Mode demo/offline: backend Supabase belum terkonfigurasi.
                      Akun di bawah ini hanya untuk eksplorasi lokal dan tidak
                      tersambung ke database sungguhan.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      id="btn-demo-owner"
                      onClick={() => handleQuickDemoLogin('owner')}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700 truncate">
                        Ir. Ahmad Fauzi
                      </div>
                      <div className="text-[10px] text-purple-600 font-semibold">Owner (Full)</div>
                    </button>

                    <button
                      type="button"
                      id="btn-demo-admin"
                      onClick={() => handleQuickDemoLogin('admin')}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-brand-700 truncate">
                        Budi Santoso
                      </div>
                      <div className="text-[10px] text-brand-600 font-semibold">Admin Ops</div>
                    </button>

                    <button
                      type="button"
                      id="btn-demo-finance"
                      onClick={() => handleQuickDemoLogin('finance')}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                        Siti Rahma
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Finance</div>
                    </button>

                    <button
                      type="button"
                      id="btn-demo-staff"
                      onClick={() => handleQuickDemoLogin('staff')}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-amber-700 truncate">
                        Rian Pratama
                      </div>
                      <div className="text-[10px] text-amber-600 font-semibold">Staff Tagihan</div>
                    </button>

                    <button
                      type="button"
                      id="btn-demo-viewer"
                      onClick={() => handleQuickDemoLogin('viewer')}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-200/70 hover:border-slate-400 text-left transition-all cursor-pointer group col-span-2 sm:col-span-1"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate">
                        Dewi Lestari
                      </div>
                      <div className="text-[10px] text-slate-600 font-semibold">Viewer (Read-Only)</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer Utama */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-200/60 mt-8 flex flex-col sm:flex-row justify-center items-center gap-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Supabase Row Level Security (RLS)
        </span>
        <span>•</span>
        <span>PostgreSQL Multi-Tenant</span>
      </footer>
    </div>
  );
};
