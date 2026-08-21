import React, { useState } from 'react';
import { useAuth } from './Auth';
import { StorageService } from '../../lib/storage';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  Building2,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { UserRole } from '../../types';

interface LoginProps {
  onSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { signInWithPassword, signUpWithPassword, signInDemoUser, isConfigured, loading } = useAuth();
  const org = StorageService.getOrganization();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Harap isi alamat email dan password.');
      return;
    }

    if (mode === 'signup' && !name) {
      setErrorMsg('Harap isi nama lengkap pengguna.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(error.message || 'Gagal login. Periksa kembali email dan password Anda.');
        } else {
          setSuccessMsg('Login berhasil! Mengalihkan ke aplikasi...');
          if (onSuccess) onSuccess();
        }
      } else {
        const { error } = await signUpWithPassword({ email, password, name, role });
        if (error) {
          setErrorMsg(error.message || 'Gagal mendaftar akun baru.');
        } else {
          setSuccessMsg('Pendaftaran berhasil! Akun Anda telah siap.');
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
      {/* Background decoration elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main Auth Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Card Header & Brand */}
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
              Sistem Manajemen Invoice, Surat Tagihan & Keuangan Perusahaan
            </p>

            {/* Supabase Status Tag */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-slate-200 shadow-2xs">
              <Database className={`w-3.5 h-3.5 ${isConfigured ? 'text-emerald-600' : 'text-blue-600'}`} />
              <span className="text-slate-600">
                {isConfigured ? 'Terhubung Supabase Auth' : 'Mode Offline / Local Auth'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
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
                Daftar Baru (Sign Up)
              </button>
            </div>

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

            {/* Actual Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
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
                        required={mode === 'signup'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Peran / Role Pengguna</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="admin">Admin Operasional</option>
                      <option value="finance">Finance / Keuangan</option>
                      <option value="staff">Staff Penagihan</option>
                      <option value="owner">Owner / Direktur</option>
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
                    placeholder="nama@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi (Password)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
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

              <Button
                type="submit"
                className="w-full justify-center py-2.5 mt-2"
                isLoading={isSubmitting || loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {mode === 'signin' ? 'Masuk ke Aplikasi' : 'Buat Akun Sekarang'}
              </Button>
            </form>

            {/* Quick Demo Accounts Selection */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Akses Cepat Akun Demo:
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                    Budi Santoso
                  </div>
                  <div className="text-[10px] text-slate-500">Role: Admin</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('finance')}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                    Siti Rahma
                  </div>
                  <div className="text-[10px] text-slate-500">Role: Finance</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          © 2026 {org.name || 'BillingFlow'}. Dilengkapi enkripsi sesi & otorisasi Supabase.
        </p>
      </div>
    </div>
  );
};
