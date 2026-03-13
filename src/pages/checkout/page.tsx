import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import CardForm from '@/components/checkout/CardForm';

interface PaymentData {
  id: string;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  external_reference?: string;
}

interface Profile {
  id: string;
  full_name?: string;
  email: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  badge?: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    description: 'Ideal para começar',
    price: 19.90,
    period: 'mês',
    features: [
      'Controle completo de finanças',
      'Relatórios detalhados',
      'Calculadoras financeiras',
      'Planejamento de orçamento',
      'Suporte prioritário'
    ]
  },
  {
    id: 'yearly',
    name: 'Plano Anual',
    description: 'Melhor custo-benefício',
    price: 199.00,
    period: 'ano',
    badge: 'Mais Popular',
    features: [
      'Tudo do plano mensal',
      'Economia de R$ 39,80',
      'Recursos exclusivos',
      'Backup automático',
      'Suporte VIP 24/7'
    ]
  }
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const planType = searchParams.get('plan') || 'monthly';
  
  const [step, setStep] = useState<'select' | 'payment' | 'processing'>('select');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutos
  const [checking, setChecking] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(planType);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const maxCheckAttempts = 60; // 5 minutos verificando

  // Novos estados para cartão de crédito
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  // Carregar perfil do usuário
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Timer countdown
  useEffect(() => {
    if (step === 'payment' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            alert('PIX expirado! Gerando novo pagamento...');
            handleCreatePayment();
            return 900;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  // Verificação automática do pagamento
  useEffect(() => {
    if (step === 'payment' && paymentData?.id && !simulationMode) {
      const interval = setInterval(async () => {
        if (checkAttempts >= maxCheckAttempts) {
          clearInterval(interval);
          setChecking(false);
          return;
        }

        await checkPaymentStatus();
        setCheckAttempts(prev => prev + 1);
      }, 5000); // Verificar a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [step, paymentData, checkAttempts, simulationMode]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  // Formatar número do cartão
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    setCardErrors({ ...cardErrors, cardNumber: '' });
  };

  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(digits);
    setCardErrors({ ...cardErrors, cardCvv: '' });
  };

  const handleCardCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCardCpf(formatted);
    setCardErrors({ ...cardErrors, cardCpf: '' });
  };

  // Validar campos do cartão
  const validateCardFields = (): boolean => {
    const errors: Record<string, string> = {};

    if (!cardNumber.replace(/\s/g, '')) {
      errors.cardNumber = 'Digite o número do cartão';
    } else if (cardNumber.replace(/\s/g, '').length < 13) {
      errors.cardNumber = 'Número do cartão inválido';
    }

    if (!cardName.trim()) {
      errors.cardName = 'Digite o nome do titular';
    }

    if (!cardExpMonth) {
      errors.cardExpMonth = 'Selecione o mês';
    }

    if (!cardExpYear) {
      errors.cardExpYear = 'Selecione o ano';
    }

    if (!cardCvv) {
      errors.cardCvv = 'Digite o CVV';
    } else if (cardCvv.length < 3) {
      errors.cardCvv = 'CVV inválido';
    }

    if (!cardCpf.trim()) {
      errors.cardCpf = 'Digite o CPF do titular';
    } else if (!validateCpf(cardCpf)) {
      errors.cardCpf = 'CPF inválido';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Processar pagamento com cartão
  const handleCardPayment = async () => {
    if (!user || !selectedPlanData) return;

    if (!validateCardFields()) {
      return;
    }

    setIsProcessingCard(true);

    try {
      // Carregar SDK do Mercado Pago
      const sessionResp = await supabase.auth.getSession();
      const accessToken = sessionResp?.data?.session?.access_token;
      const mpPublicKeyResponse = await supabase.functions.invoke('get-mp-public-key', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      
      if (mpPublicKeyResponse.error || !mpPublicKeyResponse.data?.public_key) {
        throw new Error('Erro ao obter chave pública do Mercado Pago');
      }

      const publicKey = mpPublicKeyResponse.data.public_key;

      // Criar token do cartão usando SDK do Mercado Pago
      const mp = new (window as any).MercadoPago(publicKey);
      
      const cardToken = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardName,
        cardExpirationMonth: cardExpMonth,
        cardExpirationYear: cardExpYear,
        securityCode: cardCvv,
        identificationType: 'CPF',
        identificationNumber: cardCpf.replace(/\D/g, ''),
      });

      if (!cardToken?.id) {
        throw new Error('Erro ao gerar token do cartão');
      }

      // Identificar BIN (6 primeiros dígitos) e obter método de pagamento
      const bin = cardNumber.replace(/\s/g, '').substring(0, 6);
      let paymentMethodInfo: any = null;
      try {
        paymentMethodInfo = await mp.getPaymentMethod({ bin });
      } catch (err) {
        console.warn('Erro ao obter informações do método de pagamento:', err);
      }

      // Enviar pagamento para a edge function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          user_id: user.id,
          plan: selectedPlan,
          payment_method: 'credit_card',
          token: cardToken.id,
          installments: 1,
          payer: {
            email: user.email,
            first_name: cardName.split(' ')[0],
            last_name: cardName.split(' ').slice(1).join(' '),
            identification: {
              type: 'CPF',
              number: cardCpf.replace(/\D/g, ''),
            },
            // Campos adicionados para compatibilidade com o backend
            payment_method_id: paymentMethodInfo?.results?.[0]?.id ?? undefined,
            issuer_id: paymentMethodInfo?.results?.[0]?.issuer?.id ?? undefined,
          },
        },
      }, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar pagamento');
      }

      // Verificar status do pagamento
      if (data?.status === 'approved') {
        // Pagamento aprovado - redirecionar para dashboard
        navigate('/?payment=success');
      } else if (data?.status === 'pending' || data?.status === 'in_process') {
        // Pagamento pendente
        alert('Pagamento em análise. Você receberá uma notificação quando for aprovado.');
        navigate('/assinatura');
      } else if (data?.status === 'rejected') {
        // Pagamento rejeitado
        const statusDetail = data?.status_detail || '';
        let errorMsg = 'Pagamento recusado. ';
        
        if (statusDetail.includes('cc_rejected_insufficient_amount')) {
          errorMsg += 'Saldo insuficiente no cartão.';
        } else if (statusDetail.includes('cc_rejected_bad_filled')) {
          errorMsg += 'Verifique os dados do cartão.';
        } else if (statusDetail.includes('cc_rejected_call_for_authorize')) {
          errorMsg += 'Entre em contato com seu banco para autorizar.';
        } else {
          errorMsg += 'Tente outro cartão ou forma de pagamento.';
        }
        
        alert(errorMsg);
      } else {
        throw new Error(data?.error || 'Erro desconhecido ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar cartão:', error);
      alert(error instanceof Error ? error.message : 'Erro ao processar pagamento com cartão');
    } finally {
      setIsProcessingCard(false);
    }
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);
    setCpfError('');
  };

  const validateCpf = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(digits[10]);
  };

  const handleCreatePayment = async () => {
    if (!user || !selectedPlanData) return;

    // Validar CPF antes de prosseguir
    if (!cpf.trim()) {
      setCpfError('Informe seu CPF para continuar');
      return;
    }
    if (!validateCpf(cpf)) {
      setCpfError('CPF inválido. Verifique e tente novamente');
      return;
    }

    setIsCreatingPayment(true);
    setCheckAttempts(0);
    
    try {
      console.log('Criando pagamento PIX...', {
        plan: selectedPlan,
        user_id: user.id,
        cpf: cpf.replace(/\D/g, '').slice(0, 3) + '***'
      });

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          user_id: user.id,
          plan: selectedPlan,
          payment_method: "pix",
          payer: {
            email: user.email,
            cpf: cpf
          }
        }
      });

      console.log('EDGE DATA:', data);

      if (error) {
        // 👇 MOSTRA O ERRO REAL QUE A FUNÇÃO RETORNOU
        const msg = await error.context?.json?.().catch(() => null);
        console.error('EDGE ERROR:', msg || error);
        throw error;
      }

      // Verificar se há erro retornado no data
      if (data?.error) {
        console.error('Erro retornado no data:', data.error);
        throw new Error(data.error);
      }

      // A edge function retorna payment_id, qr_code, qr_code_base64 diretamente
      if (data?.payment_id && (data?.qr_code || data?.qr_code_base64)) {
        console.log('PIX gerado com sucesso:', data.payment_id);
        setPaymentData({
          id: String(data.payment_id),
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          ticket_url: data.ticket_url,
          external_reference: `${user.id}|${selectedPlan}`,
        });
        setStep('payment');
        setTimeLeft(900);
        setChecking(true);
      } else {
        console.error('Resposta inválida:', data);
        const errMsg = data?.error || 'Resposta inválida do servidor. Dados do PIX não foram retornados.';
        throw new Error(errMsg);
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      
      // Extrair mensagem de erro mais específica
      let errorMessage = 'Erro ao gerar PIX. Tente novamente.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Mensagens mais amigáveis para erros comuns
        if (errorMessage.includes('MERCADOPAGO_ACCESS_TOKEN')) {
          errorMessage = 'Erro de configuração do sistema. Entre em contato com o suporte.';
        } else if (errorMessage.includes('CPF')) {
          errorMessage = 'CPF inválido ou não aceito. Verifique os dados e tente novamente.';
        } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          errorMessage = 'Serviço de pagamento temporariamente indisponível. Tente novamente em instantes.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData?.id) return;

    try {
      setChecking(true);
      
      const sessionResp2 = await supabase.auth.getSession();
      const accessToken2 = sessionResp2?.data?.session?.access_token;
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: {
          payment_id: paymentData.id
        }
      }, {
        headers: accessToken2 ? { Authorization: `Bearer ${accessToken2}` } : undefined,
      });

      if (error) {
        console.error('Erro ao verificar pagamento:', error);
        return;
      }

      if (data?.status === 'approved') {
        // Pagamento aprovado!
        navigate('/assinatura?success=true');
        return;
      }

      console.log('Status do pagamento:', data?.status || 'pending');
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setChecking(false);
    }
  };

  const simulatePayment = async () => {
    if (!paymentData?.id || !user) return;

    setSimulationMode(true);
    
    try {
      const sessionResp3 = await supabase.auth.getSession();
      const accessToken3 = sessionResp3?.data?.session?.access_token;
      const { data, error } = await supabase.functions.invoke('simulate-payment', {
        body: {
          payment_id: paymentData.id,
          plan_type: selectedPlan
        }
      }, {
        headers: accessToken3 ? { Authorization: `Bearer ${accessToken3}` } : undefined,
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        // Aguardar um pouco para simular processamento
        setTimeout(() => {
          navigate('/assinatura?success=true&simulation=true');
        }, 2000);
      }
    } catch (error) {
      console.error('Erro na simulação:', error);
      alert('Erro ao simular pagamento');
    } finally {
      setSimulationMode(false);
    }
  };

  // Renderização da tela de pagamento PIX
  if (step === 'payment' && paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('select')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <i className="ri-arrow-left-line text-xl mr-2"></i>
                Voltar
              </button>
              <div className="text-sm text-gray-500">
                Pagamento PIX
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Lado esquerdo - Resumo do pedido */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Resumo do Pedido
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plano:</span>
                    <span className="font-semibold">
                      {selectedPlan === 'yearly' ? 'Anual' : 'Mensal'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-semibold text-green-600">
                      R$ {selectedPlan === 'yearly' ? '199,00' : '19,90'}
                    </span>
                  </div>
                  {selectedPlan === 'yearly' && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      💡 Economia de R$ 39,80 no plano anual!
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">
                      R$ {selectedPlan === 'yearly' ? '199,00' : '19,90'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center text-orange-600 mb-2">
                  <i className="ri-time-line text-xl mr-2"></i>
                  <span className="font-semibold">Tempo restante</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  O PIX expira automaticamente
                </div>
              </div>
            </div>

            {/* Lado direito - QR Code e instruções */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Pague com PIX
                </h2>

                {/* QR Code */}
                {paymentData.qr_code_base64 && (
                  <div className="text-center mb-6">
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border-2 border-gray-100">
                      <img 
                        src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                        alt="QR Code PIX" 
                        className="w-36 h-36 sm:w-48 sm:h-48 mx-auto"
                      />
                    </div>
                  </div>
                )}

                {/* Código PIX */}
                {paymentData.qr_code && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ou copie o código PIX:
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentData.qr_code}
                        readOnly
                        className="w-full bg-white border border-gray-300 rounded-lg p-3 text-black font-mono text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(paymentData.qr_code!);
                          alert('Código PIX copiado!');
                        }}
                        className="px-4 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                      >
                        <i className="ri-file-copy-line"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Instruções */}
                <div className="space-y-3 text-sm text-gray-600">
                  <h3 className="font-semibold text-gray-900">Como pagar:</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold mr-3 mt-0.5">1</span>
                      <span>Abra seu app bancário ou carteira digital</span>
                    </div>
                    <div className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold mr-3 mt-0.5">2</span>
                      <span>Escaneie o QR Code ou cole o código PIX</span>
                    </div>
                    <div className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold mr-3 mt-0.5">3</span>
                      <span>Confirme o pagamento</span>
                    </div>
                    <div className="flex items-start">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold mr-3 mt-0.5">4</span>
                      <span>Aguarde a confirmação automática</span>
                    </div>
                  </div>
                </div>

                {/* Botão de simulação para testes */}
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center text-yellow-800 mb-2">
                    <i className="ri-flask-line text-lg mr-2"></i>
                    <span className="font-semibold text-sm">Modo de Teste</span>
                  </div>
                  <p className="text-xs text-yellow-700 mb-3">
                    Use este botão para simular a aprovação do pagamento PIX
                  </p>
                  <button
                    onClick={simulatePayment}
                    disabled={simulationMode}
                    className="w-full py-2 px-4 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {simulationMode ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Simulando pagamento...
                      </>
                    ) : (
                      <>
                        <i className="ri-play-circle-line mr-2"></i>
                        Simular Pagamento Aprovado
                      </>
                    )}
                  </button>
                </div>

                {/* Status de verificação */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-blue-800">
                    {checking ? (
                      <>
                        <i className="ri-loader-4-line animate-spin text-lg mr-2"></i>
                        <span className="text-sm">Verificando pagamento...</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-refresh-line text-lg mr-2"></i>
                        <span className="text-sm">Aguardando pagamento...</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    A confirmação é automática e leva até 2 minutos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de seleção de planos
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header com botão voltar */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/assinatura')}
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors cursor-pointer mb-4 text-sm"
          >
            <i className="ri-arrow-left-line"></i>
            Voltar para assinatura
          </button>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F9FAFB] mb-2">
              Escolha seu Plano
            </h1>
            <p className="text-[#9CA3AF] text-lg">
              Desbloqueie todos os recursos do Bolso Furado
            </p>
          </div>
        </div>

        {/* Informações do usuário */}
        {profile && (
          <div className="bg-[#16122A] border border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
                <i className="ri-user-line text-[#7C3AED] text-lg"></i>
              </div>
              <div>
                <p className="text-[#F9FAFB] font-semibold">{profile.full_name || user?.email}</p>
                <p className="text-[#9CA3AF] text-sm">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Seleção de planos */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'ring-2 ring-[#7C3AED] bg-gradient-to-br from-[#7C3AED]/10 to-[#EC4899]/5'
                  : 'hover:bg-[#16122A]/50'
              } bg-[#16122A] border border-white/10 rounded-2xl p-6`}
            >
              {plan.badge && (
                <span className="absolute -top-3 right-4 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#F9FAFB] mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#9CA3AF]">{plan.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === plan.id 
                    ? 'border-[#7C3AED] bg-[#7C3AED]' 
                    : 'border-white/20'
                }`}>
                  {selectedPlan === plan.id && (
                    <i className="ri-check-line text-white text-sm"></i>
                  )}
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-[#F9FAFB]">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[#9CA3AF]">/ {plan.period}</span>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-[#10B981]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-check-line text-[#10B981] text-sm"></i>
                    </div>
                    <span className="text-sm text-[#9CA3AF]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Resumo e formulário de pagamento */}
        <div className="bg-[#16122A] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-[#F9FAFB] mb-4">Resumo do Pedido</h3>
          
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <span className="text-[#9CA3AF]">{selectedPlanData?.name}</span>
            <span className="font-semibold text-[#F9FAFB]">
              R$ {selectedPlanData?.price.toFixed(2).replace('.', ',')}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-3 mb-6">
            <span className="font-semibold text-[#F9FAFB]">Total</span>
            <span className="text-2xl font-bold text-[#F9FAFB]">
              R$ {selectedPlanData?.price.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Seletor de método de pagamento */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#9CA3AF] mb-3">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'pix'
                    ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <i className="ri-qr-code-line text-2xl text-[#00C9A7]"></i>
                  <span className="font-semibold text-[#F9FAFB]">PIX</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1">Aprovação imediata</p>
              </button>

              <button
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'credit_card'
                    ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <i className="ri-bank-card-line text-2xl text-[#EC4899]"></i>
                  <span className="font-semibold text-[#F9FAFB]">Cartão</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1">Crédito</p>
              </button>
            </div>
          </div>

          {/* Formulário PIX */}
          {paymentMethod === 'pix' && (
            <>
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                  CPF do Titular <span className="text-[#EC4899]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-id-card-line text-[#9CA3AF] text-base"></i>
                  </div>
                  <input
                    type="text"
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`w-full pl-10 pr-4 py-3 bg-[#0D0A1A] border rounded-xl text-[#F9FAFB] placeholder-[#4B5563] text-sm focus:outline-none focus:ring-2 transition-all ${
                      cpfError
                        ? 'border-red-500 focus:ring-red-500/30'
                        : 'border-white/10 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/60'
                    }`}
                  />
                </div>
                {cpfError && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>
                    {cpfError}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-[#6B7280]">
                  Obrigatório para pagamentos via PIX
                </p>
              </div>

              <button
                onClick={handleCreatePayment}
                disabled={isCreatingPayment}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-bold py-4 px-6 rounded-xl transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-[#7C3AED]/25"
              >
                {isCreatingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <i className="ri-qr-code-line mr-3 text-lg"></i>
                    Gerar PIX - R$ {selectedPlanData?.price.toFixed(2).replace('.', ',')}
                  </>
                )}
              </button>
            </>
          )}

          {/* Formulário Cartão de Crédito (extraído para component) */}
          {paymentMethod === 'credit_card' && (
            <>
              {/* CardForm component renders the exact same UI */}
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore - dynamic import path respected by project aliases */}
              <CardForm
                cardNumber={cardNumber}
                onCardNumberChange={handleCardNumberChange}
                cardName={cardName}
                onCardNameChange={(e) => { setCardName(e.target.value.toUpperCase()); setCardErrors({ ...cardErrors, cardName: '' }); }}
                cardExpMonth={cardExpMonth}
                onCardExpMonthChange={(e) => { setCardExpMonth(e.target.value); setCardErrors({ ...cardErrors, cardExpMonth: '' }); }}
                cardExpYear={cardExpYear}
                onCardExpYearChange={(e) => { setCardExpYear(e.target.value); setCardErrors({ ...cardErrors, cardExpYear: '' }); }}
                cardCvv={cardCvv}
                onCardCvvChange={handleCardCvvChange}
                cardCpf={cardCpf}
                onCardCpfChange={handleCardCpfChange}
                cardErrors={cardErrors}
                onPay={handleCardPayment}
                isProcessing={isProcessingCard}
                selectedPlanPrice={selectedPlanData?.price}
              />
            </>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-[#9CA3AF] mt-3">
            <i className="ri-shield-check-line text-[#10B981]"></i>
            <span>Pagamento seguro via Mercado Pago</span>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="bg-[#16122A]/50 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <i className="ri-time-line text-[#7C3AED] text-lg"></i>
              <span className="font-semibold text-[#F9FAFB] text-sm">Ativação Instantânea</span>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Seu plano é ativado automaticamente após a confirmação do pagamento
            </p>
          </div>

          <div className="bg-[#16122A]/50 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <i className="ri-customer-service-line text-[#EC4899] text-lg"></i>
              <span className="font-semibold text-[#F9FAFB] text-sm">Suporte Completo</span>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Dúvidas? Fale conosco:{' '}
              <a href="mailto:epicsistemas10@gmail.com" className="text-[#EC4899] hover:underline cursor-pointer">
                epicsistemas10@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
