import { readFileSync } from 'fs';
import fetch from 'node-fetch';

function loadEnv() {
  // prefer process.env, fallback to .env.local
  const env = { ...process.env };
  if (!env.VITE_SUPABASE_ANON_KEY || !env.VITE_SUPABASE_URL) {
    try {
      const txt = readFileSync('.env.local', 'utf8');
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^\s*(VITE_SUPABASE_ANON_KEY|VITE_SUPABASE_URL)\s*=\s*(.*)$/);
        if (m) {
          const key = m[1];
          let val = m[2] || '';
          val = val.replace(/^\"|\"$/g, '').trim();
          env[key] = val;
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return env;
}

(async () => {
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const anon = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in environment or .env.local');
    process.exit(2);
  }

  const headers = {
    apikey: anon,
    Authorization: 'Bearer ' + anon,
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/receitas?select=*`, { headers });
    const text = await res.text();
    console.log('status:', res.status);
    const out = text.length > 1200 ? text.slice(0, 1200) + '\n...[truncated]' : text;
    console.log(out);
  } catch (err) {
    console.error('request failed:', err.message || err);
    process.exit(1);
  }
})();
