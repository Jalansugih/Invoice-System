import React, { useState } from 'react';
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
  ShieldAlert,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { UserRole } from '../../types';

interface LoginProps {
  onSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const {
    signInWithPassword,
    signUpWithPassword,
    resetPasswordForEmail,
    signInDemoUser,
    isConfigured,
    loading,
  } = useAuth();
  const org = StorageService.getOrganization();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState(org.name || 'PT Solusi Finansial Indonesia');
  const [role, setRole] = useState<UserRole>('owner');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'forgot') {
      if (!email) {
        setErrorMsg('Harap masukkan alamat email Anda.');
        return;
      }
      setIsSubmitting(true);
      try {
        const { error } = await resetPasswordForEmail(email);
        if (error) {
          setErrorMsg(error.message || 'Gagal mengirim email reset password.');
        } else {
          setSuccessMsg(
            'Tautan reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk/spam.'
          );
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email || !password) {
      setErrorMsg('Harap isi alamat email dan kata sandi.');
      return;
    }

    if (mode === 'signup' && !name) {
      setErrorMsg('Harap isi nama lengkap Anda.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(error.message || 'Gagal login. Periksa kembali email dan password Anda.');
        } else {
          setSuccessMsg('Login berhasil! Mengalihkan ke dashboard...');
          if (onSuccess) onSuccess();
        }
      } else {
        const { error } = await signUpWithPassword({
          email,
          password,
          name,
          role,
          organizationName,
        });
        if (error) {
          setErrorMsg(error.message || 'Gagal mendaftar akun baru.');
        } else {
          setSuccessMsg('Pendaftaran berhasil! Akun dan tenant organisasi Anda telah siap.');
          if (onSuccess) onSuccess();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (selectedRole: UserRole) => {
    signInDemoUser(selectedRole);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900/95 p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-800">
      {/* Dynamic ambient lighting backdrop */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Main Auth Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-slate-50 border-b border-slate-200 p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="h-12 w-auto max-w-[180px] object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
                  {org.name ? org.name.slice(0, 2).toUpperCase() : 'BF'}
                </div>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {org.name || 'BillingFlow Enterprise'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sistem Manajemen Faktur, Surat Tagihan, DJP & Multi-Tenant Database
            </p>

            {/* Supabase Status Tag */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white border border-slate-200 shadow-2xs">
              <Database className={`w-3.5 h-3.5 ${isConfigured ? 'text-emerald-600' : 'text-blue-600'}`} />
              <span className="text-slate-600">
                {isConfigured ? 'Supabase PostgreSQL Cloud' : 'Supabase Client / Mode Offline'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5">
            {mode !== 'forgot' ? (
              /* Mode Switcher Tabs */
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
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
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Halaman Masuk
                </button>
                <span className="text-xs font-semibold text-slate-400">Reset Kata Sandi</span>
              </div>
            )}

            {/* Alert Messages */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-snug">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-snug">{successMsg}</div>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Perusahaan / Organisasi (Tenant)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="cth. PT Solusi Digital Nusantara"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Pengguna</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="cth. Budi Santoso"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Peran & Hak Akses (Role)</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="input-auth-email"
                    placeholder="nama@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Kata Sandi (Password)</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        Lupa kata sandi?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-auth-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                id="btn-auth-submit"
                className="w-full justify-center py-2.5 mt-2"
                isLoading={isSubmitting || loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {mode === 'signin'
                  ? 'Masuk ke Aplikasi'
                  : mode === 'signup'
                  ? 'Buat Akun & Tenant Baru'
                  : 'Kirim Instruksi Reset'}
              </Button>
            </form>

            {/* Quick Demo Access - All 5 Roles */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Pilih Cepat Akun Demo (5 Role Multi-Tenant):
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
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                    Budi Santoso
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold">Admin Ops</div>
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
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          © 2026 {org.name || 'BillingFlow'}. Single Source of Truth & Row Level Security (RLS).
        </p>
      </div>
    </div>
  );
};
