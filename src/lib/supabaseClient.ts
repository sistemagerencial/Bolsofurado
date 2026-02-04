import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// In development use a local proxy to avoid TLS/HTTP2 issues in some environments.
// The proxy runs at http://localhost:8080 and forwards /rest/v1 to Supabase.
const devProxyUrl = import.meta.env.VITE_SUPABASE_PROXY_URL as string | undefined || 'http://localhost:8080';
const effectiveSupabaseUrl = import.meta.env.DEV ? (devProxyUrl || supabaseUrl) : supabaseUrl;

function createNoopClient() {
	const noop = {
		from: (_table: string) => ({
			select: async (_cols?: string) => ({ data: [], error: null }),
			insert: async (_rows: any) => ({ data: [], error: null }),
			update: async (_rows: any) => ({ data: [], error: null }),
			delete: async () => ({ data: [], error: null }),
		}),
		auth: {
			signInWithPassword: async () => ({ error: { message: 'Supabase disabled: missing VITE_SUPABASE_* env vars' } }),
			signUp: async () => ({ error: { message: 'Supabase disabled: missing VITE_SUPABASE_* env vars' } }),
			signOut: async () => ({}),
			onAuthStateChange: (_cb: any) => ({ subscription: { unsubscribe: () => {} } }),
			getUser: async () => ({ data: { user: null } }),
			resetPasswordForEmail: async (_email: string) => ({ data: null, error: null }),
			updateUser: async (_payload: any) => ({ data: { user: null }, error: null }),
		},
		rpc: async () => ({ data: null, error: null }),
	} as any;
	return noop;
}

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
	// Provide a noop client to avoid runtime errors during local development
	// when env vars are not set. Pages will receive empty data instead.
	// Developers should set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.
	// eslint-disable-next-line no-console
	console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing — using noop supabase client.');
	supabase = createNoopClient();
} else {
	// Enable session persistence and automatic token refresh so users stay logged in across reloads
	supabase = createClient(effectiveSupabaseUrl as string, supabaseAnonKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: false,
		},
	});

	// Dev-only debug logs: print that client initialized and intercept fetch to log requests
	if (typeof window !== 'undefined') {
		// eslint-disable-next-line no-console
		console.log('SUPABASE DEBUG:', { requestedUrl: supabaseUrl, effectiveUrl: effectiveSupabaseUrl, anonKeyPresent: !!supabaseAnonKey });

		try {
			const _origFetch = window.fetch.bind(window);
			window.fetch = async (input: RequestInfo, init?: RequestInit) => {
				try {
					const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
					if (url && effectiveSupabaseUrl && url.includes(effectiveSupabaseUrl)) {
						// eslint-disable-next-line no-console
						console.debug('SUPABASE FETCH', { url, headers: init?.headers });
					}
				} catch (e) {
					/* ignore logging errors */
				}
				return _origFetch(input, init);
			};
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn('Could not instrument window.fetch for Supabase debugging', e);
		}
	}
}

export { supabase };
export default supabase;
