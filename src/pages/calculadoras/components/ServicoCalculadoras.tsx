import { useState } from 'react';
import { useCalculatorServices } from '../../../hooks/useCalculatorServices';

const SERVICO_VAZIO = {
  bem: '',
  tipo: 'Manutenção',
  prestador: '',
  data: new Date().toISOString().split('T')[0],
  valor: '',
  observacoes: ''
};

export default function ServicoCalculadoras() {
  const { services, loading, createService, updateService, deleteService } = useCalculatorServices();
  
  const [showModal, setShowModal] = useState(false);
  const [editandoServico, setEditandoServico] = useState<typeof services[0] | null>(null);
  const [confirmExcluir, setConfirmExcluir] = useState<string | null>(null);

  const [novoServico, setNovoServico] = useState(SERVICO_VAZIO);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const abrirNovoServico = () => {
    setEditandoServico(null);
    setNovoServico(SERVICO_VAZIO);
    setShowModal(true);
  };

  const abrirEditarServico = (servico: typeof services[0]) => {
    setEditandoServico(servico);
    setNovoServico({
      bem: servico.bem,
      tipo: servico.tipo,
      prestador: servico.prestador,
      data: servico.data,
      valor: String(servico.valor),
      observacoes: servico.observacoes
    });
    setShowModal(true);
  };

  const salvarServico = async () => {
    if (!novoServico.bem || !novoServico.prestador || !novoServico.valor) return;

    try {
      if (editandoServico) {
        await updateService(editandoServico.id, {
          bem: novoServico.bem,
          tipo: novoServico.tipo,
          prestador: novoServico.prestador,
          data: novoServico.data,
          valor: parseFloat(novoServico.valor),
          observacoes: novoServico.observacoes
        });
      } else {
        await createService({
          bem: novoServico.bem,
          tipo: novoServico.tipo,
          prestador: novoServico.prestador,
          data: novoServico.data,
          valor: parseFloat(novoServico.valor),
          observacoes: novoServico.observacoes
        });
      }

      setShowModal(false);
      setNovoServico(SERVICO_VAZIO);
      setEditandoServico(null);
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      alert('Erro ao salvar serviço. Tente novamente.');
    }
  };

  const excluirServico = async (id: string) => {
    try {
      await deleteService(id);
      setConfirmExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      alert('Erro ao excluir serviço. Tente novamente.');
    }
  };

  const totalGasto = services.reduce((sum, s) => sum + s.valor, 0);
  const mediaGasto = services.length > 0 ? totalGasto / services.length : 0;

  const tipoColor: Record<string, string> = {
    'Manutenção': 'bg-[#3B82F6]/20 text-[#3B82F6]',
    'Conserto': 'bg-[#EF4444]/20 text-[#EF4444]',
    'Revisão': 'bg-[#F59E0B]/20 text-[#F59E0B]',
    'Limpeza': 'bg-[#10B981]/20 text-[#10B981]',
    'Outros': 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6">
          <h3 className="text-sm text-[#9CA3AF] mb-2">Total Gasto</h3>
          <p className="text-3xl font-bold text-[#EF4444]">{formatCurrency(totalGasto)}</p>
        </div>
        <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6">
          <h3 className="text-sm text-[#9CA3AF] mb-2">Média por Serviço</h3>
          <p className="text-3xl font-bold text-[#F59E0B]">{formatCurrency(mediaGasto)}</p>
        </div>
        <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6">
          <h3 className="text-sm text-[#9CA3AF] mb-2">Total de Serviços</h3>
          <p className="text-3xl font-bold text-[#7C3AED]">{services.length}</p>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#F9FAFB]">Histórico de Serviços</h2>
          <button
            onClick={abrirNovoServico}
            className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line"></i>
            Novo Lançamento
          </button>
        </div>

        {services.length === 0 ? (
          <p className="text-center text-[#6B7280] py-10">Nenhum serviço registrado ainda.</p>
        ) : (
          <div className="space-y-4">
            {services.map((servico) => (
              <div key={servico.id} className="bg-[#111827] border border-[#374151] rounded-lg p-4 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-[#F9FAFB]">{servico.bem}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${tipoColor[servico.tipo] ?? 'bg-[#374151] text-[#9CA3AF]'}`}>
                        {servico.tipo}
                      </span>
                    </div>
                    <p className="text-sm text-[#9CA3AF]">{servico.prestador}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <p className="text-xl font-bold text-[#EF4444]">{formatCurrency(servico.valor)}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => abrirEditarServico(servico)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#374151] hover:bg-[#4B5563] text-[#9CA3AF] hover:text-[#F9FAFB] transition-all duration-200 cursor-pointer"
                        title="Editar"
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button
                        onClick={() => setConfirmExcluir(servico.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#374151] hover:bg-[#EF4444]/20 text-[#9CA3AF] hover:text-[#EF4444] transition-all duration-200 cursor-pointer"
                        title="Excluir"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
                {servico.observacoes && (
                  <p className="text-sm text-[#9CA3AF] mb-2">{servico.observacoes}</p>
                )}
                <p className="text-xs text-[#6B7280]">
                  {new Date(servico.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Novo/Editar Serviço */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#F9FAFB] mb-6">
              {editandoServico ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Bem Atendido *</label>
                <input
                  type="text"
                  value={novoServico.bem}
                  onChange={(e) => setNovoServico({ ...novoServico, bem: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="Ex: Honda Civic 2022"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tipo de Serviço *</label>
                <select
                  value={novoServico.tipo}
                  onChange={(e) => setNovoServico({ ...novoServico, tipo: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                >
                  <option value="Manutenção">Manutenção</option>
                  <option value="Conserto">Conserto</option>
                  <option value="Revisão">Revisão</option>
                  <option value="Limpeza">Limpeza</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Prestador *</label>
                <input
                  type="text"
                  value={novoServico.prestador}
                  onChange={(e) => setNovoServico({ ...novoServico, prestador: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="Nome do prestador"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data *</label>
                <input
                  type="date"
                  value={novoServico.data}
                  onChange={(e) => setNovoServico({ ...novoServico, data: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor *</label>
                <input
                  type="number"
                  step="0.01"
                  value={novoServico.valor}
                  onChange={(e) => setNovoServico({ ...novoServico, valor: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Observações</label>
                <textarea
                  value={novoServico.observacoes}
                  onChange={(e) => setNovoServico({ ...novoServico, observacoes: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300 resize-none"
                  rows={3}
                  maxLength={500}
                  placeholder="Detalhes do serviço realizado"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setNovoServico(SERVICO_VAZIO); setEditandoServico(null); }}
                className="flex-1 bg-[#374151] text-[#F9FAFB] px-6 py-3 rounded-lg font-medium hover:bg-[#4B5563] transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={salvarServico}
                className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                {editandoServico ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {confirmExcluir !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 flex items-center justify-center bg-[#EF4444]/20 rounded-full mx-auto mb-4">
              <i className="ri-delete-bin-line text-[#EF4444] text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Excluir Serviço?</h3>
            <p className="text-sm text-[#9CA3AF] mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmExcluir(null)}
                className="flex-1 bg-[#374151] text-[#F9FAFB] px-4 py-2 rounded-lg font-medium hover:bg-[#4B5563] transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => excluirServico(confirmExcluir)}
                className="flex-1 bg-[#EF4444] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#DC2626] transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}