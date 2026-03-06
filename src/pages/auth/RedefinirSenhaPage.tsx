
import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setValidSession(true);
      }
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 6) return { label: 'Muito fraca', color: '#EF4444', width: '25%' };
    if (pwd.length < 8) return { label: 'Fraca', color: '#F97316', width: '50%' };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && pwd.length >= 8)
      return { label: 'Forte', color: '#10B981', width: '100%' };
    return { label: 'Média', color: '#EAB308', width: '75%' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao redefinir senha';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E0B16] via-[#16122A] to-[#0E0B16] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C3AED]/40 border-t-[#7C3AED] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E0B16] via-[#16122A] to-[#0E0B16] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#EC4899]/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <img
              src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/329df8a96fbfb4f61300025c05375e5e.png"
              alt="Bolso Furado"
              className="w-20 h-20 object-contain mb-4"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div className="bg-[#16122A] border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center mx-auto">
              <span className="w-7 h-7 flex items-center justify-center">
                <i className="ri-link-unlink-line text-[#EF4444] text-2xl"></i>
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#F9FAFB]">Link inválido ou expirado</h2>
            <p className="text-sm text-[#9CA3AF]">
              Este link de recuperação não é mais válido. Solicite um novo link de redefinição de senha.
            </p>
            <button
              onClick={() => navigate('/recuperar-senha')}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold text-sm transition-all cursor-pointer whitespace-nowrap"
            >
              Solicitar novo link
            </button>
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
            src="https://static.readdy.ai/image/bf718a2cc4cf5345b9929bb1f487ed03/329df8a96fbfb4f61300025c05375e5e.png"
            alt="Bolso Furado"
            className="w-20 h-20 object-contain mb-4"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <h1 className="text-2xl font-bold text-[#F9FAFB]">
            {success ? 'Senha redefinida!' : 'Nova senha'}
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1 text-center">
            {success
              ? 'Sua senha foi atualizada com sucesso'
              : 'Crie uma nova senha segura para sua conta'}
          </p>
        </div>

        <div className="bg-[#16122A] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#10B981]/20 to-[#7C3AED]/20 border border-[#10B981]/30 flex items-center justify-center">
                <span className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-shield-check-line text-[#10B981] text-2xl"></i>
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[#F9FAFB] font-semibold">Tudo certo!</p>
                <p className="text-sm text-[#9CA3AF]">
                  Você será redirecionado para o login em instantes...
                </p>
              </div>
              <div className="w-full bg-[#0E0B16] rounded-full h-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] animate-pulse rounded-full w-full"></div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-center gap-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-4 py-3">
                  <span className="w-5 h-5 flex items-center justify-center">
                    <i className="ri-error-warning-line text-[#EF4444] text-lg"></i>
                  </span>
                  <p className="text-sm text-[#EF4444]">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nova senha */}
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Nova senha</label>
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

                  {/* Indicador de força */}
                  {strength && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: strength.width, backgroundColor: strength.color }}
                        ></div>
                      </div>
                      <p className="text-xs" style={{ color: strength.color }}>
                        Força: {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirmar senha */}
                <div>
                  <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Confirmar senha</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                      <i className="ri-lock-2-line text-[#9CA3AF] text-base"></i>
                    </span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
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
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-[#EF4444] mt-1">As senhas não coincidem</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-[#10B981] mt-1 flex items-center gap-1">
                      <span className="w-3 h-3 flex items-center justify-center">
                        <i className="ri-check-line text-xs"></i>
                      </span>
                      Senhas coincidem
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold text-sm transition-all shadow-lg shadow-[#7C3AED]/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <span className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-save-line text-sm"></i>
                      </span>
                      Salvar nova senha
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
