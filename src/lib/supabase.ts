import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  envUrl &&
  envKey &&
  envUrl.startsWith('http') &&
  !envUrl.includes('placeholder')
);

// Fallback to avoid crash if environment variables are not set during initial run
const supabaseUrl = isSupabaseConfigured ? (envUrl as string) : 'https://shwvmosbmlvnvtcmipuy.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? (envKey as string) : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNod3Ztb3NibWx2bnZ0Y21pcHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMTkwNjQsImV4cCI6MjEwMjc5NTA2NH0.LDGCbVJWquN4fIDPH8YgzhEvzRFklK8uv7DnUc2Sgc0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
