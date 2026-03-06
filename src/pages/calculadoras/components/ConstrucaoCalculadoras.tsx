import { useState, useEffect } from 'react';
import { useCalculatorProjects, ProjectLancamento } from '../../../hooks/useCalculatorProjects';

interface Lancamento {
  id: number;
  data: string;
  tipo: string;
  descricao: string;
  valor: number;
  status: string;
}

interface Projeto {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  planejado: number;
  realizado: number;
  status: string;
  lancamentos: ProjectLancamento[];
}

const LANCAMENTO_VAZIO = {
  data: new Date().toISOString().split('T')[0],
  tipo: 'Materiais',
  descricao: '',
  valor: '',
  status: 'Previsto'
};

const PROJETO_VAZIO = {
  nome: '',
  tipo: 'Reforma',
  tamanho: '',
  planejado: '',
  status: 'Planejado'
};

export default function ConstrucaoCalculadoras() {
  const { projects, loading, createProject, updateProject, deleteProject } = useCalculatorProjects();
  
  const [showProjetoModal, setShowProjetoModal] = useState(false);
  const [showProjetoDetalhes, setShowProjetoDetalhes] = useState<string | null>(null);
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [projetoSelecionado, setProjetoSelecionado] = useState<string | null>(null);
  const [editandoLancamento, setEditandoLancamento] = useState<{ projetoId: string; lancamento: ProjectLancamento & { index: number } } | null>(null);
  const [editandoProjeto, setEditandoProjeto] = useState<Projeto | null>(null);
  const [confirmExcluirLanc, setConfirmExcluirLanc] = useState<{ projetoId: string; lancIndex: number } | null>(null);
  const [confirmExcluirProjeto, setConfirmExcluirProjeto] = useState<string | null>(null);

  const [novoProjeto, setNovoProjeto] = useState(PROJETO_VAZIO);
  const [novoLancamento, setNovoLancamento] = useState(LANCAMENTO_VAZIO);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // ── Projeto ──────────────────────────────────────────────
  const abrirNovoProjeto = () => {
    setEditandoProjeto(null);
    setNovoProjeto(PROJETO_VAZIO);
    setShowProjetoModal(true);
  };

  const abrirEditarProjeto = (projeto: Projeto) => {
    setEditandoProjeto(projeto);
    setNovoProjeto({
      nome: projeto.nome,
      tipo: projeto.tipo,
      tamanho: String(projeto.tamanho),
      planejado: String(projeto.planejado),
      status: projeto.status
    });
    setShowProjetoModal(true);
  };

  const salvarProjeto = async () => {
    if (!novoProjeto.nome || !novoProjeto.tamanho || !novoProjeto.planejado) return;

    try {
      if (editandoProjeto) {
        await updateProject(editandoProjeto.id, {
          nome: novoProjeto.nome,
          tipo: novoProjeto.tipo,
          tamanho: Number(novoProjeto.tamanho),
          planejado: Number(novoProjeto.planejado),
          status: novoProjeto.status
        });
      } else {
        await createProject({
          nome: novoProjeto.nome,
          tipo: novoProjeto.tipo,
          tamanho: Number(novoProjeto.tamanho),
          planejado: Number(novoProjeto.planejado),
          realizado: 0,
          status: novoProjeto.status,
          lancamentos: []
        });
      }

      setShowProjetoModal(false);
      setNovoProjeto(PROJETO_VAZIO);
      setEditandoProjeto(null);
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      alert('Erro ao salvar projeto. Tente novamente.');
    }
  };

  const excluirProjeto = async (id: string) => {
    try {
      await deleteProject(id);
      if (showProjetoDetalhes === id) setShowProjetoDetalhes(null);
      setConfirmExcluirProjeto(null);
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      alert('Erro ao excluir projeto. Tente novamente.');
    }
  };

  // ── Lançamento ───────────────────────────────────────────
  const abrirNovoLancamento = (projetoId: string) => {
    setProjetoSelecionado(projetoId);
    setEditandoLancamento(null);
    setNovoLancamento(LANCAMENTO_VAZIO);
    setShowLancamentoModal(true);
  };

  const abrirEditarLancamento = (projetoId: string, lanc: ProjectLancamento, index: number) => {
    setProjetoSelecionado(projetoId);
    setEditandoLancamento({ projetoId, lancamento: { ...lanc, index } });
    setNovoLancamento({ data: lanc.data, tipo: lanc.descricao.includes('Materiais') ? 'Materiais' : 'Mão de obra', descricao: lanc.descricao, valor: String(lanc.valor), status: 'Pago' });
    setShowLancamentoModal(true);
  };

  const salvarLancamento = async () => {
    if (!projetoSelecionado || !novoLancamento.descricao || !novoLancamento.valor) return;
    const valor = parseFloat(novoLancamento.valor);

    try {
      const projeto = projects.find(p => p.id === projetoSelecionado);
      if (!projeto) return;

      let lancamentos = [...projeto.lancamentos];

      if (editandoLancamento) {
        lancamentos[editandoLancamento.lancamento.index] = {
          data: novoLancamento.data,
          descricao: novoLancamento.descricao,
          valor
        };
      } else {
        lancamentos.push({
          data: novoLancamento.data,
          descricao: novoLancamento.descricao,
          valor
        });
      }

      const realizado = lancamentos.reduce((s, l) => s + l.valor, 0);

      await updateProject(projetoSelecionado, {
        lancamentos,
        realizado
      });

      setShowLancamentoModal(false);
      setNovoLancamento(LANCAMENTO_VAZIO);
      setEditandoLancamento(null);
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      alert('Erro ao salvar lançamento. Tente novamente.');
    }
  };

  const excluirLancamento = async (projetoId: string, lancIndex: number) => {
    try {
      const projeto = projects.find(p => p.id === projetoId);
      if (!projeto) return;

      const lancamentos = projeto.lancamentos.filter((_, i) => i !== lancIndex);
      const realizado = lancamentos.reduce((s, l) => s + l.valor, 0);

      await updateProject(projetoId, {
        lancamentos,
        realizado
      });

      setConfirmExcluirLanc(null);
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      alert('Erro ao excluir lançamento. Tente novamente.');
    }
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#F9FAFB]">Projetos de Construção / Reforma</h2>
        <button
          onClick={abrirNovoProjeto}
          className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
        >
          <i className="ri-add-line"></i>
          Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((projeto) => (
          <div key={projeto.id}>
            <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 hover:border-[#7C3AED]/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setShowProjetoDetalhes(showProjetoDetalhes === projeto.id ? null : projeto.id)}
                >
                  <h3 className="text-xl font-bold text-[#F9FAFB] mb-1">{projeto.nome}</h3>
                  <p className="text-sm text-[#9CA3AF]">{projeto.tipo} • {projeto.tamanho}m²</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F59E0B]/20 text-[#F59E0B]">
                    {projeto.status}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); abrirEditarProjeto(projeto); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#374151] hover:bg-[#4B5563] text-[#9CA3AF] hover:text-[#F9FAFB] transition-all duration-200 cursor-pointer"
                    title="Editar projeto"
                  >
                    <i className="ri-edit-line text-sm"></i>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmExcluirProjeto(projeto.id); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#374151] hover:bg-[#EF4444]/20 text-[#9CA3AF] hover:text-[#EF4444] transition-all duration-200 cursor-pointer"
                    title="Excluir projeto"
                  >
                    <i className="ri-delete-bin-line text-sm"></i>
                  </button>
                </div>
              </div>

              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 cursor-pointer"
                onClick={() => setShowProjetoDetalhes(showProjetoDetalhes === projeto.id ? null : projeto.id)}
              >
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
                    {projeto.tamanho > 0 ? formatCurrency(projeto.realizado / projeto.tamanho) : 'R$ 0,00'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-[#9CA3AF] mb-2">
                  <span>Progresso</span>
                  <span>{projeto.planejado > 0 ? Math.round((projeto.realizado / projeto.planejado) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-[#111827] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${projeto.planejado > 0 ? Math.min((projeto.realizado / projeto.planejado) * 100, 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {showProjetoDetalhes === projeto.id && (
              <div className="mt-2 bg-[#111827] border border-[#374151] rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-[#F9FAFB]">Lançamentos do Projeto</h3>
                  <button
                    onClick={() => abrirNovoLancamento(projeto.id)}
                    className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-add-line"></i>
                    Novo Lançamento
                  </button>
                </div>

                {projeto.lancamentos.length === 0 ? (
                  <p className="text-center text-[#6B7280] py-8">Nenhum lançamento ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {projeto.lancamentos.map((lanc, index) => (
                      <div key={index} className="bg-[#1F2937] border border-[#374151] rounded-lg p-4 flex items-center justify-between group">
                        <div className="flex-1">
                          <p className="text-sm text-[#F9FAFB] font-medium mb-1">{lanc.descricao}</p>
                          <p className="text-xs text-[#9CA3AF]">
                            {new Date(lanc.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <p className="text-xl font-bold text-[#F9FAFB]">{formatCurrency(lanc.valor)}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => abrirEditarLancamento(projeto.id, lanc, index)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#374151] hover:bg-[#4B5563] text-[#9CA3AF] hover:text-[#F9FAFB] transition-all duration-200 cursor-pointer"
                              title="Editar"
                            >
                              <i className="ri-edit-line text-sm"></i>
                            </button>
                            <button
                              onClick={() => setConfirmExcluirLanc({ projetoId: projeto.id, lancIndex: index })}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#374151] hover:bg-[#EF4444]/20 text-[#9CA3AF] hover:text-[#EF4444] transition-all duration-200 cursor-pointer"
                              title="Excluir"
                            >
                              <i className="ri-delete-bin-line text-sm"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Novo/Editar Projeto */}
      {showProjetoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-[#F9FAFB] mb-6">
              {editandoProjeto ? 'Editar Projeto' : 'Novo Projeto'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Nome do Projeto *</label>
                <input
                  type="text"
                  value={novoProjeto.nome}
                  onChange={(e) => setNovoProjeto({ ...novoProjeto, nome: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="Ex: Reforma Cozinha"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tipo *</label>
                <select
                  value={novoProjeto.tipo}
                  onChange={(e) => setNovoProjeto({ ...novoProjeto, tipo: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                >
                  <option value="Reforma">Reforma</option>
                  <option value="Construção">Construção</option>
                  <option value="Ampliação">Ampliação</option>
                  <option value="Acabamento">Acabamento</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tamanho (m²) *</label>
                <input
                  type="number"
                  value={novoProjeto.tamanho}
                  onChange={(e) => setNovoProjeto({ ...novoProjeto, tamanho: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="Ex: 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Orçamento Planejado (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={novoProjeto.planejado}
                  onChange={(e) => setNovoProjeto({ ...novoProjeto, planejado: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Status</label>
                <select
                  value={novoProjeto.status}
                  onChange={(e) => setNovoProjeto({ ...novoProjeto, status: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                >
                  <option value="Planejado">Planejado</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Pausado">Pausado</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowProjetoModal(false); setNovoProjeto(PROJETO_VAZIO); setEditandoProjeto(null); }}
                className="flex-1 bg-[#374151] text-[#F9FAFB] px-6 py-3 rounded-lg font-medium hover:bg-[#4B5563] transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={salvarProjeto}
                className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                {editandoProjeto ? 'Salvar' : 'Criar Projeto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo/Editar Lançamento */}
      {showLancamentoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-[#F9FAFB] mb-6">
              {editandoLancamento ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label>
                <input
                  type="date"
                  value={novoLancamento.data}
                  onChange={(e) => setNovoLancamento({ ...novoLancamento, data: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Descrição</label>
                <input
                  type="text"
                  value={novoLancamento.descricao}
                  onChange={(e) => setNovoLancamento({ ...novoLancamento, descricao: e.target.value })}
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
                  onChange={(e) => setNovoLancamento({ ...novoLancamento, valor: e.target.value })}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowLancamentoModal(false); setNovoLancamento(LANCAMENTO_VAZIO); setEditandoLancamento(null); }}
                className="flex-1 bg-[#374151] text-[#F9FAFB] px-6 py-3 rounded-lg font-medium hover:bg-[#4B5563] transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={salvarLancamento}
                className="flex-1 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                {editandoLancamento ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar excluir lançamento */}
      {confirmExcluirLanc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 flex items-center justify-center bg-[#EF4444]/20 rounded-full mx-auto mb-4">
              <i className="ri-delete-bin-line text-[#EF4444] text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Excluir Lançamento?</h3>
            <p className="text-sm text-[#9CA3AF] mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmExcluirLanc(null)} className="flex-1 bg-[#374151] text-[#F9FAFB] px-4 py-2 rounded-lg font-medium hover:bg-[#4B5563] transition-all duration-300 whitespace-nowrap cursor-pointer">Cancelar</button>
              <button onClick={() => excluirLancamento(confirmExcluirLanc.projetoId, confirmExcluirLanc.lancIndex)} className="flex-1 bg-[#EF4444] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#DC2626] transition-all duration-300 whitespace-nowrap cursor-pointer">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar excluir projeto */}
      {confirmExcluirProjeto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 flex items-center justify-center bg-[#EF4444]/20 rounded-full mx-auto mb-4">
              <i className="ri-delete-bin-line text-[#EF4444] text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Excluir Projeto?</h3>
            <p className="text-sm text-[#9CA3AF] mb-6">Todos os lançamentos serão removidos. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmExcluirProjeto(null)} className="flex-1 bg-[#374151] text-[#F9FAFB] px-4 py-2 rounded-lg font-medium hover:bg-[#4B5563] transition-all duration-300 whitespace-nowrap cursor-pointer">Cancelar</button>
              <button onClick={() => excluirProjeto(confirmExcluirProjeto)} className="flex-1 bg-[#EF4444] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#DC2626] transition-all duration-300 whitespace-nowrap cursor-pointer">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}