/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_PAYMENT_GATEWAY_API_URL?: string;
  readonly VITE_PAYMENT_GATEWAY_PROVIDER?: string;
  readonly VITE_PAYMENT_GATEWAY_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
