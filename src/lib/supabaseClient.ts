import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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
	supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
export default supabase;
