import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const envUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  envUrl &&
  envKey &&
  /^https:\/\/[^\s/]+(?:\.[^\s/]+)+/i.test(envUrl) &&
  !envUrl.includes('placeholder') &&
  !envKey.includes('dummy')
);

// Never ship a fake Supabase endpoint/key. In development the app may render
// its offline/demo UI, but production must fail closed until real credentials
// are supplied through Vercel Environment Variables.
const supabaseUrl = envUrl || 'https://invalid.local';
const supabaseAnonKey = envKey || 'invalid-anon-key';

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
