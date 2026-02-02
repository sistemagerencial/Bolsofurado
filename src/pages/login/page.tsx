import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        setError(result.error.message);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Entrar</h1>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <label className="block mb-2">
          <span className="text-sm">Email</span>
          <input className="mt-1 block w-full border rounded px-2 py-1" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label className="block mb-4">
          <span className="text-sm">Senha</span>
          <input className="mt-1 block w-full border rounded px-2 py-1" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
