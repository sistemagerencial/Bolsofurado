import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (!name || !name.trim()) {
      setMessage('Favor insira o nome');
      setLoading(false);
      return;
    }
    try {
      // send name as user metadata so it becomes available in auth.user.user_metadata
      // supabase.auth.signUp accepts options with `data` for metadata in many versions
      // try to pass as second argument, fallback to first if needed
      let result: any;
      try {
        result = await (supabase.auth as any).signUp({ email, password }, { data: { full_name: name } });
      } catch (e) {
        result = await (supabase.auth as any).signUp({ email, password });
      }
      if ((result as any).error) {
        setMessage((result as any).error.message || 'Erro ao cadastrar');
      } else {
        setMessage('Verifique seu e-mail para confirmar a conta.');
        // optionally redirect to login
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      setMessage(err?.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0B16]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[#16122A] border border-white/5 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <div className="w-28 h-28 sm:w-32 sm:h-32 overflow-hidden rounded-md">
            <img
              src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/329df8a96fbfb4f61300025c05375e5e.png"
              alt="logo"
              className="w-full h-full object-cover object-top"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </div>
        <h1 className="text-2xl font-semibold mb-4 text-[#F9FAFB]">Criar conta</h1>
        {message && <div className="text-sm text-[#9CA3AF] mb-3">{message}</div>}
        <label className="block mb-3">
          <span className="text-sm text-[#9CA3AF]">Email</span>
          <input className="mt-1 block w-full border border-white/10 bg-transparent rounded px-3 py-2 text-[#F9FAFB]" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label className="block mb-4">
          <span className="text-sm text-[#9CA3AF]">Senha</span>
          <input className="mt-1 block w-full border border-white/10 bg-transparent rounded px-3 py-2 text-[#F9FAFB]" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button className="w-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white py-2 rounded-md" type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Criar conta'}
        </button>
      </form>
    </div>
  );
}
