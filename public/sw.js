const CACHE_NAME = 'bolsofurado-v2';

// Apenas o essencial para funcionar offline
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  // Instala sem bloquear — não espera o cache
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {
        // Ignora erros de cache na instalação
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;

  // Ignora chamadas externas (Supabase, APIs, CDN)
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Ignora chamadas de API do Supabase
  if (event.request.url.includes('supabase.co')) return;

  // Ignora arquivos de módulo JS/TS do Vite (evita travar o HMR)
  if (event.request.url.includes('/@') || event.request.url.includes('?t=')) return;

  // Estratégia: Network first — só usa cache se não tiver rede
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Salva no cache apenas respostas válidas de navegação
        if (
          response &&
          response.status === 200 &&
          event.request.mode === 'navigate'
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => {
        // Sem rede: tenta cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;

          // Para navegação sem cache, serve o index.html (SPA)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html').then((indexCached) => {
              if (indexCached) return indexCached;

              // Página offline embutida
              return new Response(
                `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Sem conexão – Bolso Furado</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0E0B16;color:#F9FAFB;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#16122A;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:40px 32px;max-width:360px;width:100%;text-align:center}
    .icon{font-size:56px;margin-bottom:20px}
    h1{font-size:22px;font-weight:700;margin-bottom:10px}
    p{color:#9CA3AF;font-size:14px;line-height:1.6;margin-bottom:24px}
    button{background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;border:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:600;cursor:pointer;width:100%}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>Sem rede</h1>
    <p>Você está sem conexão com a internet. Verifique seu Wi-Fi ou dados móveis e tente novamente.</p>
    <button onclick="location.reload()">Tentar novamente</button>
  </div>
</body>
</html>`,
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              );
            });
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});
