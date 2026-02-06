import { readFileSync } from "fs";
const u = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
if (!u || !anon) { console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"); process.exit(1); }
const url = u.replace(/\/$/,'') + '/rest/v1/receitas';
const token = JSON.parse(readFileSync('token_response.json','utf8')).access_token;
const body = readFileSync('body.json','utf8');
(async()=>{
  const res = await fetch(url, {
    method: 'POST',
    headers: { apikey: anon, Authorization: 'Bearer '+token, 'Content-Type':'application/json', Prefer:'return=representation' },
    body
  });
  console.log('STATUS', res.status);
  console.log(await res.text());
})().catch(e=>{ console.error(e); process.exit(1); });