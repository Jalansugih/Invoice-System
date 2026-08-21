import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { StorageService } from '../../lib/storage';
import { UserProfile, UserRole } from '../../types';

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ error: Error | null; data: any }>;
  signUpWithPassword: (credentials: { email: string; password: string; name: string; role?: UserRole }) => Promise<{ error: Error | null; data: any }>;
  signOut: () => Promise<void>;
  signInDemoUser: (role?: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'billingflow_auth_demo_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to map Supabase User metadata to app UserProfile
  const mapSupabaseUserToProfile = (sbUser: User): UserProfile => {
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'User',
      email: sbUser.email || '',
      role: (meta.role as UserRole) || 'admin',
      avatarUrl: meta.avatar_url,
      organizationId: meta.organization_id || 'org-1',
    };
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          // 1. Retrieve current active session via getSession()
          const { data: { session: initialSession }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn('Supabase getSession error:', error.message);
          }

          if (isMounted) {
            if (initialSession) {
              setSession(initialSession);
              setSupabaseUser(initialSession.user);
              setUser(mapSupabaseUserToProfile(initialSession.user));
            } else {
              // Check if demo user was active
              const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
              if (savedDemo) {
                try {
                  setUser(JSON.parse(savedDemo));
                } catch {
                  setUser(null);
                }
              }
            }
          }

          // 2. Listen to real-time auth state changes via onAuthStateChange()
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (!isMounted) return;
              
              setSession(newSession);
              if (newSession?.user) {
                setSupabaseUser(newSession.user);
                setUser(mapSupabaseUserToProfile(newSession.user));
                localStorage.removeItem(DEMO_STORAGE_KEY);
              } else {
                setSupabaseUser(null);
                const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
                if (savedDemo) {
                  try {
                    setUser(JSON.parse(savedDemo));
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
              setUser(JSON.parse(savedDemo));
            } catch {
              // fallback default user
              const defaultUser = StorageService.getCurrentUser();
              setUser(defaultUser);
              localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(defaultUser));
            }
          } else {
            // Default demo account
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

  // Supabase signInWithPassword implementation
  const signInWithPassword = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Fallback for local demo authentication
        const existingUsers = [
          { email: 'admin@billingflow.id', name: 'Budi Santoso', role: 'admin' as UserRole },
          { email: 'finance@billingflow.id', name: 'Siti Rahma', role: 'finance' as UserRole },
          { email: 'staff@billingflow.id', name: 'Anas All', role: 'staff' as UserRole },
        ];

        const match = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
          email,
          name: email.split('@')[0] || 'User',
          role: 'admin' as UserRole,
        };

        const demoProfile: UserProfile = {
          id: `usr-${Date.now()}`,
          name: match.name,
          email: match.email,
          role: match.role,
          organizationId: 'org-1',
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
      }

      setLoading(false);
      return { error: null, data };
    } catch (err: any) {
      setLoading(false);
      return { error: err, data: null };
    }
  };

  // Supabase signUp implementation
  const signUpWithPassword = async ({
    email,
    password,
    name,
    role = 'admin',
  }: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        const demoProfile: UserProfile = {
          id: `usr-${Date.now()}`,
          name,
          email,
          role,
          organizationId: 'org-1',
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
      }

      setLoading(false);
      return { error: null, data };
    } catch (err: any) {
      setLoading(false);
      return { error: err, data: null };
    }
  };

  // Supabase signOut implementation
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
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fast switch demo role for quick evaluation
  const signInDemoUser = (role: UserRole = 'admin') => {
    const demoMap: Record<UserRole, { name: string; email: string }> = {
      owner: { name: 'Direktur Utama', email: 'owner@billingflow.id' },
      admin: { name: 'Budi Santoso (Admin)', email: 'admin@billingflow.id' },
      finance: { name: 'Siti Rahma (Finance)', email: 'finance@billingflow.id' },
      staff: { name: 'Admin (Staff)', email: 'staff@billingflow.id' },
    };

    const target = demoMap[role] || demoMap.admin;
    const demoProfile: UserProfile = {
      id: `demo-${role}`,
      name: target.name,
      email: target.email,
      role,
      organizationId: 'org-1',
    };

    setUser(demoProfile);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
    StorageService.setCurrentUser(demoProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithPassword,
        signUpWithPassword,
        signOut,
        signInDemoUser,
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

// Also export Auth as a convenience alias
export const Auth = AuthProvider;
