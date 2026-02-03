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
      const msg = 'Favor insira o nome';
      setMessage(msg);
      alert(msg);
      setLoading(false);
      return;
    }
    try {
      // send name as user metadata so it becomes available in auth.user.user_metadata
      // supabase.auth.signUp accepts options with `data` for metadata in many versions
      // try to pass as second argument, fallback to first if needed
      let result: any;
      // Call signUp in a way compatible with different supabase-js versions.
      try {
        const authAny = (supabase.auth as any);
        if (authAny && typeof authAny.signUp === 'function') {
          // Preferred v2 signature: signUp({ email, password, options: { data } })
          try {
            result = await authAny.signUp({ email, password, options: { data: { full_name: name } } });
          } catch (innerErr) {
            // Fallback: older signatures may accept (user, metadata)
            try {
              result = await authAny.signUp({ email, password }, { data: { full_name: name } });
            } catch (innerErr2) {
              // Last fallback: simple signUp
              result = await authAny.signUp({ email, password });
            }
          }
        } else {
          throw new Error('supabase auth.signUp não disponível');
        }

        if ((result as any).error) {
          const errMsg = (result as any).error.message || JSON.stringify(result);
          console.error('SignUp error', result);
          setMessage(errMsg);
          alert(errMsg);
        } else {
          const successMsg = 'Verifique seu e-mail para confirmar a conta.';
          setMessage(successMsg);
          alert(successMsg);
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (e: any) {
        console.error('SignUp exception', e);
        const text = String(e?.message || e || 'Erro ao cadastrar');
        setMessage(text);
        alert(text);
      }
    } catch (err: any) {
      const text = String(err?.message || err || 'Erro ao cadastrar');
      if (text.toLowerCase().includes('failed to fetch') || text.toLowerCase().includes('connection reset')) {
        const networkMsg = 'Erro de conexão com o Supabase. Verifique sua internet ou configurações de rede (VPN/proxy).';
        setMessage(networkMsg);
        alert(networkMsg + '\n\n' + text);
      } else {
        setMessage(text || 'Erro ao cadastrar');
        alert(text || 'Erro ao cadastrar');
      }
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

        <label className="block mb-3">
          <span className="text-sm text-[#9CA3AF]">Nome</span>
          <input className="mt-1 block w-full border border-white/10 bg-transparent rounded px-3 py-2 text-[#F9FAFB]" value={name} onChange={(e) => setName(e.target.value)} type="text" required />
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
