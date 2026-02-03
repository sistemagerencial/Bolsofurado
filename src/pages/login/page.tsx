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
    // Validação local de campos obrigatórios
    if (!email) {
      setError('Favor insira o email');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Favor insira a senha');
      setLoading(false);
      return;
    }
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        const msg = (result.error && result.error.message) || String(result.error || '');
        const lower = msg.toLowerCase();
        if (lower.includes('email not confirmed')) {
          setError('Email não confirmado. Verifique seu e-mail e confirme o cadastro antes de entrar.');
        } else if (lower.includes('invalid') || lower.includes('credentials') || lower.includes('invalid login') || lower.includes('user not found') || lower.includes('invalid email') || lower.includes('incorrect')) {
          setError('Usuário ou senha incorretos.');
        } else {
          setError(msg);
        }
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
    <div className="min-h-screen flex items-center justify-center bg-[#0E0B16]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[#16122A] border border-white/5 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-6">
          <div className="w-36 h-36 sm:w-44 sm:h-44 overflow-hidden rounded-md">
            <img
              src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/329df8a96fbfb4f61300025c05375e5e.png"
              alt="logo"
              className="w-full h-full object-cover object-top"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </div>
        {error && <div className="text-red-500 mb-3">{error}</div>}
        <label className="block mb-3">
          <span className="text-sm text-[#9CA3AF]">Email</span>
          <input
            className="mt-1 block w-full border border-white/10 bg-transparent rounded px-3 py-2 text-[#F9FAFB] placeholder:text-white/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm text-[#9CA3AF]">Senha</span>
          <input
            className="mt-1 block w-full border border-white/10 bg-transparent rounded px-3 py-2 text-[#F9FAFB] placeholder:text-white/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>
        <button
          className="w-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white py-2 rounded-md hover:opacity-95"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="flex items-center justify-between mt-4">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setError(null);
              const emailPrompt = prompt('Informe o email para recuperação:');
              if (emailPrompt === null) return; // cancelou
              if (!emailPrompt.trim()) {
                alert('Favor insira o email');
                return;
              }
              if (supabase.auth.resetPasswordForEmail) {
                supabase.auth.resetPasswordForEmail(emailPrompt);
              } else if ((supabase.auth as any).resetPassword) {
                (supabase.auth as any).resetPassword(emailPrompt);
              }
              alert('Se a conta existir, você receberá um email com instruções.');
            }}
            className="text-sm text-[#9CA3AF] hover:underline"
          >
            Esqueci minha senha
          </a>
          <a href="/register" className="text-sm text-[#9CA3AF] hover:underline">Cadastrar</a>
        </div>
      </form>
    </div>
  );
}
