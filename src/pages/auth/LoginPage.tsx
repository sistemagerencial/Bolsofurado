
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_expires_at, trial_end_date, is_lifetime, is_admin_override')
        .eq('email', email)
        .maybeSingle();

      if (profileData) {
        const now = new Date();
        const isLifetime = profileData.is_lifetime;
        const isAdminOverride = profileData.is_admin_override;
        
        if (isLifetime || isAdminOverride) {
          navigate('/', { replace: true });
          return;
        }

        if (profileData.subscription_status === 'trial' && profileData.trial_end_date) {
          const trialEnd = new Date(profileData.trial_end_date);
          if (now > trialEnd) {
            await supabase
              .from('profiles')
              .update({ subscription_status: 'expired' })
              .eq('email', email);
            navigate('/', { replace: true });
            return;
          }
        }

        if (profileData.subscription_status === 'active' && profileData.subscription_expires_at) {
          const expiresAt = new Date(profileData.subscription_expires_at);
          if (now > expiresAt) {
            await supabase
              .from('profiles')
              .update({ subscription_status: 'expired' })
              .eq('email', email);
            navigate('/', { replace: true });
            return;
          }
        }
      }

      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer login';
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de entrar.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar com Google';
      setError(msg);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E0B16] via-[#16122A] to-[#0E0B16] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#EC4899]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/d897479ec7a02c7e53f2d5e4c64f1a14.png"
            alt="Bolso Furado"
            className="h-28 w-auto object-contain mb-4"
          />
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Bem-vindo de volta</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Entre na sua conta para continuar</p>
        </div>

        {/* Card */}
        <div className="bg-[#16122A] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 flex items-center gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-4 py-3">
              <i className="ri-error-warning-line text-[#EF4444] text-lg w-5 h-5 flex items-center justify-center"></i>
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
          )}

          {/* Botão Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full py-3 rounded-lg bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-3 mb-5"
          >
            {googleLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin"></div>
                Conectando...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Entrar com Google
              </>
            )}
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-[#6B7280] font-medium">ou entre com e-mail</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">E-mail</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <i className="ri-mail-line text-[#9CA3AF] text-base"></i>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#F9FAFB]">Senha</label>
                <Link
                  to="/recuperar-senha"
                  className="text-xs text-[#7C3AED] hover:text-[#EC4899] transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <i className="ri-lock-line text-[#9CA3AF] text-base"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-11 pr-12 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-pointer text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                >
                  <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold text-sm transition-all shadow-lg shadow-[#7C3AED]/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#9CA3AF] mt-6">
            Não tem uma conta?{' '}
            <Link
              to="/registro"
              className="text-[#7C3AED] hover:text-[#EC4899] font-medium transition-colors cursor-pointer"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
