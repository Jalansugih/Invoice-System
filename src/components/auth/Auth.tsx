import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { StorageService } from '../../lib/storage';
import { SupabaseService } from '../../lib/supabaseService';
import { UserProfile, UserRole } from '../../types';

export interface BackendHealthStatus {
  isConfigured: boolean;
  connected: boolean;
  authenticated: boolean;
  latencyMs?: number;
  url?: string;
  userEmail?: string;
  organizationId?: string;
  error?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  backendHealth: BackendHealthStatus;
  isPasswordRecovery: boolean;
  /** Set when the organization/profile bootstrap in ensureProfile() fails
   * (e.g. rejected by RLS). Null when everything is fine. This is more
   * severe than a normal per-entity sync failure: if this is set, nothing
   * else for this user can be saved to the cloud either. */
  orgBootstrapError: string | null;
  retryOrgBootstrap: () => Promise<void>;
  checkBackendHealth: () => Promise<BackendHealthStatus>;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ error: Error | null; data: any }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUpWithPassword: (credentials: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    organizationName?: string;
  }) => Promise<{ error: Error | null; data: any }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updateUserPassword: (password: string) => Promise<{ error: Error | null; data: any }>;
  refreshSession: () => Promise<{ error: Error | null; data: any }>;
  signOut: () => Promise<void>;
  setIsPasswordRecovery: (isRecovery: boolean) => void;
  signInDemoUser: (role?: UserRole) => void;
  updateUserRole: (role: UserRole) => void;
  canPerformAction: (action: 'view' | 'create_draft' | 'edit_all' | 'record_payment' | 'delete_records' | 'org_settings') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'billingflow_auth_demo_user';
const IS_DEV = import.meta.env.DEV;

/**
 * Translates Supabase Auth error messages into actionable, clear Indonesian explanations.
 */
