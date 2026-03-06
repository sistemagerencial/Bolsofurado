import { useState, FormEvent, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function RegistroPage() {
  const { signUp, signInWithGoogle } = useAuthContext();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);
    setResendError('');
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (resendErr) throw resendErr;
      setResendSuccess(true);
      startCooldown();
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao reenviar e-mail';
      setResendError(msg);
      setTimeout(() => setResendError(''), 5000);
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await signUp({ name, phone, email, password });
      setEmailSent(true);
      startCooldown();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta';
      if (msg.includes('User already registered')) {
        setError('Este e-mail já está cadastrado.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E0B16] via-[#16122A] to-[#0E0B16] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#EC4899]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <img
              src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/d897479ec7a02c7e53f2d5e4c64f1a14.png"
              alt="Bolso Furado"
              className="h-24 w-auto object-contain mb-4"
            />
          </div>

          <div className="bg-[#16122A] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#7C3AED]/30">
              <i className="ri-mail-check-line text-4xl text-white"></i>
            </div>

            <h2 className="text-2xl font-bold text-[#F9FAFB] mb-3">Confirme seu e-mail</h2>
            <p className="text-[#9CA3AF] text-sm leading-relaxed mb-2">Enviamos um link de confirmação para:</p>
            <p className="text-[#7C3AED] font-semibold text-sm mb-6 break-all">{email}</p>
            <p className="text-[#9CA3AF] text-sm leading-relaxed mb-8">
              Clique no link do e-mail para ativar sua conta e começar a usar o Bolso Furado.
            </p>

            {resendSuccess && (
              <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                <i className="ri-checkbox-circle-line text-green-400 text-lg w-5 h-5 flex items-center justify-center"></i>
                <p className="text-sm text-green-400">E-mail reenviado com sucesso! Verifique sua caixa de entrada.</p>
              </div>
            )}
            {resendError && (
              <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <i className="ri-error-warning-line text-red-400 text-lg w-5 h-5 flex items-center justify-center"></i>
                <p className="text-sm text-red-400">{resendError}</p>
              </div>
            )}

            <a
              href={`https://mail.google.com/mail/u/0/#search/from%3Abolsofurado`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold text-sm transition-all shadow-lg shadow-[#7C3AED]/30 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 mb-3"
            >
              <i className="ri-mail-open-line text-base"></i>
              Abrir meu e-mail
            </a>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resendLoading}
              className="w-full py-3 rounded-lg border border-white/10 hover:border-[#7C3AED]/50 bg-white/5 hover:bg-[#7C3AED]/10 text-[#9CA3AF] hover:text-[#F9FAFB] font-medium text-sm transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Reenviando...
                </>
              ) : cooldown > 0 ? (
                <>
                  <i className="ri-time-line text-base"></i>
                  Reenviar em {cooldown}s
                </>
              ) : (
                <>
                  <i className="ri-send-plane-line text-base"></i>
                  Reenviar e-mail de confirmação
                </>
              )}
            </button>

            <Link
              to="/login"
              className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#9CA3AF] hover:text-[#F9FAFB] font-medium text-sm transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
            >
              <i className="ri-arrow-left-line text-base"></i>
              Já confirmei, ir para o login
            </Link>

            <p className="text-xs text-[#6B7280] mt-6">
              Verifique também a pasta de <strong className="text-[#9CA3AF]">spam</strong> ou <strong className="text-[#9CA3AF]">lixo eletrônico</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            className="h-24 w-auto object-contain mb-4"
          />
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Criar sua conta</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Comece a controlar suas finanças agora</p>
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
            onClick={handleGoogleSignUp}
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
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Cadastrar com Google
              </>
            )}
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-xs text-[#6B7280] font-medium">ou cadastre com e-mail</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Nome completo</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <i className="ri-user-line text-[#9CA3AF] text-base"></i>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] transition-all"
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">
                Telefone / WhatsApp
                <span className="text-[#6B7280] font-normal ml-1">(opcional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <i className="ri-phone-line text-[#9CA3AF] text-base"></i>
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] transition-all"
                />
              </div>
            </div>

            {/* E-mail */}
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

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Senha</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <i className="ri-lock-line text-[#9CA3AF] text-base"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Confirmar senha</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <i className="ri-lock-password-line text-[#9CA3AF] text-base"></i>
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-11 pr-12 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-pointer text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                >
                  <i className={showConfirm ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
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
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#9CA3AF] mt-6">
            Já tem uma conta?{' '}
            <Link
              to="/login"
              className="text-[#7C3AED] hover:text-[#EC4899] font-medium transition-colors cursor-pointer"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
