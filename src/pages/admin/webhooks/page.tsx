import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface WebhookLog {
  id: string;
  action: string;
  details: {
    request_id: string;
    webhook_data?: any;
    status: string;
    error?: string;
    timestamp: string;
    payment_id?: string;
    processing_time?: number;
    user_agent?: string;
    ip_address?: string;
    retry_attempt?: number;
  };
  created_at: string;
}

interface PaymentStats {
  total_payments: number;
  approved_payments: number;
  pending_payments: number;
  failed_payments: number;
  total_amount: number;
  conversion_rate: number;
}

interface AlertStats {
  critical_alerts: number;
  webhook_errors: number;
  payment_orphans: number;
  last_24h_webhooks: number;
}

export default function WebhooksPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [alertStats, setAlertStats] = useState<AlertStats | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Carregar dados
  useEffect(() => {
    if (user) {
      loadDashboardData();
      
      if (autoRefresh) {
        const interval = setInterval(loadDashboardData, 30000); // 30 segundos
        setRefreshInterval(interval);
        return () => clearInterval(interval);
      }
    }
  }, [user, selectedTimeframe, autoRefresh]);

  // Cleanup interval
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadWebhookLogs(),
        loadPaymentStats(),
        loadAlertStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookLogs = async () => {
    try {
      let query = supabase
        .from('admin_logs')
        .select('*')
        .or('action.ilike.%webhook%,action.ilike.%payment%')
        .order('created_at', { ascending: false })
        .limit(100);

      // Filtro por timeframe
      const now = new Date();
      let startDate: Date;
      switch (selectedTimeframe) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      query = query.gte('created_at', startDate.toISOString());

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredData = data || [];

      // Filtro por status
      if (selectedStatus !== 'all') {
        filteredData = filteredData.filter(log => 
          log.details?.status === selectedStatus
        );
      }

      // Filtro por busca
      if (searchTerm) {
        filteredData = filteredData.filter(log =>
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details?.request_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details?.payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setWebhookLogs(filteredData);
    } catch (error) {
      console.error('Erro ao carregar logs de webhook:', error);
    }
  };

  const loadPaymentStats = async () => {
    try {
      const { data: payments, error } = await supabase
        .from('payment_history')
        .select('status, amount, created_at')
        .gte('created_at', getTimeframeDate().toISOString());

      if (error) throw error;

      const stats: PaymentStats = {
        total_payments: payments?.length || 0,
        approved_payments: payments?.filter(p => p.status === 'approved').length || 0,
        pending_payments: payments?.filter(p => p.status === 'pending').length || 0,
        failed_payments: payments?.filter(p => ['rejected', 'cancelled', 'expired'].includes(p.status)).length || 0,
        total_amount: payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        conversion_rate: 0
      };

      stats.conversion_rate = stats.total_payments > 0 
        ? (stats.approved_payments / stats.total_payments) * 100 
        : 0;

      setPaymentStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de pagamento:', error);
    }
  };

  const loadAlertStats = async () => {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const { data: alerts, error } = await supabase
        .from('admin_logs')
        .select('action, details')
        .gte('created_at', last24h.toISOString());

      if (error) throw error;

      const stats: AlertStats = {
        critical_alerts: alerts?.filter(a => 
          a.action.includes('alert') && 
          a.details?.severity === 'high'
        ).length || 0,
        webhook_errors: alerts?.filter(a => 
          a.action.includes('webhook') && 
          a.details?.status === 'error'
        ).length || 0,
        payment_orphans: alerts?.filter(a => 
          a.action.includes('reconciliation_alert_missing_history')
        ).length || 0,
        last_24h_webhooks: alerts?.filter(a => 
          a.action.includes('webhook')
        ).length || 0
      };

      setAlertStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de alerta:', error);
    }
  };

  const getTimeframeDate = () => {
    const now = new Date();
    switch (selectedTimeframe) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  };

  const reprocessWebhook = async (requestId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-webhook', {
        body: { manual_reprocess: true, request_id: requestId }
      });

      if (error) throw error;

      alert('Webhook reprocessado com sucesso!');
      loadDashboardData();
    } catch (error) {
      console.error('Erro ao reprocessar webhook:', error);
      alert('Erro ao reprocessar webhook');
    }
  };

  const validatePendingPayments = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-pending-payments');

      if (error) throw error;

      alert('Validação executada com sucesso!');
      loadDashboardData();
    } catch (error) {
      console.error('Erro ao validar pagamentos:', error);
      alert('Erro ao executar validação');
    }
  };

  const runReconciliation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('payment-reconciliation');

      if (error) throw error;

      alert('Reconciliação executada com sucesso!');
      loadDashboardData();
    } catch (error) {
      console.error('Erro ao executar reconciliação:', error);
      alert('Erro ao executar reconciliação');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-green-600 bg-green-100';
      case 'received': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'ignored': return 'text-gray-600 bg-gray-100';
      case 'signature_invalid': return 'text-orange-600 bg-orange-100';
      case 'retry_failed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (loading && !webhookLogs.length) {
    return (
      <div className="min-h-screen bg-[#0E0B16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#9CA3AF] text-sm">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0B16] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#F9FAFB]">
                Dashboard Webhooks & Pagamentos
              </h1>
              <p className="text-[#9CA3AF] mt-1">
                Monitor em tempo real dos webhooks do Mercado Pago
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-white/20 bg-[#16122A] text-[#7C3AED]"
                />
                <label htmlFor="autoRefresh" className="text-sm text-[#9CA3AF]">
                  Auto-refresh (30s)
                </label>
              </div>
              
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
                Atualizar
              </button>
            </div>
          </div>

          {/* Ferramentas de Ação Rápida */}
          <div className="flex items-center gap-3 p-4 bg-[#16122A] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 text-[#F9FAFB]">
              <i className="ri-tools-line text-[#7C3AED]"></i>
              <span className="font-medium">Ações Rápidas:</span>
            </div>
            
            <button
              onClick={validatePendingPayments}
              className="flex items-center gap-2 px-3 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm whitespace-nowrap"
            >
              <i className="ri-search-line"></i>
              Validar Pendentes
            </button>
            
            <button
              onClick={runReconciliation}
              className="flex items-center gap-2 px-3 py-2 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] transition-colors text-sm whitespace-nowrap"
            >
              <i className="ri-loop-left-line"></i>
              Reconciliação
            </button>
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Alertas Críticos */}
          <div className="bg-[#16122A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <i className="ri-alert-line text-red-500 text-xl"></i>
              </div>
              <span className="text-sm text-[#9CA3AF]">24h</span>
            </div>
            <div className="text-2xl font-bold text-[#F9FAFB] mb-1">
              {alertStats?.critical_alerts || 0}
            </div>
            <div className="text-sm text-[#9CA3AF]">Alertas Críticos</div>
          </div>

          {/* Webhooks Recebidos */}
          <div className="bg-[#16122A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <i className="ri-webhook-line text-blue-500 text-xl"></i>
              </div>
              <span className="text-sm text-[#9CA3AF]">24h</span>
            </div>
            <div className="text-2xl font-bold text-[#F9FAFB] mb-1">
              {alertStats?.last_24h_webhooks || 0}
            </div>
            <div className="text-sm text-[#9CA3AF]">Webhooks Recebidos</div>
          </div>

          {/* Taxa de Conversão */}
          <div className="bg-[#16122A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <i className="ri-percent-line text-green-500 text-xl"></i>
              </div>
              <span className="text-sm text-[#9CA3AF]">{selectedTimeframe}</span>
            </div>
            <div className="text-2xl font-bold text-[#F9FAFB] mb-1">
              {paymentStats?.conversion_rate.toFixed(1) || '0.0'}%
            </div>
            <div className="text-sm text-[#9CA3AF]">Taxa de Conversão</div>
          </div>

          {/* Valor Total */}
          <div className="bg-[#16122A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-[#7C3AED] text-xl"></i>
              </div>
              <span className="text-sm text-[#9CA3AF]">{selectedTimeframe}</span>
            </div>
            <div className="text-2xl font-bold text-[#F9FAFB] mb-1">
              {formatCurrency(paymentStats?.total_amount || 0)}
            </div>
            <div className="text-sm text-[#9CA3AF]">Valor Total</div>
          </div>
        </div>

        {/* Estatísticas Detalhadas */}
        {paymentStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Resumo de Pagamentos */}
            <div className="bg-[#16122A] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-[#F9FAFB] mb-4">
                Resumo de Pagamentos
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <i className="ri-check-line text-green-500 text-sm"></i>
                    </div>
                    <span className="text-[#9CA3AF]">Aprovados</span>
                  </div>
                  <span className="text-[#F9FAFB] font-semibold">
                    {paymentStats.approved_payments}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <i className="ri-time-line text-yellow-500 text-sm"></i>
                    </div>
                    <span className="text-[#9CA3AF]">Pendentes</span>
                  </div>
                  <span className="text-[#F9FAFB] font-semibold">
                    {paymentStats.pending_payments}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <i className="ri-close-line text-red-500 text-sm"></i>
                    </div>
                    <span className="text-[#9CA3AF]">Falharam</span>
                  </div>
                  <span className="text-[#F9FAFB] font-semibold">
                    {paymentStats.failed_payments}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[#F9FAFB] font-semibold">Total</span>
                    <span className="text-[#F9FAFB] font-bold text-lg">
                      {paymentStats.total_payments}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status de Sistema */}
            <div className="bg-[#16122A] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-[#F9FAFB] mb-4">
                Status do Sistema
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <i className="ri-error-warning-line text-red-500 text-sm"></i>
                    </div>
                    <span className="text-[#9CA3AF]">Erros de Webhook</span>
                  </div>
                  <span className="text-[#F9FAFB] font-semibold">
                    {alertStats?.webhook_errors || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <i className="ri-ghost-line text-orange-500 text-sm"></i>
                    </div>
                    <span className="text-[#9CA3AF]">Pagamentos Órfãos</span>
                  </div>
                  <span className="text-[#F9FAFB] font-semibold">
                    {alertStats?.payment_orphans || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <i className="ri-shield-check-line text-green-500 text-sm"></i>
                    </div>
                    <span className="text-[#9CA3AF]">Sistema</span>
                  </div>
                  <span className="text-green-500 font-semibold">
                    {(alertStats?.critical_alerts || 0) === 0 ? 'Saudável' : 'Com Alertas'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-[#16122A] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                Período
              </label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full p-3 bg-[#0E0B16] border border-white/20 rounded-lg text-[#F9FAFB] focus:ring-2 focus:ring-[#7C3AED]"
              >
                <option value="1h">Última hora</option>
                <option value="6h">Últimas 6 horas</option>
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 dias</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-3 bg-[#0E0B16] border border-white/20 rounded-lg text-[#F9FAFB] focus:ring-2 focus:ring-[#7C3AED]"
              >
                <option value="all">Todos</option>
                <option value="received">Recebido</option>
                <option value="processed">Processado</option>
                <option value="error">Erro</option>
                <option value="ignored">Ignorado</option>
                <option value="signature_invalid">Assinatura Inválida</option>
              </select>
            </div>

            {/* Busca */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                Buscar
              </label>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]"></i>
                <input
                  type="text"
                  placeholder="Request ID, Payment ID, Action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0E0B16] border border-white/20 rounded-lg text-[#F9FAFB] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logs de Webhooks */}
        <div className="bg-[#16122A] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#F9FAFB]">
                Logs de Webhooks ({webhookLogs.length})
              </h3>
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Monitorando em tempo real
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0E0B16]">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Tempo
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {webhookLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#9CA3AF]">
                      <div className="flex flex-col items-center gap-3">
                        <i className="ri-inbox-line text-3xl text-[#374151]"></i>
                        <span>Nenhum log encontrado para os filtros selecionados</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  webhookLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-[#F9FAFB]">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-[#0E0B16] px-2 py-1 rounded text-[#7C3AED] font-mono">
                          {log.details?.request_id?.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="p-4 text-sm text-[#F9FAFB]">
                        {log.action.replace('webhook_', '').replace('_', ' ')}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.details?.status || 'unknown')}`}>
                          {log.details?.status || 'unknown'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[#F9FAFB]">
                        {log.details?.payment_id && (
                          <code className="text-xs bg-[#0E0B16] px-2 py-1 rounded text-[#10B981] font-mono">
                            {log.details.payment_id}
                          </code>
                        )}
                      </td>
                      <td className="p-4 text-sm text-[#9CA3AF]">
                        {log.details?.processing_time && `${log.details.processing_time}ms`}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {log.details?.request_id && (
                            <button
                              onClick={() => reprocessWebhook(log.details.request_id)}
                              className="text-[#7C3AED] hover:text-[#6D28D9] text-sm whitespace-nowrap"
                              title="Reprocessar webhook"
                            >
                              <i className="ri-refresh-line"></i>
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(log.details, null, 2));
                              alert('Detalhes copiados!');
                            }}
                            className="text-[#9CA3AF] hover:text-[#F9FAFB] text-sm whitespace-nowrap"
                            title="Copiar detalhes"
                          >
                            <i className="ri-file-copy-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}