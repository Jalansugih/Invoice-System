import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { StorageService } from '../../lib/storage';
import { SupabaseService } from '../../lib/supabaseService';
import { UserProfile, UserRole } from '../../types';

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isPasswordRecovery: boolean;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ error: Error | null; data: any }>;
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);

  // Ensure a row exists in public.profiles for this auth user, linking them
  // to their organization. Required for Supabase RLS policies (which check
  // profiles.organization_id) to allow any read/write at all.
  const ensureProfile = async (sbUser: User) => {
    try {
      const meta = sbUser.user_metadata || {};
      const orgId = meta.organization_id;
      if (!orgId) return;

      await supabase.from('profiles').upsert({
        id: sbUser.id,
        organization_id: orgId,
        name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'User',
        email: sbUser.email,
        role: meta.role || 'owner',
      });
    } catch (e) {
      console.error('Gagal menyiapkan profil organisasi di Supabase:', e);
    }
  };

  // Helper to map Supabase User metadata to app UserProfile
  const mapSupabaseUserToProfile = (sbUser: User): UserProfile => {
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'User',
      email: sbUser.email || '',
      role: (meta.role as UserRole) || 'owner',
      avatarUrl: meta.avatar_url,
      organizationId: meta.organization_id || 'org-001',
    };
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          // 1. Retrieve current active session
          const { data: { session: initialSession }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn('Supabase getSession error:', error.message);
          }

          if (isMounted) {
            if (initialSession?.user) {
              setSession(initialSession);
              setSupabaseUser(initialSession.user);
              const profile = mapSupabaseUserToProfile(initialSession.user);
              setUser(profile);
              StorageService.setCurrentUser(profile);

              // Make sure our profile row exists (needed for RLS), then pull
              // the latest customers/invoices/payments down from Supabase.
              await ensureProfile(initialSession.user);
              await StorageService.hydrateFromSupabase(profile.organizationId);
            } else {
              // Check if demo user was active
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

          // 2. Listen to real-time auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (!isMounted) return;
              
              if (event === 'PASSWORD_RECOVERY') {
                setIsPasswordRecovery(true);
              }

              setSession(newSession);
              if (newSession?.user) {
                setSupabaseUser(newSession.user);
                const profile = mapSupabaseUserToProfile(newSession.user);
                setUser(profile);
                StorageService.setCurrentUser(profile);
                localStorage.removeItem(DEMO_STORAGE_KEY);
                await ensureProfile(newSession.user);
                await StorageService.hydrateFromSupabase(profile.organizationId);
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
        } else {
          // In local/demo mode without live Supabase keys
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
        console.error('Auth initialization failed:', err);
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
      if (!isSupabaseConfigured) {
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
          organizationId: 'org-001',
        };

        setUser(demoProfile);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
        StorageService.setCurrentUser(demoProfile);
        setLoading(false);
        return { error: null, data: { user: demoProfile, session: null } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error, data: null };
      }

      if (data.user) {
        const profile = mapSupabaseUserToProfile(data.user);
        setUser(profile);
        StorageService.setCurrentUser(profile);
        await ensureProfile(data.user);
        await StorageService.hydrateFromSupabase(profile.organizationId);
      }

      setLoading(false);
      return { error: null, data };
    } catch (err: any) {
      setLoading(false);
      return { error: err, data: null };
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
      // Must be a real UUID: it's written straight into Supabase's
      // organizations.id (uuid column) and referenced by every other table.
      const orgId = crypto.randomUUID();
      if (organizationName) {
        StorageService.updateOrganization({ name: organizationName });
      }

      if (!isSupabaseConfigured) {
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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
            organization_id: orgId,
            organization_name: organizationName || 'Perusahaan Baru',
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error, data: null };
      }

      if (data.user) {
        const profile = mapSupabaseUserToProfile(data.user);
        setUser(profile);
        StorageService.setCurrentUser(profile);

        // Organization row must exist first: profiles.organization_id has a
        // foreign key into it, and RLS on every other table checks profiles.
        await SupabaseService.saveOrganization({
          ...StorageService.getOrganization(),
          id: orgId,
          name: organizationName || 'Perusahaan Baru',
          email,
        });

        // Only works if signUp already returned a live session (i.e. email
        // confirmation is disabled on the Supabase project). If confirmation
        // is required, this same call runs again on the user's first real
        // sign-in via signInWithPassword above.
        if (data.session) {
          await ensureProfile(data.user);
        }
      }

      setLoading(false);
      return { error: null, data };
    } catch (err: any) {
      setLoading(false);
      return { error: err, data: null };
    }
  };

  // Reset Password for Email
  const resetPasswordForEmail = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Update Password (for Reset Password flow)
  const updateUserPassword = async (password: string) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setLoading(false);
        setIsPasswordRecovery(false);
        return { error: null, data: { user } };
      }
      const { data, error } = await supabase.auth.updateUser({
        password,
      });
      if (error) {
        setLoading(false);
        return { error, data: null };
      }
      setIsPasswordRecovery(false);
      setLoading(false);
      return { error: null, data };
    } catch (err: any) {
      setLoading(false);
      return { error: err, data: null };
    }
  };

  // Explicit session refresh using Supabase Auth
  const refreshSession = async () => {
    try {
      if (!isSupabaseConfigured) {
        return { error: null, data: { session, user } };
      }
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        return { error, data: null };
      }
      if (data.session) {
        setSession(data.session);
        if (data.session.user) {
          setSupabaseUser(data.session.user);
          const profile = mapSupabaseUserToProfile(data.session.user);
          setUser(profile);
          StorageService.setCurrentUser(profile);
        }
      }
      return { error: null, data };
    } catch (err: any) {
      return { error: err, data: null };
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
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fast switch demo role
  const signInDemoUser = (role: UserRole = 'admin') => {
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
      organizationId: 'org-001',
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
    if (!isSupabaseConfigured) {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        isPasswordRecovery,
        signInWithPassword,
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
