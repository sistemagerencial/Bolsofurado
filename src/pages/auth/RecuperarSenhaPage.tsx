import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Step = 'request' | 'sent';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('request');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resetLink = `${window.location.origin}/redefinir-senha`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetLink,
      });

      if (resetError) throw resetError;

      // Chama a função personalizada de e-mail de redefinição (usando Supabase Functions)
      try {
        if (supabase.functions && typeof supabase.functions.invoke === 'function') {
          await supabase.functions.invoke('send-reset-password-email', {
            body: { email, resetLink },
          });
        } else {
          // Fallback: tentar endpoint relativo ao SUPABASE_URL
          const functionsEndpoint = `${(import.meta.env.VITE_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL) as string}/functions/v1`;
          await fetch(`${functionsEndpoint}/send-reset-password-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, resetLink }),
          });
        }
      } catch (e) {
        // Não bloqueia o fluxo se o e-mail personalizado falhar, mas registra para depuração
        console.warn('Falha ao chamar função de envio de e-mail de redefinição:', e);
      }

      setStep('sent');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar e-mail';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E0B16] via-[#16122A] to-[#0E0B16] flex items-center justify-center p-4">
      {/* Background effects */}
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
            {step === 'request' ? 'Recuperar senha' : 'E-mail enviado!'}
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1 text-center">
            {step === 'request'
              ? 'Informe seu e-mail e enviaremos um link para redefinir sua senha'
              : 'Verifique sua caixa de entrada e siga as instruções'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#16122A] border border-white/10 rounded-2xl p-8 shadow-2xl">

          {step === 'request' ? (
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold text-sm transition-all shadow-lg shadow-[#7C3AED]/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <span className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-send-plane-line text-sm"></i>
                      </span>
                      Enviar link de recuperação
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center space-y-5">
              {/* Ícone de sucesso */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED]/20 to-[#EC4899]/20 border border-[#7C3AED]/30 flex items-center justify-center">
                <span className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-mail-check-line text-[#7C3AED] text-2xl"></i>
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-[#F9FAFB] text-sm font-medium">
                  Enviamos um link para:
                </p>
                <p className="text-[#7C3AED] font-semibold text-sm break-all">{email}</p>
              </div>

              <div className="bg-[#0E0B16] border border-white/10 rounded-lg p-4 text-left w-full space-y-2">
                <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Próximos passos</p>
                <ul className="space-y-2">
                  {[
                    'Abra o e-mail que enviamos',
                    'Clique no link de redefinição',
                    'Crie uma nova senha segura',
                    'Faça login com a nova senha',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-[#D1D5DB]">
                      <span className="w-5 h-5 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#7C3AED] text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-[#9CA3AF]">
                Não recebeu o e-mail?{' '}
                <button
                  onClick={() => setStep('request')}
                  className="text-[#7C3AED] hover:text-[#EC4899] font-medium transition-colors cursor-pointer"
                >
                  Tentar novamente
                </button>
              </p>
            </div>
          )}

          <p className="text-center text-sm text-[#9CA3AF] mt-6">
            Lembrou a senha?{' '}
            <Link
              to="/login"
              className="text-[#7C3AED] hover:text-[#EC4899] font-medium transition-colors cursor-pointer"
            >
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
