import React, { useState } from 'react';

const DebugPostPage: React.FC = () => {
  const url = (import.meta as any).env.VITE_SUPABASE_URL || '';
  const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
  const [body, setBody] = useState('[{"name":"categoria-debug"}]');
  const [result, setResult] = useState<string>('');
  const [status, setStatus] = useState<number | null>(null);

  const send = async () => {
    setResult('');
    setStatus(null);
    try {
      const res = await fetch(`${url}/rest/v1/categories`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body,
      });
      setStatus(res.status);
      const text = await res.text();
      setResult(text);
    } catch (err: any) {
      setResult(err.message || String(err));
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Debug POST to Supabase</h1>
      <p className="mb-4 text-sm text-gray-600">URL: {url}/rest/v1/categories</p>
      <textarea
        className="w-full h-40 p-2 border rounded mb-3 font-mono"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={send}
        >
          Send POST
        </button>
        <button
          className="bg-gray-200 px-3 py-2 rounded"
          onClick={() => { setBody('[{"name":"categoria-debug"}]'); setResult(''); setStatus(null); }}
        >
          Reset
        </button>
      </div>
      <div className="mt-4">
        <div className="text-sm text-gray-700 mb-1">Status: {status ?? '-'}</div>
        <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap">{result}</pre>
      </div>
      <div className="mt-4 text-xs text-red-600">Nota: não comite chaves sensíveis no repositório.</div>
    </div>
  );
};

export default DebugPostPage;
