import { useState } from 'react';

export default function ConstrucaoCalculadoras() {
  const [showModal, setShowModal] = useState(false);
  const [showProjetoDetalhes, setShowProjetoDetalhes] = useState<number | null>(null);
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [projetoSelecionado, setProjetoSelecionado] = useState<number | null>(null);
  
  const [projetos, setProjetos] = useState([
    {
      id: 1,
      nome: 'Reforma Cozinha',
      tipo: 'Reforma',
      tamanho: 25,
      planejado: 35000,
      realizado: 28500,
      status: 'Em andamento',
      lancamentos: [
        { id: 1, data: '2024-01-15', tipo: 'Materiais', descricao: 'Azulejos e pisos', valor: 8500, status: 'Pago' },
        { id: 2, data: '2024-01-20', tipo: 'Mão de obra', descricao: 'Pedreiro - 1ª parcela', valor: 5000, status: 'Pago' },
        { id: 3, data: '2024-02-01', tipo: 'Materiais', descricao: 'Armários planejados', valor: 12000, status: 'Pago' },
        { id: 4, data: '2024-02-10', tipo: 'Serviços', descricao: 'Instalação elétrica', valor: 3000, status: 'Pago' },
        { id: 5, data: '2024-02-15', tipo: 'Mão de obra', descricao: 'Pedreiro - 2ª parcela', valor: 5000, status: 'Previsto' },
      ]
    }
  ]);

  const [novoLancamento, setNovoLancamento] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: 'Materiais',
    descricao: '',
    valor: '',
    status: 'Previsto'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const abrirDetalhes = (projetoId: number) => {
    setShowProjetoDetalhes(projetoId);
  };

  const abrirLancamento = (projetoId: number) => {
    setProjetoSelecionado(projetoId);
    setShowLancamentoModal(true);
  };

  const adicionarLancamento = () => {
    if (!projetoSelecionado || !novoLancamento.descricao || !novoLancamento.valor) return;

    const valor = parseFloat(novoLancamento.valor);
    
    setProjetos(projetos.map(p => {
      if (p.id === projetoSelecionado) {
        const novoLanc = {
          id: p.lancamentos.length + 1,
          ...novoLancamento,
          valor
        };
        
        const novoRealizado = novoLancamento.status === 'Pago' 
          ? p.realizado + valor 
          : p.realizado;

        return {
          ...p,
          lancamentos: [...p.lancamentos, novoLanc],
          realizado: novoRealizado
        };
      }
      return p;
    }));

    setShowLancamentoModal(false);
    setNovoLancamento({
      data: new Date().toISOString().split('T')[0],
      tipo: 'Materiais',
      descricao: '',
      valor: '',
      status: 'Previsto'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#F9FAFB]">Projetos de Construção / Reforma</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
        >
          <i className="ri-add-line"></i>
          Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projetos.map((projeto) => (
          <div key={projeto.id}>
            <div 
              className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 cursor-pointer hover:border-[#7C3AED]/50 transition-all duration-300"
              onClick={() => abrirDetalhes(projeto.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#F9FAFB] mb-1">{projeto.nome}</h3>
                  <p className="text-sm text-[#9CA3AF]">{projeto.tipo} • {projeto.tamanho}m²</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F59E0B]/20 text-[#F59E0B]">
                  {projeto.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Planejado</p>
                  <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(projeto.planejado)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Realizado</p>
                  <p className="text-lg font-bold text-[#10B981]">{formatCurrency(projeto.realizado)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">Custo por m²</p>
                  <p className="text-lg font-bold text-[#7C3AED]">
                    {formatCurrency(projeto.realizado / projeto.tamanho)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-[#9CA3AF] mb-2">
                  <span>Progresso</span>
                  <span>{Math.round((projeto.realizado / projeto.planejado) * 100)}%</span>
                </div>
                <div className="w-full bg-[#111827] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(projeto.realizado / projeto.planejado) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {showProjetoDetalhes === projeto.id && (
              <div className="mt-4 bg-[#111827] border border-[#374151] rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-[#F9FAFB]">Lançamentos do Projeto</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirLancamento(projeto.id);
                    }}
                    className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
                  >
                    <i className="ri-add-line"></i>
                    Novo Lançamento
                  </button>
                </div>

                <div className="space-y-3">
                  {projeto.lancamentos.map((lanc) => (
                    <div key={lanc.id} className="bg-[#1F2937] border border-[#374151] rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            lanc.tipo === 'Materiais' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' :
                            lanc.tipo === 'Mão de obra' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                            lanc.tipo === 'Serviços' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' :
                            'bg-[#10B981]/20 text-[#10B981]'
                          }`}>
                            {lanc.tipo}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            lanc.status === 'Pago' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          }`}>
                            {lanc.status}
                          </span>
                        </div>
                        <p className="text-sm text-[#F9FAFB] font-medium mb-1">{lanc.descricao}</p>
                        <p className="text-xs text-[#9CA3AF]">
                          {new Date(lanc.data).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-[#F9FAFB] ml-4">{formatCurrency(lanc.valor)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showLancamentoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-[#F9FAFB] mb-6">Novo Lançamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label>
                <input
                  type="date"
                  value={novoLancamento.data}
                  onChange={(e) => setNovoLancamento({...novoLancamento, data: e.target.value})}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tipo</label>
                <select
                  value={novoLancamento.tipo}
                  onChange={(e) => setNovoLancamento({...novoLancamento, tipo: e.target.value})}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                >
                  <option value="Materiais">Materiais</option>
                  <option value="Mão de obra">Mão de obra</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Projeto">Projeto</option>
                  <option value="Extras">Extras</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Descrição</label>
                <input
                  type="text"
                  value={novoLancamento.descricao}
                  onChange={(e) => setNovoLancamento({...novoLancamento, descricao: e.target.value})}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="Descreva o lançamento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={novoLancamento.valor}
                  onChange={(e) => setNovoLancamento({...novoLancamento, valor: e.target.value})}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Status</label>
                <select
                  value={novoLancamento.status}
                  onChange={(e) => setNovoLancamento({...novoLancamento, status: e.target.value})}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                >
                  <option value="Previsto">Previsto</option>
                  <option value="Pago">Pago</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLancamentoModal(false);
                  setNovoLancamento({
                    data: new Date().toISOString().split('T')[0],
                    tipo: 'Materiais',
                    descricao: '',
                    valor: '',
                    status: 'Previsto'
                  });
                }}
                className="flex-1 bg-[#374151] text-[#F9FAFB] px-6 py-3 rounded-lg font-medium hover:bg-[#4B5563] transition-all duration-300 whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarLancamento}
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