export function translateAuthError(error: any): string {
  if (!error) return 'Terjadi kesalahan sistem yang tidak diketahui.';
  const msg = typeof error === 'string' ? error : error.message || '';
  const lower = msg.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Email atau kata sandi tidak sesuai. Silakan periksa kembali kredensial Anda.';
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Alamat email belum dikonfirmasi. Silakan periksa kotak masuk/spam email Anda, atau matikan opsi "Confirm email" pada pengaturan Auth dashboard Supabase.';
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'Email ini sudah terdaftar. Silakan beralih ke tab "Masuk (Sign In)" untuk login.';
  }
  if (lower.includes('password should be at least 6') || lower.includes('weak_password')) {
    return 'Kata sandi terlalu pendek. Masukkan minimal 6 karakter.';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'Terlalu banyak percobaan dalam waktu singkat. Harap tunggu 1-2 menit sebelum mencoba kembali.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('connection')) {
    return 'Gagal tersambung ke server Supabase. Pastikan URL Supabase valid dan koneksi internet stabil.';
  }
  if (lower.includes('invalid email') || lower.includes('unable to validate email')) {
    return 'Format alamat email tidak valid. Pastikan penulisan email sudah benar (contoh: nama@perusahaan.com).';
  }
  if (lower.includes('jwt') || lower.includes('token expired')) {
    return 'Sesi autentikasi telah berakhir. Silakan masuk kembali.';
  }

  return msg || 'Terjadi kesalahan saat memproses permintaan autentikasi.';
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const [orgBootstrapError, setOrgBootstrapError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<BackendHealthStatus>({
    isConfigured: isSupabaseConfigured,
    connected: false,
    authenticated: false,
    url: import.meta.env.VITE_SUPABASE_URL || 'Local / In-Memory Demo',
  });

  // Ensure organization and profile exist in Supabase PostgreSQL.
  //
  // Production note: the authoritative read/repair path is the SECURITY DEFINER
  // RPC. This avoids making login depend on the client's `profiles` SELECT RLS
  // policy. The RPC only operates on auth.uid(), so the browser cannot choose a
  // different user, organization, or privileged role.
  const ensureProfile = async (sbUser: User, fallbackOrgName?: string): Promise<UserProfile> => {
    if (!isSupabaseConfigured) {
      if (!IS_DEV) throw new Error('Supabase belum dikonfigurasi untuk deployment produksi.');
      const meta = sbUser.user_metadata || {};
      return {
        id: sbUser.id,
        name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Pengguna',
        email: sbUser.email || '',
        role: (meta.role as UserRole) || 'owner',
        avatarUrl: meta.avatar_url,
        organizationId: meta.organization_id || '',
      };
    }

    const toUserProfile = (profile: any): UserProfile => ({
      id: profile.id,
      organizationId: profile.organization_id,
      name:
        profile.name ||
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        sbUser.email?.split('@')[0] ||
        'Pengguna',
      email: profile.email || sbUser.email || '',
      role: (profile.role as UserRole) || 'owner',
      avatarUrl: profile.avatar_url || sbUser.user_metadata?.avatar_url,
    });

    // Always go through the authenticated-user RPC first. It is both a
    // read and an idempotent repair operation for legacy accounts. This is
    // deliberately preferable to a client-side SELECT because production RLS
    // should not be allowed to turn an otherwise valid login into a false
    // "profile missing" state.
    const rpcOrgName =
      fallbackOrgName ||
      sbUser.user_metadata?.organization_name ||
      'Perusahaan Baru';

    const { data: rpcProfile, error: rpcError } = await supabase.rpc(
      'bootstrap_current_user_profile',
      { p_org_name: rpcOrgName }
    );

    if (!rpcError && rpcProfile?.id === sbUser.id && rpcProfile.organization_id) {
      setOrgBootstrapError(null);
      return toUserProfile(rpcProfile);
    }

    // Backward-compatible fallback for databases where V10 has not yet been
    // applied. A normal SELECT can still succeed when the RLS helper/policy is
    // already configured correctly.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id, name, email, role, avatar_url')
      .eq('id', sbUser.id)
      .maybeSingle();

    if (!profileError && profile?.organization_id) {
      setOrgBootstrapError(null);
      return toUserProfile(profile);
    }

    const diagnostic = rpcError?.message || profileError?.message || 'Profil tidak ditemukan';
    const message =
      `Profil organisasi belum dapat disiapkan untuk akun ini. ` +
      `Pastikan migration_v10_production_org_bootstrap.sql sudah dijalankan. ` +
      `Detail: ${diagnostic}`;

    setOrgBootstrapError(message);
    throw new Error(message);
  };

  // Helper to map Supabase User metadata to app UserProfile
  const mapSupabaseUserToProfile = (sbUser: User): UserProfile => {
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Pengguna',
      email: sbUser.email || '',
      role: (meta.role as UserRole) || 'owner',
      avatarUrl: meta.avatar_url,
      organizationId: meta.organization_id || '00000000-0000-4000-8000-000000000001',
    };
  };

  // Real-time backend connection check
  const checkBackendHealth = async (): Promise<BackendHealthStatus> => {
    if (!isSupabaseConfigured && IS_DEV) {
      const status: BackendHealthStatus = {
        isConfigured: false,
        connected: false,
        authenticated: false,
        url: 'Mode Offline / Local State',
        error: 'VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum dikonfigurasi pada environment.',
      };
      setBackendHealth(status);
      return status;
    }

    const start = performance.now();
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const latencyMs = Math.round(performance.now() - start);

      const isAuthenticated = Boolean(authData?.user && !authError);
      let isDbConnected = true;
      let errorMsg: string | undefined = undefined;

      try {
        const { error: dbError } = await supabase.from('organizations').select('id').limit(1);
        if (dbError) {
          isDbConnected = false;
          errorMsg = dbError.message;
        }
      } catch (dbErr: any) {
        isDbConnected = false;
        errorMsg = dbErr?.message;
      }

      const status: BackendHealthStatus = {
        isConfigured: true,
        connected: isDbConnected,
        authenticated: isAuthenticated,
        latencyMs,
        url: import.meta.env.VITE_SUPABASE_URL,
        userEmail: authData?.user?.email,
        error: errorMsg || (authError ? authError.message : undefined),
      };

      setBackendHealth(status);
      return status;
    } catch (err: any) {
      const status: BackendHealthStatus = {
        isConfigured: true,
        connected: false,
        authenticated: false,
        url: import.meta.env.VITE_SUPABASE_URL,
        error: err?.message || 'Gagal tersambung ke backend Supabase.',
      };
      setBackendHealth(status);
      return status;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          // 1. Check health status in background without blocking initial paint
          checkBackendHealth().catch((err) => console.warn('[AuthProvider] Health check warning:', err));

          // 2. Retrieve current active session with timeout guard (2500ms max)
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<{ data: { session: null }; error: Error }>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { session: null },
                  error: new Error('Supabase getSession timeout - falling back to local session cache'),
                }),
              2500
            )
          );

          const { data: { session: initialSession }, error } = await Promise.race([sessionPromise, timeoutPromise]);
          
          if (error) {
            console.warn('[AuthProvider] Supabase getSession result:', error.message);
          }

          if (isMounted) {
            if (initialSession?.user) {
              setSession(initialSession);
              setSupabaseUser(initialSession.user);
              
              const profile = await ensureProfile(initialSession.user);
              setUser(profile);
              StorageService.setCurrentUser(profile);

              // Pull live data from Supabase in background (non-blocking)
              StorageService.hydrateFromSupabase(profile.organizationId).catch((e) =>
                console.warn('[AuthProvider] Background hydration note:', e)
              );
            } else {
              // Check if demo user was active in local storage
              const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
              if (savedDemo) {
                try {
                  const parsed = JSON.parse(savedDemo);
                  setUser(parsed);
                  StorageService.setCurrentUser(parsed);
                } catch {
                  setUser(null);
                }
              }
            }
          }

          // 3. Listen to real-time auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (!isMounted) return;
              
              if (event === 'PASSWORD_RECOVERY') {
                setIsPasswordRecovery(true);
              }

              setSession(newSession);
              if (newSession?.user) {
                setSupabaseUser(newSession.user);
                const profile = await ensureProfile(newSession.user);
                setUser(profile);
                StorageService.setCurrentUser(profile);
                localStorage.removeItem(DEMO_STORAGE_KEY);
                // Background hydrate without blocking UI
                StorageService.hydrateFromSupabase(profile.organizationId).catch((e) =>
                  console.warn('[AuthProvider] OnAuthChange hydration note:', e)
                );
              } else {
                setSupabaseUser(null);
                const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
                if (savedDemo) {
                  try {
                    const parsed = JSON.parse(savedDemo);
                    setUser(parsed);
                    StorageService.setCurrentUser(parsed);
                  } catch {
                    setUser(null);
                  }
                } else {
                  setUser(null);
                }
              }
              setLoading(false);
            }
          );

          return () => {
            subscription.unsubscribe();
          };
        } else if (IS_DEV) {
          // Offline/demo mode exists only for local development.
          const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
          if (savedDemo) {
            try {
              const parsed = JSON.parse(savedDemo);
              setUser(parsed);
              StorageService.setCurrentUser(parsed);
            } catch {
              const defaultUser = StorageService.getCurrentUser();
              setUser(defaultUser);
              localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(defaultUser));
            }
          } else {
            const defaultUser = StorageService.getCurrentUser();
            setUser(defaultUser);
            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(defaultUser));
          }
        }
      } catch (err) {
        console.error('[AuthProvider] Auth initialization failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const cleanup = initializeAuth();

    return () => {
      isMounted = false;
      cleanup.then(unsub => unsub && unsub());
    };
  }, []);

  // Supabase signInWithPassword
  const signInWithPassword = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured && IS_DEV) {
        const existingUsers: Record<string, { name: string; role: UserRole }> = {
          'owner@billingflow.id': { name: 'Ir. Ahmad Fauzi (Direktur)', role: 'owner' },
          'admin@billingflow.id': { name: 'Budi Santoso (Admin Operasional)', role: 'admin' },
          'finance@billingflow.id': { name: 'Siti Rahma (Finance Accounting)', role: 'finance' },
          'staff@billingflow.id': { name: 'Rian Pratama (Staff Penagihan)', role: 'staff' },
          'viewer@billingflow.id': { name: 'Dewi Lestari (Auditor Eksternal)', role: 'viewer' },
        };

        const match = existingUsers[email.toLowerCase()] || {
          name: email.split('@')[0] || 'User',
          role: 'admin' as UserRole,
        };

        const demoProfile: UserProfile = {
          id: `usr-${Date.now()}`,
          name: match.name,
          email,
          role: match.role,
          organizationId: '00000000-0000-4000-8000-000000000001',
        };

        setUser(demoProfile);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
        StorageService.setCurrentUser(demoProfile);
        setLoading(false);
        return { error: null, data: { user: demoProfile, session: null } };
      }

      if (!isSupabaseConfigured) {
        setLoading(false);
        return { error: new Error('Supabase belum dikonfigurasi. Hubungi administrator aplikasi.'), data: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error: new Error(translateAuthError(error)), data: null };
      }

      if (data.user) {
        setSupabaseUser(data.user);
        setSession(data.session);
        const profile = await ensureProfile(data.user);
        setUser(profile);
        StorageService.setCurrentUser(profile);
        localStorage.removeItem(DEMO_STORAGE_KEY);
        
        // Fetch organization data if available
        const orgData = await SupabaseService.getOrganization(profile.organizationId);
        if (orgData) {
          StorageService.saveOrganization(orgData);
        }

        // Hydrate all database tables from Supabase
        await StorageService.hydrateFromSupabase(profile.organizationId);
      }

      setLoading(false);
      return { error: null, data };
    } catch (err: any) {
      setLoading(false);
      return { error: new Error(translateAuthError(err)), data: null };
    }
  };

  // Supabase signInWithOAuth (Google)
  // Redirects the browser to Google's consent screen, then back to
  // `redirectTo`. The actual session pickup happens in the
  // onAuthStateChange listener above (event will be 'SIGNED_IN'), which
  // calls ensureProfile() to create the organizations/profiles rows on
  // first login - same flow as email/password signup, so a Google login
  // automatically gets its own tenant organization the first time.
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Login Google membutuhkan konfigurasi Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) yang aktif. Gunakan akun demo di bawah untuk mencoba aplikasi tanpa Supabase.') };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        return { error: new Error(translateAuthError(error)) };
      }
      // Browser is navigating away to Google now; nothing else to do here.
      return { error: null };
    } catch (err: any) {
      return { error: new Error(translateAuthError(err)) };
    }
  };

  // Supabase signUpWithPassword
  const signUpWithPassword = async ({
    email,
    password,
    name,
    role = 'owner',
    organizationName,
  }: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    organizationName?: string;
  }) => {
    setLoading(true);
    try {
      const effectiveOrgName = organizationName || 'Perusahaan Baru';

      if (!isSupabaseConfigured && IS_DEV) {
        const orgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-4000-8000-${String(Date.now()).slice(-12)}`;
        const demoProfile: UserProfile = {
          id: `usr-${Date.now()}`,
          name,
          email,
          role,
          organizationId: orgId,
        };
        setUser(demoProfile);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
        StorageService.setCurrentUser(demoProfile);
        setLoading(false);
        return { error: null, data: { user: demoProfile } };
      }

      if (!isSupabaseConfigured) {
        setLoading(false);
        return { error: new Error('Supabase belum dikonfigurasi. Deployment produksi belum siap menerima pendaftaran.'), data: null };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            // The DB trigger assigns the initial role and tenant safely.
            organization_name: effectiveOrgName,
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error: new Error(translateAuthError(error)), data: null };
      }

      if (data.user) {
        setSupabaseUser(data.user);
        if (data.session) {
          setSession(data.session);
        }

        const profile = await ensureProfile(data.user, effectiveOrgName);
        setUser(profile);
        StorageService.setCurrentUser(profile);
        localStorage.removeItem(DEMO_STORAGE_KEY);

        if (data.session) {
          await StorageService.hydrateFromSupabase(profile.organizationId);
        }
      }

      setLoading(false);
      return { error: null, data };
    } catch (err: any) {
      setLoading(false);
      return { error: new Error(translateAuthError(err)), data: null };
    }
  };

  // Reset Password for Email
  const resetPasswordForEmail = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase belum dikonfigurasi. Hubungi administrator aplikasi.') };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        return { error: new Error(translateAuthError(error)) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(translateAuthError(err)) };
    }
  };

  // Update Password (for Reset Password flow)
  const updateUserPassword = async (password: string) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return { error: new Error('Supabase belum dikonfigurasi. Hubungi administrator aplikasi.'), data: null };
      }
      const { data, error } = await supabase.auth.updateUser({
        password,
      });
      if (error) {
        setLoading(false);
        return { error: new Error(translateAuthError(error)), data: null };
      }
      setIsPasswordRecovery(false);
      setLoading(false);
      return { error: null, data };
    } catch (err: any) {
      setLoading(false);
      return { error: new Error(translateAuthError(err)), data: null };
    }
  };

  // Explicit session refresh using Supabase Auth
  const refreshSession = async () => {
    try {
      if (!isSupabaseConfigured) {
        return { error: new Error('Supabase belum dikonfigurasi. Hubungi administrator aplikasi.'), data: null };
      }
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        return { error: new Error(translateAuthError(error)), data: null };
      }
      if (data.session) {
        setSession(data.session);
        if (data.session.user) {
          setSupabaseUser(data.session.user);
          const profile = await ensureProfile(data.session.user);
          setUser(profile);
          StorageService.setCurrentUser(profile);
        }
      }
      return { error: null, data };
    } catch (err: any) {
      return { error: new Error(translateAuthError(err)), data: null };
    }
  };

  // Supabase signOut
  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setUser(null);
      setSession(null);
      setSupabaseUser(null);
      setIsPasswordRecovery(false);
    } catch (err) {
      console.error('[AuthProvider] Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fast switch demo role
  const signInDemoUser = (role: UserRole = 'admin') => {
    if (!IS_DEV || isSupabaseConfigured) return;
    const demoMap: Record<UserRole, { name: string; email: string }> = {
      owner: { name: 'Ir. Ahmad Fauzi', email: 'owner@billingflow.id' },
      admin: { name: 'Budi Santoso (Admin)', email: 'admin@billingflow.id' },
      finance: { name: 'Siti Rahma (Finance)', email: 'finance@billingflow.id' },
      staff: { name: 'Rian Pratama (Staff Penagihan)', email: 'staff@billingflow.id' },
      viewer: { name: 'Dewi Lestari (Auditor/Viewer)', email: 'viewer@billingflow.id' },
    };

    const target = demoMap[role] || demoMap.admin;
    const demoProfile: UserProfile = {
      id: `demo-${role}`,
      name: target.name,
      email: target.email,
      role,
      organizationId: '00000000-0000-4000-8000-000000000001',
    };

    setUser(demoProfile);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
    StorageService.setCurrentUser(demoProfile);
  };

  // Update role dynamically
  const updateUserRole = (role: UserRole) => {
    if (!user) return;
    const updated = { ...user, role };
    setUser(updated);
    StorageService.setCurrentUser(updated);
    if (IS_DEV && !isSupabaseConfigured) {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  // Fine-grained Role Permission Evaluator
  const canPerformAction = (action: 'view' | 'create_draft' | 'edit_all' | 'record_payment' | 'delete_records' | 'org_settings'): boolean => {
    if (!user) return false;
    const { role } = user;

    switch (action) {
      case 'view':
        return true; // Everyone can view
      case 'create_draft':
        return ['owner', 'admin', 'finance', 'staff'].includes(role);
      case 'edit_all':
        return ['owner', 'admin', 'finance'].includes(role);
      case 'record_payment':
        return ['owner', 'admin', 'finance'].includes(role);
      case 'delete_records':
        return ['owner', 'admin'].includes(role);
      case 'org_settings':
        return ['owner', 'admin'].includes(role);
      default:
        return false;
    }
  };

  // Lets the UI offer a "Coba lagi" button instead of forcing a full
  // sign-out/sign-in cycle when the organization/profile bootstrap failed.
  const retryOrgBootstrap = async () => {
    if (!supabaseUser) return;
    const profile = await ensureProfile(supabaseUser);
    setUser(profile);
    StorageService.setCurrentUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        backendHealth,
        isPasswordRecovery,
        orgBootstrapError,
        retryOrgBootstrap,
        checkBackendHealth,
        signInWithPassword,
        signInWithGoogle,
        signUpWithPassword,
        resetPasswordForEmail,
        updateUserPassword,
        refreshSession,
        signOut,
        setIsPasswordRecovery,
        signInDemoUser,
        updateUserRole,
        canPerformAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const Auth = AuthProvider;
