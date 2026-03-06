import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL) as string;
const supabaseAnonKey = (import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL ou Anon Key não configurados');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'bolsofurado_auth',
  },
  global: {
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      return fetch(url, { ...options, signal: controller.signal })
        .catch((err) => {
          if (err.name === 'AbortError') {
            console.warn('Supabase request timeout:', url);
          } else {
            console.warn('Supabase fetch error (ignorado):', err.message);
          }
          return new Response(JSON.stringify({ error: { message: 'Network error' } }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
        .finally(() => clearTimeout(timeoutId));
    },
  },
});
