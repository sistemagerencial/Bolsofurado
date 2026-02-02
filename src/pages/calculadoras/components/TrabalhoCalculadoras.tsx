import { useState } from 'react';

export default function TrabalhoCalculadoras() {
  const [calculadora, setCalculadora] = useState<string | null>(null);
  
  // Estados para Salário Líquido
  const [salarioBruto, setSalarioBruto] = useState('');
  const [beneficios, setBeneficios] = useState('');
  const [valeTransporte, setValeTransporte] = useState('');
  const [valeRefeicao, setValeRefeicao] = useState('');
  const [planoSaude, setPlanoSaude] = useState('');
  const [outrosDescontos, setOutrosDescontos] = useState('');
  const [dependentes, setDependentes] = useState('');
  const [resultadoSalario, setResultadoSalario] = useState<{
    liquido: number;
    inss: number;
    irrf: number;
    totalDescontos: number;
  } | null>(null);

  // Estados para Férias
  const [salarioFerias, setSalarioFerias] = useState('');
  const [diasFerias, setDiasFerias] = useState('30');
  const [resultadoFerias, setResultadoFerias] = useState<{
    valorFerias: number;
    tercoConstitucional: number;
    total: number;
  } | null>(null);

  // Estados para 13º
  const [salarioDecimo, setSalarioDecimo] = useState('');
  const [mesesTrabalhados, setMesesTrabalhados] = useState('12');
  const [resultadoDecimo, setResultadoDecimo] = useState<number | null>(null);

  // Estados para Rescisão
  const [salarioRescisao, setSalarioRescisao] = useState('');
  const [mesesRescisao, setMesesRescisao] = useState('');
  const [diasAviso, setDiasAviso] = useState('30');
  const [saldoFgts, setSaldoFgts] = useState('');
  const [resultadoRescisao, setResultadoRescisao] = useState<{
    saldoSalario: number;
    feriasProporcionais: number;
    decimoTerceiro: number;
    avisoPrevi: number;
    multaFgts: number;
    total: number;
  } | null>(null);
  
  // Estados para Empréstimo
  const [valorEmprestimo, setValorEmprestimo] = useState('');
  const [taxaJuros, setTaxaJuros] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState('');
  const [resultadoEmprestimo, setResultadoEmprestimo] = useState<{
    parcela: number;
    total: number;
    juros: number;
  } | null>(null);

  // Estados para Financiamento
  const [valorImovel, setValorImovel] = useState('');
  const [entrada, setEntrada] = useState('');
  const [taxaFinanciamento, setTaxaFinanciamento] = useState('');
  const [prazoFinanciamento, setPrazoFinanciamento] = useState('');
  const [resultadoFinanciamento, setResultadoFinanciamento] = useState<{
    parcela: number;
    total: number;
    juros: number;
    valorFinanciado: number;
  } | null>(null);

  // Estados para Aposentadoria
  const [idadeAtual, setIdadeAtual] = useState('');
  const [idadeAposentadoria, setIdadeAposentadoria] = useState('');
  const [aporteInicial, setAporteInicial] = useState('');
  const [aporteMensal, setAporteMensal] = useState('');
  const [rentabilidade, setRentabilidade] = useState('');
  const [resultadoAposentadoria, setResultadoAposentadoria] = useState<{
    totalAcumulado: number;
    totalAportado: number;
    rendimento: number;
    mesesContribuicao: number;
  } | null>(null);

  const calcular = () => {
    if (calculadora === 'salario') {
      const bruto = parseFloat(salarioBruto);
      if (!bruto) return;

      let liquido = bruto;
      let inss = 0;
      let irrf = 0;
      
      if (bruto <= 1320) {
        inss = bruto * 0.075;
      } else if (bruto <= 2571.29) {
        inss = bruto * 0.09;
      } else if (bruto <= 3856.94) {
        inss = bruto * 0.12;
      } else if (bruto <= 7507.49) {
        inss = bruto * 0.14;
      } else {
        inss = 7507.49 * 0.14;
      }

      const baseIrrf = bruto - inss - (parseFloat(dependentes) || 0) * 189.59;

      if (baseIrrf > 1903.98) {
        if (baseIrrf <= 2826.65) {
          irrf = baseIrrf * 0.075 - 142.8;
        } else if (baseIrrf <= 3751.05) {
          irrf = baseIrrf * 0.15 - 354.8;
        } else if (baseIrrf <= 4664.68) {
          irrf = baseIrrf * 0.225 - 636.13;
        } else {
          irrf = baseIrrf * 0.275 - 869.36;
        }
      }

      const descontosAdicionais = 
        (parseFloat(valeTransporte) || 0) +
        (parseFloat(planoSaude) || 0) +
        (parseFloat(outrosDescontos) || 0);

      const totalDescontos = inss + irrf + descontosAdicionais;
      liquido = bruto + (parseFloat(beneficios) || 0) + (parseFloat(valeRefeicao) || 0) - totalDescontos;

      setResultadoSalario({ liquido, inss, irrf, totalDescontos });

    } else if (calculadora === 'ferias') {
      const salario = parseFloat(salarioFerias);
      const dias = parseInt(diasFerias);
      if (!salario || !dias) return;

      const valorFerias = (salario / 30) * dias;
      const tercoConstitucional = valorFerias / 3;
      const total = valorFerias + tercoConstitucional;

      setResultadoFerias({ valorFerias, tercoConstitucional, total });

    } else if (calculadora === 'decimo') {
      const salario = parseFloat(salarioDecimo);
      const meses = parseInt(mesesTrabalhados);
      if (!salario || !meses) return;

      const valor = (salario / 12) * meses;
      setResultadoDecimo(valor);

    } else if (calculadora === 'rescisao') {
      const salario = parseFloat(salarioRescisao);
      const meses = parseInt(mesesRescisao);
      const aviso = parseInt(diasAviso);
      const fgts = parseFloat(saldoFgts) || 0;

      if (!salario || !meses) return;

      const saldoSalario = salario;
      const feriasProporcionais = (salario / 12) * meses + ((salario / 12) * meses) / 3;
      const decimoTerceiro = (salario / 12) * meses;
      const avisoPrevi = (salario / 30) * aviso;
      const multaFgts = fgts * 0.4;

      const total = saldoSalario + feriasProporcionais + decimoTerceiro + avisoPrevi + multaFgts;

      setResultadoRescisao({
        saldoSalario,
        feriasProporcionais,
        decimoTerceiro,
        avisoPrevi,
        multaFgts,
        total
      });

    } else if (calculadora === 'emprestimo') {
      const valor = parseFloat(valorEmprestimo);
      const taxa = parseFloat(taxaJuros) / 100;
      const parcelas = parseInt(numeroParcelas);

      if (!valor || !taxa || !parcelas) return;

      const parcela = valor * (taxa * Math.pow(1 + taxa, parcelas)) / (Math.pow(1 + taxa, parcelas) - 1);
      const total = parcela * parcelas;
      const juros = total - valor;

      setResultadoEmprestimo({ parcela, total, juros });

    } else if (calculadora === 'financiamento') {
      const valor = parseFloat(valorImovel);
      const entradaVal = parseFloat(entrada);
      const taxa = parseFloat(taxaFinanciamento) / 100;
      const prazo = parseInt(prazoFinanciamento);

      if (!valor || !taxa || !prazo) return;

      const valorFinanciado = valor - (entradaVal || 0);
      const parcela = valorFinanciado * (taxa * Math.pow(1 + taxa, prazo)) / (Math.pow(1 + taxa, prazo) - 1);
      const total = parcela * prazo;
      const juros = total - valorFinanciado;

      setResultadoFinanciamento({ parcela, total, juros, valorFinanciado });

    } else if (calculadora === 'aposentadoria') {
      const atual = parseInt(idadeAtual);
      const aposentadoria = parseInt(idadeAposentadoria);
      const inicial = parseFloat(aporteInicial) || 0;
      const mensal = parseFloat(aporteMensal);
      const taxa = parseFloat(rentabilidade) / 100 / 12;

      if (!atual || !aposentadoria || !mensal || !taxa) return;

      const meses = (aposentadoria - atual) * 12;
      
      let totalAcumulado = inicial;
      for (let i = 0; i < meses; i++) {
        totalAcumulado = (totalAcumulado + mensal) * (1 + taxa);
      }

      const totalAportado = inicial + (mensal * meses);
      const rendimento = totalAcumulado - totalAportado;

      setResultadoAposentadoria({
        totalAcumulado,
        totalAportado,
        rendimento,
        mesesContribuicao: meses
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const limparFormulario = () => {
    setCalculadora(null);
    setResultadoSalario(null);
    setResultadoFerias(null);
    setResultadoDecimo(null);
    setResultadoRescisao(null);
    setSalarioBruto('');
    setBeneficios('');
    setValeTransporte('');
    setValeRefeicao('');
    setPlanoSaude('');
    setOutrosDescontos('');
    setDependentes('');
    setResultadoEmprestimo(null);
    setResultadoFinanciamento(null);
    setResultadoAposentadoria(null);
  };

  if (!calculadora) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <button
          onClick={() => setCalculadora('salario')}
          className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 hover:border-[#7C3AED]/50 transition-all duration-300 text-left group"
        >
          <div className="w-12 h-12 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <i className="ri-money-dollar-circle-line text-[#7C3AED] text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Salário Líquido</h3>
          <p className="text-sm text-[#9CA3AF]">Calcule seu salário após descontos</p>
        </button>

        <button
          onClick={() => setCalculadora('ferias')}
          className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 hover:border-[#EC4899]/50 transition-all duration-300 text-left group"
        >
          <div className="w-12 h-12 rounded-lg bg-[#EC4899]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <i className="ri-plane-line text-[#EC4899] text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Férias</h3>
          <p className="text-sm text-[#9CA3AF]">Calcule o valor das suas férias</p>
        </button>

        <button
          onClick={() => setCalculadora('decimo')}
          className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 hover:border-[#10B981]/50 transition-all duration-300 text-left group"
        >
          <div className="w-12 h-12 rounded-lg bg-[#10B981]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <i className="ri-gift-line text-[#10B981] text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">13º Salário</h3>
          <p className="text-sm text-[#9CA3AF]">Calcule seu décimo terceiro</p>
        </button>

        <button
          onClick={() => setCalculadora('rescisao')}
          className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 hover:border-[#F59E0B]/50 transition-all duration-300 text-left group"
        >
          <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <i className="ri-file-list-3-line text-[#F59E0B] text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Rescisão</h3>
          <p className="text-sm text-[#9CA3AF]">Calcule sua rescisão trabalhista</p>
        </button>

        <button
          onClick={() => setCalculadora('emprestimo')}
          className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 hover:border-[#3B82F6]/50 transition-all duration-300 text-left group"
        >
          <div className="w-12 h-12 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <i className="ri-hand-coin-line text-[#3B82F6] text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Empréstimo</h3>
          <p className="text-sm text-[#9CA3AF]">Calcule parcelas e juros</p>
        </button>

        <button
          onClick={() => setCalculadora('financiamento')}
          className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 hover:border-[#8B5CF6]/50 transition-all duration-300 text-left group"
        >
          <div className="w-12 h-12 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <i className="ri-home-heart-line text-[#8B5CF6] text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Financiamento</h3>
          <p className="text-sm text-[#9CA3AF]">Simule financiamento imobiliário</p>
        </button>

        <button
          onClick={() => setCalculadora('aposentadoria')}
          className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 hover:border-[#14B8A6]/50 transition-all duration-300 text-left group"
        >
          <div className="w-12 h-12 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <i className="ri-time-line text-[#14B8A6] text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-[#F9FAFB] mb-2">Aposentadoria</h3>
          <p className="text-sm text-[#9CA3AF]">Planeje sua aposentadoria</p>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6">
      <button
        onClick={limparFormulario}
        className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F9FAFB] mb-6 transition-colors duration-300"
      >
        <i className="ri-arrow-left-line"></i>
        Voltar
      </button>

      <h2 className="text-2xl font-bold text-[#F9FAFB] mb-6">
        {calculadora === 'salario' && 'Cálculo de Salário Líquido'}
        {calculadora === 'ferias' && 'Cálculo de Férias'}
        {calculadora === 'decimo' && 'Cálculo de 13º Salário'}
        {calculadora === 'rescisao' && 'Cálculo de Rescisão'}
        {calculadora === 'emprestimo' && 'Simulação de Empréstimo'}
        {calculadora === 'financiamento' && 'Simulação de Financiamento'}
        {calculadora === 'aposentadoria' && 'Planejamento de Aposentadoria'}
      </h2>

      {calculadora === 'salario' && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Salário Bruto *</label>
              <input
                type="number"
                step="0.01"
                value={salarioBruto}
                onChange={(e) => setSalarioBruto(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                placeholder="0,00"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Benefícios</label>
                <input
                  type="number"
                  step="0.01"
                  value={beneficios}
                  onChange={(e) => setBeneficios(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Vale Refeição</label>
                <input
                  type="number"
                  step="0.01"
                  value={valeRefeicao}
                  onChange={(e) => setValeRefeicao(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Desconto Vale Transporte</label>
                <input
                  type="number"
                  step="0.01"
                  value={valeTransporte}
                  onChange={(e) => setValeTransporte(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Plano de Saúde</label>
                <input
                  type="number"
                  step="0.01"
                  value={planoSaude}
                  onChange={(e) => setPlanoSaude(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Outros Descontos</label>
                <input
                  type="number"
                  step="0.01"
                  value={outrosDescontos}
                  onChange={(e) => setOutrosDescontos(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Número de Dependentes</label>
                <input
                  type="number"
                  value={dependentes}
                  onChange={(e) => setDependentes(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#7C3AED] transition-all duration-300"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              onClick={calcular}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#7C3AED]/30 transition-all duration-300 whitespace-nowrap"
            >
              Calcular
            </button>
          </div>

          {resultadoSalario !== null && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#10B981]/10 to-[#059669]/5 border border-[#10B981]/20 rounded-xl p-6">
                <h3 className="text-sm text-[#9CA3AF] mb-2">Salário Líquido</h3>
                <p className="text-4xl font-bold text-[#10B981]">{formatCurrency(resultadoSalario.liquido)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">INSS</p>
                  <p className="text-xl font-bold text-[#EF4444]">{formatCurrency(resultadoSalario.inss)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">IRRF</p>
                  <p className="text-xl font-bold text-[#EF4444]">{formatCurrency(resultadoSalario.irrf)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Total Descontos</p>
                  <p className="text-xl font-bold text-[#F59E0B]">{formatCurrency(resultadoSalario.totalDescontos)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {calculadora === 'ferias' && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Salário Mensal *</label>
              <input
                type="number"
                step="0.01"
                value={salarioFerias}
                onChange={(e) => setSalarioFerias(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#EC4899] transition-all duration-300"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Dias de Férias *</label>
              <select
                value={diasFerias}
                onChange={(e) => setDiasFerias(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#EC4899] transition-all duration-300"
              >
                <option value="30">30 dias</option>
                <option value="20">20 dias</option>
                <option value="15">15 dias</option>
                <option value="10">10 dias</option>
              </select>
            </div>

            <button
              onClick={calcular}
              className="w-full bg-gradient-to-r from-[#EC4899] to-[#F472B6] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#EC4899]/30 transition-all duration-300 whitespace-nowrap"
            >
              Calcular Férias
            </button>
          </div>

          {resultadoFerias !== null && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#EC4899]/10 to-[#F472B6]/5 border border-[#EC4899]/20 rounded-xl p-6">
                <h3 className="text-sm text-[#9CA3AF] mb-2">Total a Receber</h3>
                <p className="text-4xl font-bold text-[#EC4899]">{formatCurrency(resultadoFerias.total)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Valor das Férias</p>
                  <p className="text-xl font-bold text-[#F9FAFB]">{formatCurrency(resultadoFerias.valorFerias)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">1/3 Constitucional</p>
                  <p className="text-xl font-bold text-[#10B981]">{formatCurrency(resultadoFerias.tercoConstitucional)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {calculadora === 'decimo' && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Salário Mensal *</label>
              <input
                type="number"
                step="0.01"
                value={salarioDecimo}
                onChange={(e) => setSalarioDecimo(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#10B981] transition-all duration-300"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Meses Trabalhados *</label>
              <select
                value={mesesTrabalhados}
                onChange={(e) => setMesesTrabalhados(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#10B981] transition-all duration-300"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'mês' : 'meses'}</option>
                ))}
              </select>
            </div>

            <button
              onClick={calcular}
              className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#10B981]/30 transition-all duration-300 whitespace-nowrap"
            >
              Calcular 13º Salário
            </button>
          </div>

          {resultadoDecimo !== null && (
            <div className="bg-gradient-to-br from-[#10B981]/10 to-[#059669]/5 border border-[#10B981]/20 rounded-xl p-6">
              <h3 className="text-sm text-[#9CA3AF] mb-2">Valor do 13º Salário</h3>
              <p className="text-4xl font-bold text-[#10B981]">{formatCurrency(resultadoDecimo)}</p>
            </div>
          )}
        </>
      )}

      {calculadora === 'rescisao' && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Salário Mensal *</label>
              <input
                type="number"
                step="0.01"
                value={salarioRescisao}
                onChange={(e) => setSalarioRescisao(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#F59E0B] transition-all duration-300"
                placeholder="0,00"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Meses Trabalhados no Ano *</label>
                <input
                  type="number"
                  value={mesesRescisao}
                  onChange={(e) => setMesesRescisao(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#F59E0B] transition-all duration-300"
                  placeholder="0"
                  min="1"
                  max="12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Dias de Aviso Prévio</label>
                <input
                  type="number"
                  value={diasAviso}
                  onChange={(e) => setDiasAviso(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#F59E0B] transition-all duration-300"
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Saldo FGTS</label>
              <input
                type="number"
                step="0.01"
                value={saldoFgts}
                onChange={(e) => setSaldoFgts(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#F59E0B] transition-all duration-300"
                placeholder="0,00"
              />
            </div>

            <button
              onClick={calcular}
              className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#F59E0B]/30 transition-all duration-300 whitespace-nowrap"
            >
              Calcular Rescisão
            </button>
          </div>

          {resultadoRescisao !== null && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#F59E0B]/10 to-[#D97706]/5 border border-[#F59E0B]/20 rounded-xl p-6">
                <h3 className="text-sm text-[#9CA3AF] mb-2">Total da Rescisão</h3>
                <p className="text-4xl font-bold text-[#F59E0B]">{formatCurrency(resultadoRescisao.total)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Saldo de Salário</p>
                  <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(resultadoRescisao.saldoSalario)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Férias Proporcionais</p>
                  <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(resultadoRescisao.feriasProporcionais)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">13º Proporcional</p>
                  <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(resultadoRescisao.decimoTerceiro)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Aviso Prévio</p>
                  <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(resultadoRescisao.avisoPrevi)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Multa FGTS (40%)</p>
                  <p className="text-lg font-bold text-[#10B981]">{formatCurrency(resultadoRescisao.multaFgts)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {calculadora === 'emprestimo' && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor do Empréstimo *</label>
              <input
                type="number"
                step="0.01"
                value={valorEmprestimo}
                onChange={(e) => setValorEmprestimo(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#3B82F6] transition-all duration-300"
                placeholder="0,00"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Taxa de Juros (% ao mês) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxaJuros}
                  onChange={(e) => setTaxaJuros(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#3B82F6] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Número de Parcelas *</label>
                <input
                  type="number"
                  value={numeroParcelas}
                  onChange={(e) => setNumeroParcelas(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#3B82F6] transition-all duration-300"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              onClick={calcular}
              className="w-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all duration-300 whitespace-nowrap"
            >
              Simular Empréstimo
            </button>
          </div>

          {resultadoEmprestimo !== null && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#3B82F6]/10 to-[#2563EB]/5 border border-[#3B82F6]/20 rounded-xl p-6">
                <h3 className="text-sm text-[#9CA3AF] mb-2">Valor da Parcela</h3>
                <p className="text-4xl font-bold text-[#3B82F6]">{formatCurrency(resultadoEmprestimo.parcela)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Total a Pagar</p>
                  <p className="text-xl font-bold text-[#F9FAFB]">{formatCurrency(resultadoEmprestimo.total)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Total de Juros</p>
                  <p className="text-xl font-bold text-[#EF4444]">{formatCurrency(resultadoEmprestimo.juros)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {calculadora === 'financiamento' && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor do Imóvel *</label>
              <input
                type="number"
                step="0.01"
                value={valorImovel}
                onChange={(e) => setValorImovel(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#8B5CF6] transition-all duration-300"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor da Entrada</label>
              <input
                type="number"
                step="0.01"
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#8B5CF6] transition-all duration-300"
                placeholder="0,00"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Taxa de Juros (% ao mês) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxaFinanciamento}
                  onChange={(e) => setTaxaFinanciamento(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#8B5CF6] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Prazo (meses) *</label>
                <input
                  type="number"
                  value={prazoFinanciamento}
                  onChange={(e) => setPrazoFinanciamento(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#8B5CF6] transition-all duration-300"
                  placeholder="0"
                />
              </div>
            </div>

            <button
              onClick={calcular}
              className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#8B5CF6]/30 transition-all duration-300 whitespace-nowrap"
            >
              Simular Financiamento
            </button>
          </div>

          {resultadoFinanciamento !== null && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#7C3AED]/5 border border-[#8B5CF6]/20 rounded-xl p-6">
                <h3 className="text-sm text-[#9CA3AF] mb-2">Valor da Parcela</h3>
                <p className="text-4xl font-bold text-[#8B5CF6]">{formatCurrency(resultadoFinanciamento.parcela)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Valor Financiado</p>
                  <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(resultadoFinanciamento.valorFinanciado)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Total a Pagar</p>
                  <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(resultadoFinanciamento.total)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Total de Juros</p>
                  <p className="text-lg font-bold text-[#EF4444]">{formatCurrency(resultadoFinanciamento.juros)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {calculadora === 'aposentadoria' && (
        <>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Idade Atual *</label>
                <input
                  type="number"
                  value={idadeAtual}
                  onChange={(e) => setIdadeAtual(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#14B8A6] transition-all duration-300"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Idade de Aposentadoria *</label>
                <input
                  type="number"
                  value={idadeAposentadoria}
                  onChange={(e) => setIdadeAposentadoria(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#14B8A6] transition-all duration-300"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Aporte Inicial</label>
              <input
                type="number"
                step="0.01"
                value={aporteInicial}
                onChange={(e) => setAporteInicial(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#14B8A6] transition-all duration-300"
                placeholder="0,00"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Aporte Mensal *</label>
                <input
                  type="number"
                  step="0.01"
                  value={aporteMensal}
                  onChange={(e) => setAporteMensal(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#14B8A6] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Rentabilidade (% ao ano) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={rentabilidade}
                  onChange={(e) => setRentabilidade(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#14B8A6] transition-all duration-300"
                  placeholder="0,00"
                />
              </div>
            </div>

            <button
              onClick={calcular}
              className="w-full bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-[#14B8A6]/30 transition-all duration-300 whitespace-nowrap"
            >
              Calcular Aposentadoria
            </button>
          </div>

          {resultadoAposentadoria !== null && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#14B8A6]/10 to-[#0D9488]/5 border border-[#14B8A6]/20 rounded-xl p-6">
                <h3 className="text-sm text-[#9CA3AF] mb-2">Total Acumulado</h3>
                <p className="text-4xl font-bold text-[#14B8A6]">{formatCurrency(resultadoAposentadoria.totalAcumulado)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Total Aportado</p>
                  <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(resultadoAposentadoria.totalAportado)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Rendimento</p>
                  <p className="text-lg font-bold text-[#10B981]">{formatCurrency(resultadoAposentadoria.rendimento)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Meses de Contribuição</p>
                  <p className="text-lg font-bold text-[#F9FAFB]">{resultadoAposentadoria.mesesContribuicao}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
