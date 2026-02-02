import { useState } from 'react';

export default function ServicoCalculadoras() {
  const [showModal, setShowModal] = useState(false);
  const [servicos, setServicos] = useState([
    {
      id: 1,
      bem: 'Honda Civic 2022',
      tipo: 'Manutenção',
      prestador: 'Auto Center Silva',
      data: '2024-01-15',
      valor: 850,
      observacoes: 'Troca de óleo e filtros'
    },
    {
      id: 2,
      bem: 'Honda Civic 2022',
      tipo: 'Conserto',
      prestador: 'Mecânica Rápida',
      data: '2023-12-10',
      valor: 1200,
      observacoes: 'Troca de pastilhas de freio'
    }
  ]);

  const [novoServico, setNovoServico] = useState({
    bem: '',
    tipo: 'Manutenção',
    prestador: '',
    data: new Date().toISOString().split('T')[0],
    valor: '',
    observacoes: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const adicionarServico = () => {
    if (!novoServico.bem || !novoServico.prestador || !novoServico.valor) return;

    const novoServ = {
      id: servicos.length + 1,
      ...novoServico,
      valor: parseFloat(novoServico.valor)
    };

    setServicos([novoServ, ...servicos]);
    setShowModal(false);
    setNovoServico({
      bem: '',
      tipo: 'Manutenção',
      prestador: '',
      data: new Date().toISOString().split('T')[0],
      valor: '',
      observacoes: ''
    });
  };

  const totalGasto = servicos.reduce((sum, s) => sum + s.valor, 0);
  const mediaGasto = totalGasto / servicos.length;

  return (
    <div>
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
          <p className="text-3xl font-bold text-[#7C3AED]">{servicos.length}</p>
        </div>
      </div>

      <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#F9FAFB]">Histórico de Serviços</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            Novo Lançamento
          </button>
        </div>

        <div className="space-y-4">
          {servicos.map((servico) => (
            <div key={servico.id} className="bg-[#111827] border border-[#374151] rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-[#F9FAFB] mb-1">{servico.bem}</h3>
                  <p className="text-sm text-[#9CA3AF]">{servico.tipo} • {servico.prestador}</p>
                </div>
                <p className="text-xl font-bold text-[#EF4444]">{formatCurrency(servico.valor)}</p>
              </div>
              <p className="text-sm text-[#9CA3AF] mb-2">{servico.observacoes}</p>
              <p className="text-xs text-[#6B7280]">
                {new Date(servico.data).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-[#F9FAFB] mb-6">Novo Serviço</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Bem Atendido *</label>
                <input
                  type="text"
                  value={novoServico.bem}
                  onChange={(e) => setNovoServico({...novoServico, bem: e.target.value})}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="Ex: Honda Civic 2022"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tipo de Serviço *</label>
                <select
                  value={novoServico.tipo}
                  onChange={(e) => setNovoServico({...novoServico, tipo: e.target.value})}
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
                  onChange={(e) => setNovoServico({...novoServico, prestador: e.target.value})}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="Nome do prestador"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data *</label>
                <input
                  type="date"
                  value={novoServico.data}
                  onChange={(e) => setNovoServico({...novoServico, data: e.target.value})}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor *</label>
                <input
                  type="number"
                  step="0.01"
                  value={novoServico.valor}
                  onChange={(e) => setNovoServico({...novoServico, valor: e.target.value})}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Observações</label>
                <textarea
                  value={novoServico.observacoes}
                  onChange={(e) => setNovoServico({...novoServico, observacoes: e.target.value})}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300 resize-none"
                  rows={3}
                  placeholder="Detalhes do serviço realizado"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNovoServico({
                    bem: '',
                    tipo: 'Manutenção',
                    prestador: '',
                    data: new Date().toISOString().split('T')[0],
                    valor: '',
                    observacoes: ''
                  });
                }}
                className="flex-1 bg-[#374151] text-[#F9FAFB] px-6 py-3 rounded-lg font-medium hover:bg-[#4B5563] transition-all duration-300 whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarServico}
                className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 whitespace-nowrap"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
