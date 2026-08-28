import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  envUrl &&
  envKey &&
  envUrl.startsWith('http') &&
  !envUrl.includes('placeholder')
);

// Fallback to avoid crash if environment variables are not set during initial run
const supabaseUrl = isSupabaseConfigured ? envUrl : 'https://billingflow-demo.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Supabase JS v2 defaults to the PKCE flow for OAuth (Google, etc.), which
    // returns via a `?code=...` query param, NOT a `#access_token` hash. The
    // previous check only matched the old implicit-flow hash format, so an
    // OAuth redirect (e.g. after "Login dengan Google") would land back on
    // the app with detectSessionInUrl=false and the session would never be
    // exchanged/persisted. Always leaving this on is safe and is what the
    // Supabase docs recommend - it only acts when the relevant URL params
    // are actually present.
    detectSessionInUrl: true,
  },
  global: {
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
  },
});
