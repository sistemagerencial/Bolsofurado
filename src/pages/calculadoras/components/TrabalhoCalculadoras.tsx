import { useState, useMemo } from 'react';

type Calculadora = 'salario' | 'ferias' | 'decimo' | 'rescisao' | 'horaExtra' | 'emprestimo' | 'financiamento' | 'jurosCompostos' | null;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + '%';

// ─── INSS progressivo 2024 ───────────────────────────────────────────────────
function calcularINSS(bruto: number): number {
  const faixas = [
    { ate: 1412.00, aliq: 0.075 },
    { ate: 2666.68, aliq: 0.09 },
    { ate: 4000.03, aliq: 0.12 },
    { ate: 7786.02, aliq: 0.14 },
  ];
  let inss = 0;
  let base = bruto;
  let anterior = 0;
  for (const f of faixas) {
    if (base <= 0) break;
    const faixa = Math.min(bruto, f.ate) - anterior;
    if (faixa > 0) inss += faixa * f.aliq;
    anterior = f.ate;
    base = bruto - f.ate;
  }
  return Math.min(inss, 908.86);
}

// ─── IRRF progressivo 2024 ───────────────────────────────────────────────────
function calcularIRRF(baseCalculo: number): number {
  if (baseCalculo <= 2259.20) return 0;
  if (baseCalculo <= 2826.65) return baseCalculo * 0.075 - 169.44;
  if (baseCalculo <= 3751.05) return baseCalculo * 0.15 - 381.44;
  if (baseCalculo <= 4664.68) return baseCalculo * 0.225 - 662.77;
  return baseCalculo * 0.275 - 896.00;
}

// ─── FÉRIAS ──────────────────────────────────────────────────────────────────
interface ResultadoFerias {
  salarioBase: number;
  mediaHorasExtras: number;
  mediaAdicionalNoturno: number;
  mediaComissoes: number;
  mediaOutros: number;
  mediaTotal: number;
  valorFerias: number;
  tercoConstitucional: number;
  subtotalBruto: number;
  inss: number;
  irrf: number;
  totalLiquido: number;
  diasVendidos: number;
  valorDiasVendidos: number;
  abono: number;
}

function calcularFerias(
  salario: number,
  dias: number,
  diasVendidos: number,
  mediaHE: number,
  mediaAN: number,
  mediaComissoes: number,
  mediaOutros: number
): ResultadoFerias {
  const mediaTotal = mediaHE + mediaAN + mediaComissoes + mediaOutros;
  const baseCalculo = salario + mediaTotal;

  const valorFerias = (baseCalculo / 30) * dias;
  const tercoConstitucional = valorFerias / 3;
  const abono = diasVendidos > 0 ? (baseCalculo / 30) * diasVendidos : 0;
  const subtotalBruto = valorFerias + tercoConstitucional + abono;

  const inss = calcularINSS(subtotalBruto);
  const baseIRRF = subtotalBruto - inss;
  const irrf = calcularIRRF(baseIRRF);
  const totalLiquido = subtotalBruto - inss - irrf;

  return {
    salarioBase: salario,
    mediaHorasExtras: mediaHE,
    mediaAdicionalNoturno: mediaAN,
    mediaComissoes,
    mediaOutros,
    mediaTotal,
    valorFerias,
    tercoConstitucional,
    subtotalBruto,
    inss,
    irrf,
    totalLiquido,
    diasVendidos,
    valorDiasVendidos: abono,
    abono,
  };
}

// ─── 13º SALÁRIO ─────────────────────────────────────────────────────────────
interface ResultadoDecimo {
  salarioBase: number;
  mediaHE: number;
  mediaAN: number;
  mediaComissoes: number;
  mediaOutros: number;
  baseCalculo: number;
  primeiraParcela: number;
  segundaParcela: number;
  inss: number;
  irrf: number;
  totalBruto: number;
  totalLiquido: number;
  meses: number;
}

function calcularDecimo(
  salario: number,
  meses: number,
  mediaHE: number,
  mediaAN: number,
  mediaComissoes: number,
  mediaOutros: number
): ResultadoDecimo {
  const mediaTotal = mediaHE + mediaAN + mediaComissoes + mediaOutros;
  const baseCalculo = salario + mediaTotal;
  const totalBruto = (baseCalculo / 12) * meses;
  const primeiraParcela = totalBruto / 2;

  const inss = calcularINSS(totalBruto);
  const baseIRRF = totalBruto - inss;
  const irrf = calcularIRRF(baseIRRF);
  const totalLiquido = totalBruto - inss - irrf;
  const segundaParcela = totalLiquido - primeiraParcela;

  return {
    salarioBase: salario,
    mediaHE,
    mediaAN,
    mediaComissoes,
    mediaOutros,
    baseCalculo,
    primeiraParcela,
    segundaParcela: Math.max(segundaParcela, 0),
    inss,
    irrf,
    totalBruto,
    totalLiquido,
    meses,
  };
}

// ─── RESCISÃO ────────────────────────────────────────────────────────────────
type TipoDemissao = 'semJustaCausa' | 'comJustaCausa' | 'pedidoDemissao' | 'acordoMutuo' | 'rescisaoIndireta';

interface ResultadoRescisao {
  saldoSalario: number;
  feriasVencidas: number;
  feriasProporcionais: number;
  tercoFerias: number;
  decimoTerceiro: number;
  avisoPrevio: number;
  multaFgts: number;
  multaFgtsGoverno: number;
  seguroDesemprego: boolean;
  saqueFgts: boolean;
  totalBruto: number;
  inss: number;
  irrf: number;
  totalLiquido: number;
  diasTrabalhados: number;
  mesesProporcional: number;
  feriasVencidasPendentes: boolean;
}

function calcularRescisao(
  salario: number,
  diasTrabalhados: number,
  mesesProporcional: number,
  diasAviso: number,
  saldoFgts: number,
  feriasVencidasPendentes: boolean,
  tipoDemissao: TipoDemissao,
  mediaHE: number,
  mediaAN: number
): ResultadoRescisao {
  const mediaTotal = mediaHE + mediaAN;
  const baseCalculo = salario + mediaTotal;

  const saldoSalario = (baseCalculo / 30) * diasTrabalhados;
  const feriasVencidas = feriasVencidasPendentes ? baseCalculo + baseCalculo / 3 : 0;
  const feriasProporcionais = (baseCalculo / 12) * mesesProporcional;
  const tercoFerias = feriasProporcionais / 3;
  const decimoTerceiro = (baseCalculo / 12) * mesesProporcional;

  let avisoPrevio = 0;
  let multaFgts = 0;
  let multaFgtsGoverno = 0;
  let seguroDesemprego = false;
  let saqueFgts = false;

  if (tipoDemissao === 'semJustaCausa') {
    avisoPrevio = (baseCalculo / 30) * diasAviso;
    multaFgts = saldoFgts * 0.4;
    multaFgtsGoverno = saldoFgts * 0.08;
    seguroDesemprego = true;
    saqueFgts = true;
  } else if (tipoDemissao === 'rescisaoIndireta') {
    avisoPrevio = (baseCalculo / 30) * diasAviso;
    multaFgts = saldoFgts * 0.4;
    multaFgtsGoverno = saldoFgts * 0.08;
    seguroDesemprego = true;
    saqueFgts = true;
  } else if (tipoDemissao === 'acordoMutuo') {
    multaFgts = saldoFgts * 0.2;
    saqueFgts = true;
  } else if (tipoDemissao === 'pedidoDemissao') {
    // sem multa, sem seguro
  } else if (tipoDemissao === 'comJustaCausa') {
    // sem multa, sem seguro, sem férias proporcionais
  }

  const totalBruto = saldoSalario + feriasVencidas + feriasProporcionais + tercoFerias + decimoTerceiro + avisoPrevio + multaFgts;

  const baseINSS = saldoSalario + feriasProporcionais + tercoFerias + decimoTerceiro + avisoPrevio;
  const inss = calcularINSS(baseINSS);
  const baseIRRF = baseINSS - inss;
  const irrf = calcularIRRF(baseIRRF);
  const totalLiquido = totalBruto - inss - irrf;

  return {
    saldoSalario,
    feriasVencidas,
    feriasProporcionais,
    tercoFerias,
    decimoTerceiro,
    avisoPrevio,
    multaFgts,
    multaFgtsGoverno,
    seguroDesemprego,
    saqueFgts,
    totalBruto,
    inss,
    irrf,
    totalLiquido,
    diasTrabalhados,
    mesesProporcional,
    feriasVencidasPendentes,
  };
}

// ─── JUROS COMPOSTOS ─────────────────────────────────────────────────────────
interface PontoSimulacao {
  ano: number;
  totalAcumulado: number;
  totalAportado: number;
  rendimento: number;
}

interface ResultadoJuros {
  totalAcumulado: number;
  totalAportado: number;
  rendimento: number;
  meses: number;
  pontos: PontoSimulacao[];
  rendimentoPercent: number;
}

function calcularJurosCompostos(
  aporteInicial: number,
  aporteMensal: number,
  aporteAnual: number,
  taxaAnual: number,
  anos: number
): ResultadoJuros {
  const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
  const meses = anos * 12;
  const pontos: PontoSimulacao[] = [];

  let acumulado = aporteInicial;
  let totalAportadoAcumulado = aporteInicial;

  for (let i = 1; i <= meses; i++) {
    // A cada 12 meses, adiciona o aporte anual antes de aplicar os juros
    if (i % 12 === 0 && aporteAnual > 0) {
      acumulado += aporteAnual;
      totalAportadoAcumulado += aporteAnual;
    }
    
    // Adiciona aporte mensal e aplica juros
    acumulado = (acumulado + aporteMensal) * (1 + taxaMensal);
    totalAportadoAcumulado += aporteMensal;

    if (i % 12 === 0) {
      const ano = i / 12;
      pontos.push({
        ano,
        totalAcumulado: acumulado,
        totalAportado: totalAportadoAcumulado,
        rendimento: acumulado - totalAportadoAcumulado,
      });
    }
  }

  const totalAportado = aporteInicial + (aporteMensal * meses) + (aporteAnual * anos);
  const rendimento = acumulado - totalAportado;
  const rendimentoPercent = totalAportado > 0 ? (rendimento / totalAportado) * 100 : 0;

  return { totalAcumulado: acumulado, totalAportado, rendimento, meses, pontos, rendimentoPercent };
}

// ─── HORA EXTRA ──────────────────────────────────────────────────────────────
interface ResultadoHoraExtra {
  salarioBase: number;
  cargaHoraria: number;
  valorHoraNormal: number;
  horasExtra50: number;
  valorHoraExtra50: number;
  totalExtra50: number;
  horasExtra100: number;
  valorHoraExtra100: number;
  totalExtra100: number;
  horasNoturno: number;
  valorHoraNoturno: number;
  totalNoturno: number;
  totalBrutoHorasExtras: number;
  inss: number;
  irrf: number;
  totalLiquido: number;
}

function calcularHoraExtra(
  salario: number,
  cargaHoraria: number,
  horasExtra50: number,
  horasExtra100: number,
  horasNoturno: number
): ResultadoHoraExtra {
  const valorHoraNormal = salario / cargaHoraria;
  
  const valorHoraExtra50 = valorHoraNormal * 1.5;
  const totalExtra50 = valorHoraExtra50 * horasExtra50;
  
  const valorHoraExtra100 = valorHoraNormal * 2;
  const totalExtra100 = valorHoraExtra100 * horasExtra100;
  
  const valorHoraNoturno = valorHoraNormal * 1.2;
  const totalNoturno = valorHoraNoturno * horasNoturno;
  
  const totalBrutoHorasExtras = totalExtra50 + totalExtra100 + totalNoturno;
  
  const baseINSS = salario + totalBrutoHorasExtras;
  const inss = calcularINSS(baseINSS);
  const baseIRRF = baseINSS - inss;
  const irrf = calcularIRRF(baseIRRF);
  const totalLiquido = totalBrutoHorasExtras - (calcularINSS(totalBrutoHorasExtras)) - (calcularIRRF(totalBrutoHorasExtras - calcularINSS(totalBrutoHorasExtras)));
  
  return {
    salarioBase: salario,
    cargaHoraria,
    valorHoraNormal,
    horasExtra50,
    valorHoraExtra50,
    totalExtra50,
    horasExtra100,
    valorHoraExtra100,
    totalExtra100,
    horasNoturno,
    valorHoraNoturno,
    totalNoturno,
    totalBrutoHorasExtras,
    inss: calcularINSS(totalBrutoHorasExtras),
    irrf: calcularIRRF(totalBrutoHorasExtras - calcularINSS(totalBrutoHorasExtras)),
    totalLiquido,
  };
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function TrabalhoCalculadoras() {
  const [calculadora, setCalculadora] = useState<Calculadora>(null);

  // ── Salário
  const [salarioBruto, setSalarioBruto] = useState('');
  const [beneficios, setBeneficios] = useState('');
  const [valeTransporte, setValeTransporte] = useState('');
  const [valeRefeicao, setValeRefeicao] = useState('');
  const [planoSaude, setPlanoSaude] = useState('');
  const [outrosDescontos, setOutrosDescontos] = useState('');
  const [dependentes, setDependentes] = useState('');
  const [resultadoSalario, setResultadoSalario] = useState<{ liquido: number; inss: number; irrf: number; totalDescontos: number } | null>(null);

  // ── Férias
  const [salarioFerias, setSalarioFerias] = useState('');
  const [diasFerias, setDiasFerias] = useState('30');
  const [diasVendidos, setDiasVendidos] = useState('0');
  const [feriasMediaHE, setFeriasMediaHE] = useState('');
  const [feriasMediaAN, setFeriasMediaAN] = useState('');
  const [feriasMediaComissoes, setFeriasMediaComissoes] = useState('');
  const [feriasMediaOutros, setFeriasMediaOutros] = useState('');
  const [resultadoFerias, setResultadoFerias] = useState<ResultadoFerias | null>(null);

  // ── 13º
  const [salarioDecimo, setSalarioDecimo] = useState('');
  const [mesesTrabalhados, setMesesTrabalhados] = useState('12');
  const [decimoMediaHE, setDecimoMediaHE] = useState('');
  const [decimoMediaAN, setDecimoMediaAN] = useState('');
  const [decimoMediaComissoes, setDecimoMediaComissoes] = useState('');
  const [decimoMediaOutros, setDecimoMediaOutros] = useState('');
  const [resultadoDecimo, setResultadoDecimo] = useState<ResultadoDecimo | null>(null);

  // ── Rescisão
  const [salarioRescisao, setSalarioRescisao] = useState('');
  const [diasTrabalhadosResc, setDiasTrabalhadosResc] = useState('30');
  const [mesesProporcional, setMesesProporcional] = useState('');
  const [diasAviso, setDiasAviso] = useState('30');
  const [saldoFgts, setSaldoFgts] = useState('');
  const [feriasVencidasPendentes, setFeriasVencidasPendentes] = useState(false);
  const [tipoDemissao, setTipoDemissao] = useState<TipoDemissao>('semJustaCausa');
  const [rescisaoMediaHE, setRescisaoMediaHE] = useState('');
  const [rescisaoMediaAN, setRescisaoMediaAN] = useState('');
  const [resultadoRescisao, setResultadoRescisao] = useState<ResultadoRescisao | null>(null);

  // ── Hora Extra
  const [salarioHoraExtra, setSalarioHoraExtra] = useState('');
  const [cargaHoraria, setCargaHoraria] = useState('220');
  const [horasExtra50, setHorasExtra50] = useState('');
  const [horasExtra100, setHorasExtra100] = useState('');
  const [horasNoturno, setHorasNoturno] = useState('');
  const [resultadoHoraExtra, setResultadoHoraExtra] = useState<ResultadoHoraExtra | null>(null);

  // ── Empréstimo
  const [valorEmprestimo, setValorEmprestimo] = useState('');
  const [taxaJuros, setTaxaJuros] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState('');
  const [resultadoEmprestimo, setResultadoEmprestimo] = useState<{ parcela: number; total: number; juros: number } | null>(null);

  // ── Financiamento
  const [valorImovel, setValorImovel] = useState('');
  const [entrada, setEntrada] = useState('');
  const [taxaFinanciamento, setTaxaFinanciamento] = useState('');
  const [prazoFinanciamento, setPrazoFinanciamento] = useState('');
  const [resultadoFinanciamento, setResultadoFinanciamento] = useState<{ parcela: number; total: number; juros: number; valorFinanciado: number } | null>(null);

  // ── Juros Compostos
  const [jcAporteInicial, setJcAporteInicial] = useState('');
  const [jcAporteMensal, setJcAporteMensal] = useState('');
  const [jcAporteAnual, setJcAporteAnual] = useState('');
  const [jcTaxaAnual, setJcTaxaAnual] = useState('');
  const [jcAnos, setJcAnos] = useState('');
  const [resultadoJuros, setResultadoJuros] = useState<ResultadoJuros | null>(null);

  const calcular = () => {
    if (calculadora === 'salario') {
      const bruto = parseFloat(salarioBruto);
      if (!bruto) return;
      const inss = calcularINSS(bruto);
      const baseIRRF = bruto - inss - (parseFloat(dependentes) || 0) * 189.59;
      const irrf = calcularIRRF(baseIRRF);
      const descontosAdicionais = (parseFloat(valeTransporte) || 0) + (parseFloat(planoSaude) || 0) + (parseFloat(outrosDescontos) || 0);
      const totalDescontos = inss + irrf + descontosAdicionais;
      const liquido = bruto + (parseFloat(beneficios) || 0) + (parseFloat(valeRefeicao) || 0) - totalDescontos;
      setResultadoSalario({ liquido, inss, irrf, totalDescontos });

    } else if (calculadora === 'ferias') {
      const salario = parseFloat(salarioFerias);
      if (!salario) return;
      const res = calcularFerias(
        salario,
        parseInt(diasFerias),
        parseInt(diasVendidos) || 0,
        parseFloat(feriasMediaHE) || 0,
        parseFloat(feriasMediaAN) || 0,
        parseFloat(feriasMediaComissoes) || 0,
        parseFloat(feriasMediaOutros) || 0
      );
      setResultadoFerias(res);

    } else if (calculadora === 'decimo') {
      const salario = parseFloat(salarioDecimo);
      if (!salario) return;
      const res = calcularDecimo(
        salario,
        parseInt(mesesTrabalhados),
        parseFloat(decimoMediaHE) || 0,
        parseFloat(decimoMediaAN) || 0,
        parseFloat(decimoMediaComissoes) || 0,
        parseFloat(decimoMediaOutros) || 0
      );
      setResultadoDecimo(res);

    } else if (calculadora === 'rescisao') {
      const salario = parseFloat(salarioRescisao);
      if (!salario) return;
      const res = calcularRescisao(
        salario,
        parseInt(diasTrabalhadosResc) || 30,
        parseInt(mesesProporcional) || 0,
        parseInt(diasAviso) || 30,
        parseFloat(saldoFgts) || 0,
        feriasVencidasPendentes,
        tipoDemissao,
        parseFloat(rescisaoMediaHE) || 0,
        parseFloat(rescisaoMediaAN) || 0
      );
      setResultadoRescisao(res);

    } else if (calculadora === 'horaExtra') {
      const salario = parseFloat(salarioHoraExtra);
      const carga = parseFloat(cargaHoraria);
      if (!salario || !carga) return;
      const res = calcularHoraExtra(
        salario,
        carga,
        parseFloat(horasExtra50) || 0,
        parseFloat(horasExtra100) || 0,
        parseFloat(horasNoturno) || 0
      );
      setResultadoHoraExtra(res);

    } else if (calculadora === 'emprestimo') {
      const valor = parseFloat(valorEmprestimo);
      const taxa = parseFloat(taxaJuros) / 100;
      const parcelas = parseInt(numeroParcelas);
      if (!valor || !taxa || !parcelas) return;
      const parcela = valor * (taxa * Math.pow(1 + taxa, parcelas)) / (Math.pow(1 + taxa, parcelas) - 1);
      const total = parcela * parcelas;
      setResultadoEmprestimo({ parcela, total, juros: total - valor });

    } else if (calculadora === 'financiamento') {
      const valor = parseFloat(valorImovel);
      const entradaVal = parseFloat(entrada) || 0;
      const taxa = parseFloat(taxaFinanciamento) / 100;
      const prazo = parseInt(prazoFinanciamento);
      if (!valor || !taxa || !prazo) return;
      const valorFinanciado = valor - entradaVal;
      const parcela = valorFinanciado * (taxa * Math.pow(1 + taxa, prazo)) / (Math.pow(1 + taxa, prazo) - 1);
      const total = parcela * prazo;
      setResultadoFinanciamento({ parcela, total, juros: total - valorFinanciado, valorFinanciado });

    } else if (calculadora === 'jurosCompostos') {
      const inicial = parseFloat(jcAporteInicial) || 0;
      const mensal = parseFloat(jcAporteMensal) || 0;
      const anual = parseFloat(jcAporteAnual) || 0;
      const taxa = parseFloat(jcTaxaAnual);
      const anos = parseInt(jcAnos);
      if (!taxa || !anos) return;
      const res = calcularJurosCompostos(inicial, mensal, anual, taxa, anos);
      setResultadoJuros(res);
    }
  };

  const limpar = () => {
    setCalculadora(null);
    setResultadoSalario(null);
    setResultadoFerias(null);
    setResultadoDecimo(null);
    setResultadoRescisao(null);
    setResultadoHoraExtra(null);
    setResultadoEmprestimo(null);
    setResultadoFinanciamento(null);
    setResultadoJuros(null);
  };

  const inputClass = (color: string) =>
    `w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[${color}] transition-all duration-300`;

  const labelClass = 'block text-sm font-medium text-[#D1D5DB] mb-1.5';

  const cards = [
    { id: 'salario', label: 'Salário Líquido', desc: 'Calcule seu salário após descontos', icon: 'ri-money-dollar-circle-line', color: '#7C3AED' },
    { id: 'ferias', label: 'Férias', desc: 'Cálculo completo com médias e descontos', icon: 'ri-plane-line', color: '#EC4899' },
    { id: 'decimo', label: '13º Salário', desc: 'Cálculo completo com INSS e IRRF', icon: 'ri-gift-line', color: '#10B981' },
    { id: 'rescisao', label: 'Rescisão', desc: 'Rescisão completa por tipo de demissão', icon: 'ri-file-list-3-line', color: '#F59E0B' },
    { id: 'horaExtra', label: 'Hora Extra', desc: 'Calcule horas extras 50%, 100% e noturnas', icon: 'ri-time-line', color: '#F97316' },
    { id: 'emprestimo', label: 'Empréstimo', desc: 'Calcule parcelas e juros', icon: 'ri-hand-coin-line', color: '#06B6D4' },
    { id: 'financiamento', label: 'Financiamento', desc: 'Simule financiamento imobiliário', icon: 'ri-home-heart-line', color: '#8B5CF6' },
    { id: 'jurosCompostos', label: 'Juros Compostos', desc: 'Simule crescimento com aportes e reinvestimento', icon: 'ri-line-chart-line', color: '#14B8A6' },
  ];

  if (!calculadora) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => setCalculadora(c.id as Calculadora)}
            className="bg-[#1F2937] border border-[#374151] rounded-xl p-6 hover:border-opacity-60 transition-all duration-300 text-left group cursor-pointer"
            style={{ '--hover-color': c.color } as React.CSSProperties}
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: `${c.color}22` }}>
              <i className={`${c.icon} text-2xl`} style={{ color: c.color }}></i>
            </div>
            <h3 className="text-base font-bold text-[#F9FAFB] mb-1">{c.label}</h3>
            <p className="text-xs text-[#9CA3AF]">{c.desc}</p>
          </button>
        ))}
      </div>
    );
  }

  const tituloMap: Record<string, string> = {
    salario: 'Cálculo de Salário Líquido',
    ferias: 'Cálculo de Férias',
    decimo: 'Cálculo de 13º Salário',
    rescisao: 'Cálculo de Rescisão Trabalhista',
    horaExtra: 'Cálculo de Hora Extra',
    emprestimo: 'Simulação de Empréstimo',
    financiamento: 'Simulação de Financiamento',
    jurosCompostos: 'Simulador de Juros Compostos',
  };

  const colorMap: Record<string, string> = {
    salario: '#7C3AED', ferias: '#EC4899', decimo: '#10B981',
    rescisao: '#F59E0B', horaExtra: '#F97316', emprestimo: '#06B6D4', financiamento: '#8B5CF6', jurosCompostos: '#14B8A6',
  };
  const cor = colorMap[calculadora] || '#7C3AED';

  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-xl p-6">
      <button onClick={limpar} className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F9FAFB] mb-5 transition-colors duration-300 cursor-pointer">
        <i className="ri-arrow-left-line"></i> Voltar
      </button>
      <h2 className="text-xl font-bold text-[#F9FAFB] mb-6">{tituloMap[calculadora]}</h2>

      {/* ── SALÁRIO ── */}
      {calculadora === 'salario' && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className={labelClass}>Salário Bruto *</label>
              <input type="number" step="0.01" value={salarioBruto} onChange={e => setSalarioBruto(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Benefícios</label><input type="number" step="0.01" value={beneficios} onChange={e => setBeneficios(e.target.value)} className={inputClass(cor)} placeholder="0,00" /></div>
              <div><label className={labelClass}>Vale Refeição</label><input type="number" step="0.01" value={valeRefeicao} onChange={e => setValeRefeicao(e.target.value)} className={inputClass(cor)} placeholder="0,00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Desconto VT</label><input type="number" step="0.01" value={valeTransporte} onChange={e => setValeTransporte(e.target.value)} className={inputClass(cor)} placeholder="0,00" /></div>
              <div><label className={labelClass}>Plano de Saúde</label><input type="number" step="0.01" value={planoSaude} onChange={e => setPlanoSaude(e.target.value)} className={inputClass(cor)} placeholder="0,00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Outros Descontos</label><input type="number" step="0.01" value={outrosDescontos} onChange={e => setOutrosDescontos(e.target.value)} className={inputClass(cor)} placeholder="0,00" /></div>
              <div><label className={labelClass}>Nº Dependentes</label><input type="number" value={dependentes} onChange={e => setDependentes(e.target.value)} className={inputClass(cor)} placeholder="0" /></div>
            </div>
            <button onClick={calcular} className="w-full text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap cursor-pointer" style={{ background: `linear-gradient(to right, ${cor}, #EC4899)` }}>Calcular</button>
          </div>
          {resultadoSalario && (
            <div className="space-y-4">
              <div className="rounded-xl p-6 border" style={{ background: `${cor}15`, borderColor: `${cor}40` }}>
                <p className="text-sm text-[#9CA3AF] mb-1">Salário Líquido</p>
                <p className="text-4xl font-bold" style={{ color: cor }}>{formatCurrency(resultadoSalario.liquido)}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['INSS', resultadoSalario.inss, '#EF4444'], ['IRRF', resultadoSalario.irrf, '#EF4444'], ['Total Descontos', resultadoSalario.totalDescontos, '#F59E0B']].map(([l, v, c]) => (
                  <div key={l as string} className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                    <p className="text-xs text-[#9CA3AF] mb-1">{l as string}</p>
                    <p className="text-lg font-bold" style={{ color: c as string }}>{formatCurrency(v as number)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── FÉRIAS ── */}
      {calculadora === 'ferias' && (
        <>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Salário Mensal *</label>
                <input type="number" step="0.01" value={salarioFerias} onChange={e => setSalarioFerias(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
              </div>
              <div>
                <label className={labelClass}>Dias de Férias *</label>
                <select value={diasFerias} onChange={e => setDiasFerias(e.target.value)} className={inputClass(cor)}>
                  <option value="30">30 dias</option>
                  <option value="24">24 dias (6 vendidos)</option>
                  <option value="20">20 dias (10 vendidos)</option>
                  <option value="15">15 dias</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Dias a Vender (abono pecuniário)</label>
              <select value={diasVendidos} onChange={e => setDiasVendidos(e.target.value)} className={inputClass(cor)}>
                <option value="0">Não vender dias</option>
                <option value="10">10 dias</option>
                <option value="6">6 dias</option>
              </select>
            </div>

            <div className="border border-[#374151] rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-[#D1D5DB] flex items-center gap-2">
                <i className="ri-time-line text-[#EC4899]"></i>
                Médias dos últimos 12 meses (opcional)
              </p>
              <p className="text-xs text-[#6B7280]">Informe a média mensal de cada verba variável para cálculo correto das férias</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Média Horas Extras</label>
                  <input type="number" step="0.01" value={feriasMediaHE} onChange={e => setFeriasMediaHE(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
                </div>
                <div>
                  <label className={labelClass}>Média Adicional Noturno</label>
                  <input type="number" step="0.01" value={feriasMediaAN} onChange={e => setFeriasMediaAN(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
                </div>
                <div>
                  <label className={labelClass}>Média Comissões</label>
                  <input type="number" step="0.01" value={feriasMediaComissoes} onChange={e => setFeriasMediaComissoes(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
                </div>
                <div>
                  <label className={labelClass}>Outros (gorjetas, DSR, etc.)</label>
                  <input type="number" step="0.01" value={feriasMediaOutros} onChange={e => setFeriasMediaOutros(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
                </div>
              </div>
            </div>

            <button onClick={calcular} className="w-full text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap cursor-pointer" style={{ background: `linear-gradient(to right, ${cor}, #F472B6)` }}>Calcular Férias</button>
          </div>

          {resultadoFerias && (
            <div className="space-y-4">
              <div className="rounded-xl p-6 border" style={{ background: `${cor}15`, borderColor: `${cor}40` }}>
                <p className="text-sm text-[#9CA3AF] mb-1">Total Líquido a Receber</p>
                <p className="text-4xl font-bold" style={{ color: cor }}>{formatCurrency(resultadoFerias.totalLiquido)}</p>
                <p className="text-sm text-[#9CA3AF] mt-2">Bruto: {formatCurrency(resultadoFerias.subtotalBruto)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Salário Base</p>
                  <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoFerias.salarioBase)}</p>
                </div>
                {resultadoFerias.mediaTotal > 0 && (
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                    <p className="text-xs text-[#9CA3AF] mb-1">Total Médias</p>
                    <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoFerias.mediaTotal)}</p>
                  </div>
                )}
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Valor das Férias</p>
                  <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoFerias.valorFerias)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">1/3 Constitucional</p>
                  <p className="text-base font-bold text-[#10B981]">{formatCurrency(resultadoFerias.tercoConstitucional)}</p>
                </div>
                {resultadoFerias.diasVendidos > 0 && (
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                    <p className="text-xs text-[#9CA3AF] mb-1">Abono Pecuniário ({resultadoFerias.diasVendidos}d)</p>
                    <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoFerias.abono)}</p>
                  </div>
                )}
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">INSS</p>
                  <p className="text-base font-bold text-[#EF4444]">{formatCurrency(resultadoFerias.inss)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">IRRF</p>
                  <p className="text-base font-bold text-[#EF4444]">{formatCurrency(resultadoFerias.irrf)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── 13º ── */}
      {calculadora === 'decimo' && (
        <>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Salário Mensal *</label>
                <input type="number" step="0.01" value={salarioDecimo} onChange={e => setSalarioDecimo(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
              </div>
              <div>
                <label className={labelClass}>Meses Trabalhados *</label>
                <select value={mesesTrabalhados} onChange={e => setMesesTrabalhados(e.target.value)} className={inputClass(cor)}>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'mês' : 'meses'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-[#374151] rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-[#D1D5DB] flex items-center gap-2">
                <i className="ri-time-line text-[#10B981]"></i>
                Médias dos últimos 12 meses (opcional)
              </p>
              <p className="text-xs text-[#6B7280]">Verbas variáveis integram a base de cálculo do 13º (Súmula 253 TST)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Média Horas Extras</label>
                  <input type="number" step="0.01" value={decimoMediaHE} onChange={e => setDecimoMediaHE(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
                </div>
                <div>
                  <label className={labelClass}>Média Adicional Noturno</label>
                  <input type="number" step="0.01" value={decimoMediaAN} onChange={e => setDecimoMediaAN(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
                </div>
                <div>
                  <label className={labelClass}>Média Comissões</label>
                  <input type="number" step="0.01" value={decimoMediaComissoes} onChange={e => setDecimoMediaComissoes(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
                </div>
                <div>
                  <label className={labelClass}>Outros (gorjetas, DSR, etc.)</label>
                  <input type="number" step="0.01" value={decimoMediaOutros} onChange={e => setDecimoMediaOutros(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
                </div>
              </div>
            </div>

            <button onClick={calcular} className="w-full text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap cursor-pointer" style={{ background: `linear-gradient(to right, ${cor}, #059669)` }}>Calcular 13º Salário</button>
          </div>

          {resultadoDecimo && (
            <div className="space-y-4">
              <div className="rounded-xl p-6 border" style={{ background: `${cor}15`, borderColor: `${cor}40` }}>
                <p className="text-sm text-[#9CA3AF] mb-1">Total Líquido do 13º</p>
                <p className="text-4xl font-bold" style={{ color: cor }}>{formatCurrency(resultadoDecimo.totalLiquido)}</p>
                <p className="text-sm text-[#9CA3AF] mt-2">Bruto: {formatCurrency(resultadoDecimo.totalBruto)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Base de Cálculo</p>
                  <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoDecimo.baseCalculo)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Meses Trabalhados</p>
                  <p className="text-base font-bold text-[#F9FAFB]">{resultadoDecimo.meses}/12</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">1ª Parcela (nov)</p>
                  <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoDecimo.primeiraParcela)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">2ª Parcela (dez)</p>
                  <p className="text-base font-bold text-[#10B981]">{formatCurrency(resultadoDecimo.segundaParcela)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">INSS</p>
                  <p className="text-base font-bold text-[#EF4444]">{formatCurrency(resultadoDecimo.inss)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">IRRF</p>
                  <p className="text-base font-bold text-[#EF4444]">{formatCurrency(resultadoDecimo.irrf)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── RESCISÃO ── */}
      {calculadora === 'rescisao' && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className={labelClass}>Tipo de Demissão *</label>
              <select value={tipoDemissao} onChange={e => setTipoDemissao(e.target.value as TipoDemissao)} className={inputClass(cor)}>
                <option value="semJustaCausa">Demissão Sem Justa Causa (empregador demite)</option>
                <option value="comJustaCausa">Demissão Com Justa Causa</option>
                <option value="pedidoDemissao">Pedido de Demissão (funcionário pede)</option>
                <option value="acordoMutuo">Acordo Mútuo (art. 484-A CLT)</option>
                <option value="rescisaoIndireta">Rescisão Indireta (falta grave do empregador)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Salário Mensal *</label>
                <input type="number" step="0.01" value={salarioRescisao} onChange={e => setSalarioRescisao(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
              </div>
              <div>
                <label className={labelClass}>Dias Trabalhados no Mês</label>
                <input type="number" value={diasTrabalhadosResc} onChange={e => setDiasTrabalhadosResc(e.target.value)} className={inputClass(cor)} placeholder="30" min="1" max="31" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Meses Trabalhados no Ano *</label>
                <select value={mesesProporcional} onChange={e => setMesesProporcional(e.target.value)} className={inputClass(cor)}>
                  <option value="">Selecione</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'mês' : 'meses'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Dias de Aviso Prévio</label>
                <input type="number" value={diasAviso} onChange={e => setDiasAviso(e.target.value)} className={inputClass(cor)} placeholder="30" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Saldo do FGTS acumulado</label>
              <input type="number" step="0.01" value={saldoFgts} onChange={e => setSaldoFgts(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
            </div>

            <div className="border border-[#374151] rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-[#D1D5DB] flex items-center gap-2">
                <i className="ri-time-line text-[#F59E0B]"></i>
                Médias de verbas variáveis (opcional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Média Horas Extras</label>
                  <input type="number" step="0.01" value={rescisaoMediaHE} onChange={e => setRescisaoMediaHE(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
                </div>
                <div>
                  <label className={labelClass}>Média Adicional Noturno</label>
                  <input type="number" step="0.01" value={rescisaoMediaAN} onChange={e => setRescisaoMediaAN(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#111827] border border-[#374151] rounded-lg px-4 py-3 cursor-pointer" onClick={() => setFeriasVencidasPendentes(!feriasVencidasPendentes)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${feriasVencidasPendentes ? 'bg-[#F59E0B] border-[#F59E0B]' : 'border-[#374151]'}`}>
                {feriasVencidasPendentes && <i className="ri-check-line text-white text-xs"></i>}
              </div>
              <span className="text-sm text-[#D1D5DB]">Possui férias vencidas não gozadas (período anterior)</span>
            </div>

            <button onClick={calcular} className="w-full text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap cursor-pointer" style={{ background: `linear-gradient(to right, ${cor}, #D97706)` }}>Calcular Rescisão</button>
          </div>

          {resultadoRescisao && (
            <div className="space-y-4">
              <div className="rounded-xl p-6 border" style={{ background: `${cor}15`, borderColor: `${cor}40` }}>
                <p className="text-sm text-[#9CA3AF] mb-1">Total Líquido da Rescisão</p>
                <p className="text-4xl font-bold" style={{ color: cor }}>{formatCurrency(resultadoRescisao.totalLiquido)}</p>
                <p className="text-sm text-[#9CA3AF] mt-2">Bruto: {formatCurrency(resultadoRescisao.totalBruto)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Saldo de Salário</p>
                  <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoRescisao.saldoSalario)}</p>
                </div>
                {resultadoRescisao.feriasVencidas > 0 && (
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                    <p className="text-xs text-[#9CA3AF] mb-1">Férias Vencidas + 1/3</p>
                    <p className="text-base font-bold text-[#10B981]">{formatCurrency(resultadoRescisao.feriasVencidas)}</p>
                  </div>
                )}
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Férias Proporcionais</p>
                  <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoRescisao.feriasProporcionais)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">1/3 s/ Férias Prop.</p>
                  <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoRescisao.tercoFerias)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">13º Proporcional</p>
                  <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoRescisao.decimoTerceiro)}</p>
                </div>
                {resultadoRescisao.avisoPrevio > 0 && (
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                    <p className="text-xs text-[#9CA3AF] mb-1">Aviso Prévio</p>
                    <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoRescisao.avisoPrevio)}</p>
                  </div>
                )}
                {resultadoRescisao.multaFgts > 0 && (
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                    <p className="text-xs text-[#9CA3AF] mb-1">Multa FGTS ({tipoDemissao === 'acordoMutuo' ? '20%' : '40%'})</p>
                    <p className="text-base font-bold text-[#10B981]">{formatCurrency(resultadoRescisao.multaFgts)}</p>
                  </div>
                )}
                {resultadoRescisao.multaFgtsGoverno > 0 && (
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                    <p className="text-xs text-[#9CA3AF] mb-1">Multa FGTS Governo (8%)</p>
                    <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoRescisao.multaFgtsGoverno)}</p>
                  </div>
                )}
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">INSS</p>
                  <p className="text-base font-bold text-[#EF4444]">{formatCurrency(resultadoRescisao.inss)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">IRRF</p>
                  <p className="text-base font-bold text-[#EF4444]">{formatCurrency(resultadoRescisao.irrf)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-3 border flex items-center gap-2 ${resultadoRescisao.seguroDesemprego ? 'border-[#10B981]/40 bg-[#10B981]/10' : 'border-[#374151] bg-[#111827]'}`}>
                  <i className={`ri-shield-check-line ${resultadoRescisao.seguroDesemprego ? 'text-[#10B981]' : 'text-[#6B7280]'}`}></i>
                  <div>
                    <p className="text-xs font-medium text-[#D1D5DB]">Seguro Desemprego</p>
                    <p className={`text-xs ${resultadoRescisao.seguroDesemprego ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>{resultadoRescisao.seguroDesemprego ? 'Tem direito' : 'Não tem direito'}</p>
                  </div>
                </div>
                <div className={`rounded-lg p-3 border flex items-center gap-2 ${resultadoRescisao.saqueFgts ? 'border-[#10B981]/40 bg-[#10B981]/10' : 'border-[#374151] bg-[#111827]'}`}>
                  <i className={`ri-bank-line ${resultadoRescisao.saqueFgts ? 'text-[#10B981]' : 'text-[#6B7280]'}`}></i>
                  <div>
                    <p className="text-xs font-medium text-[#D1D5DB]">Saque do FGTS</p>
                    <p className={`text-xs ${resultadoRescisao.saqueFgts ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>{resultadoRescisao.saqueFgts ? 'Pode sacar' : 'Não pode sacar'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── HORA EXTRA ── */}
      {calculadora === 'horaExtra' && (
        <>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Salário Mensal *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={salarioHoraExtra} 
                  onChange={e => setSalarioHoraExtra(e.target.value)} 
                  className={inputClass(cor)} 
                  placeholder="0,00" 
                />
              </div>
              <div>
                <label className={labelClass}>Carga Horária Mensal *</label>
                <input 
                  type="number" 
                  value={cargaHoraria} 
                  onChange={e => setCargaHoraria(e.target.value)} 
                  className={inputClass(cor)} 
                  placeholder="220" 
                />
                <p className="text-xs text-[#6B7280] mt-1">Padrão: 220 horas/mês (44h semanais)</p>
              </div>
            </div>

            <div className="border border-[#374151] rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-[#D1D5DB] flex items-center gap-2">
                <i className="ri-time-line text-[#F97316]"></i>
                Quantidade de Horas Trabalhadas
              </p>
              <p className="text-xs text-[#6B7280]">Informe a quantidade de horas extras e noturnas realizadas no mês</p>
              
              <div>
                <label className={labelClass}>Hora Extra 50% (dias úteis)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  value={horasExtra50} 
                  onChange={e => setHorasExtra50(e.target.value)} 
                  className={inputClass(cor)} 
                  placeholder="0" 
                />
                <p className="text-xs text-[#6B7280] mt-1">Adicional de 50% sobre a hora normal</p>
              </div>

              <div>
                <label className={labelClass}>Hora Extra 100% (domingos e feriados)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  value={horasExtra100} 
                  onChange={e => setHorasExtra100(e.target.value)} 
                  className={inputClass(cor)} 
                  placeholder="0" 
                />
                <p className="text-xs text-[#6B7280] mt-1">Adicional de 100% sobre a hora normal</p>
              </div>

              <div>
                <label className={labelClass}>Adicional Noturno (22h às 5h)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  value={horasNoturno} 
                  onChange={e => setHorasNoturno(e.target.value)} 
                  className={inputClass(cor)} 
                  placeholder="0" 
                />
                <p className="text-xs text-[#6B7280] mt-1">Adicional de 20% sobre a hora normal</p>
              </div>
            </div>

            <button 
              onClick={calcular} 
              className="w-full text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap cursor-pointer" 
              style={{ background: `linear-gradient(to right, ${cor}, #EA580C)` }}
            >
              Calcular Horas Extras
            </button>
          </div>

          {resultadoHoraExtra && (
            <div className="space-y-4">
              <div className="rounded-xl p-6 border" style={{ background: `${cor}15`, borderColor: `${cor}40` }}>
                <p className="text-sm text-[#9CA3AF] mb-1">Total Líquido de Horas Extras</p>
                <p className="text-4xl font-bold" style={{ color: cor }}>{formatCurrency(resultadoHoraExtra.totalLiquido)}</p>
                <p className="text-sm text-[#9CA3AF] mt-2">Bruto: {formatCurrency(resultadoHoraExtra.totalBrutoHorasExtras)}</p>
              </div>

              <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                <p className="text-xs text-[#9CA3AF] mb-1">Valor da Hora Normal</p>
                <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(resultadoHoraExtra.valorHoraNormal)}</p>
                <p className="text-xs text-[#6B7280] mt-1">Base: {formatCurrency(resultadoHoraExtra.salarioBase)} ÷ {resultadoHoraExtra.cargaHoraria}h</p>
              </div>

              {resultadoHoraExtra.horasExtra50 > 0 && (
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-[#9CA3AF]">Hora Extra 50%</p>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-[#F97316]/20 text-[#F97316]">
                      {resultadoHoraExtra.horasExtra50}h
                    </span>
                  </div>
                  <p className="text-sm text-[#9CA3AF] mb-1">
                    {formatCurrency(resultadoHoraExtra.valorHoraExtra50)} × {resultadoHoraExtra.horasExtra50}h
                  </p>
                  <p className="text-xl font-bold text-[#10B981]">{formatCurrency(resultadoHoraExtra.totalExtra50)}</p>
                </div>
              )}

              {resultadoHoraExtra.horasExtra100 > 0 && (
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-[#9CA3AF]">Hora Extra 100%</p>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-[#F97316]/20 text-[#F97316]">
                      {resultadoHoraExtra.horasExtra100}h
                    </span>
                  </div>
                  <p className="text-sm text-[#9CA3AF] mb-1">
                    {formatCurrency(resultadoHoraExtra.valorHoraExtra100)} × {resultadoHoraExtra.horasExtra100}h
                  </p>
                  <p className="text-xl font-bold text-[#10B981]">{formatCurrency(resultadoHoraExtra.totalExtra100)}</p>
                </div>
              )}

              {resultadoHoraExtra.horasNoturno > 0 && (
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-[#9CA3AF]">Adicional Noturno (20%)</p>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-[#F97316]/20 text-[#F97316]">
                      {resultadoHoraExtra.horasNoturno}h
                    </span>
                  </div>
                  <p className="text-sm text-[#9CA3AF] mb-1">
                    {formatCurrency(resultadoHoraExtra.valorHoraNoturno)} × {resultadoHoraExtra.horasNoturno}h
                  </p>
                  <p className="text-xl font-bold text-[#10B981]">{formatCurrency(resultadoHoraExtra.totalNoturno)}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">INSS Estimado</p>
                  <p className="text-base font-bold text-[#EF4444]">{formatCurrency(resultadoHoraExtra.inss)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">IRRF Estimado</p>
                  <p className="text-base font-bold text-[#EF4444]">{formatCurrency(resultadoHoraExtra.irrf)}</p>
                </div>
              </div>

              <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="ri-information-line text-[#7C3AED] text-xl mt-0.5"></i>
                  <div>
                    <p className="text-sm font-medium text-[#D1D5DB] mb-1">Informação Importante</p>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">
                      Os descontos de INSS e IRRF são estimados considerando apenas as horas extras. 
                      No contracheque real, os descontos incidem sobre o total (salário + horas extras).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── EMPRÉSTIMO ── */}
      {calculadora === 'emprestimo' && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className={labelClass}>Valor do Empréstimo *</label>
              <input type="number" step="0.01" value={valorEmprestimo} onChange={e => setValorEmprestimo(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Taxa de Juros (% ao mês) *</label>
                <input type="number" step="0.01" value={taxaJuros} onChange={e => setTaxaJuros(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
              </div>
              <div>
                <label className={labelClass}>Número de Parcelas *</label>
                <input type="number" value={numeroParcelas} onChange={e => setNumeroParcelas(e.target.value)} className={inputClass(cor)} placeholder="0" />
              </div>
            </div>
            <button onClick={calcular} className="w-full text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap cursor-pointer" style={{ background: `linear-gradient(to right, ${cor}, #0891B2)` }}>Simular Empréstimo</button>
          </div>
          {resultadoEmprestimo && (
            <div className="space-y-4">
              <div className="rounded-xl p-6 border" style={{ background: `${cor}15`, borderColor: `${cor}40` }}>
                <p className="text-sm text-[#9CA3AF] mb-1">Valor da Parcela</p>
                <p className="text-4xl font-bold" style={{ color: cor }}>{formatCurrency(resultadoEmprestimo.parcela)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Total a Pagar</p>
                  <p className="text-lg font-bold text-[#F9FAFB]">{formatCurrency(resultadoEmprestimo.total)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Total de Juros</p>
                  <p className="text-lg font-bold text-[#EF4444]">{formatCurrency(resultadoEmprestimo.juros)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── FINANCIAMENTO ── */}
      {calculadora === 'financiamento' && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className={labelClass}>Valor do Imóvel *</label>
              <input type="number" step="0.01" value={valorImovel} onChange={e => setValorImovel(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
            </div>
            <div>
              <label className={labelClass}>Valor da Entrada</label>
              <input type="number" step="0.01" value={entrada} onChange={e => setEntrada(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Taxa de Juros (% ao mês) *</label>
                <input type="number" step="0.01" value={taxaFinanciamento} onChange={e => setTaxaFinanciamento(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
              </div>
              <div>
                <label className={labelClass}>Prazo (meses) *</label>
                <input type="number" value={prazoFinanciamento} onChange={e => setPrazoFinanciamento(e.target.value)} className={inputClass(cor)} placeholder="0" />
              </div>
            </div>
            <button onClick={calcular} className="w-full text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap cursor-pointer" style={{ background: `linear-gradient(to right, ${cor}, #7C3AED)` }}>Simular Financiamento</button>
          </div>
          {resultadoFinanciamento && (
            <div className="space-y-4">
              <div className="rounded-xl p-6 border" style={{ background: `${cor}15`, borderColor: `${cor}40` }}>
                <p className="text-sm text-[#9CA3AF] mb-1">Valor da Parcela</p>
                <p className="text-4xl font-bold" style={{ color: cor }}>{formatCurrency(resultadoFinanciamento.parcela)}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['Valor Financiado', resultadoFinanciamento.valorFinanciado, '#F9FAFB'], ['Total a Pagar', resultadoFinanciamento.total, '#F9FAFB'], ['Total de Juros', resultadoFinanciamento.juros, '#EF4444']].map(([l, v, c]) => (
                  <div key={l as string} className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                    <p className="text-xs text-[#9CA3AF] mb-1">{l as string}</p>
                    <p className="text-base font-bold" style={{ color: c as string }}>{formatCurrency(v as number)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── JUROS COMPOSTOS ── */}
      {calculadora === 'jurosCompostos' && (
        <>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Aporte Inicial (R$)</label>
                <input type="number" step="0.01" value={jcAporteInicial} onChange={e => setJcAporteInicial(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
              </div>
              <div>
                <label className={labelClass}>Aporte Mensal (R$) *</label>
                <input type="number" step="0.01" value={jcAporteMensal} onChange={e => setJcAporteMensal(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
              </div>
            </div>
            
            <div>
              <label className={labelClass}>Aporte Anual (R$)</label>
              <input type="number" step="0.01" value={jcAporteAnual} onChange={e => setJcAporteAnual(e.target.value)} className={inputClass(cor)} placeholder="0,00" />
              <p className="text-xs text-[#6B7280] mt-1">Bônus, comissão ou gratificação anual reinvestida</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Taxa de Juros (% ao ano) *</label>
                <input type="number" step="0.01" value={jcTaxaAnual} onChange={e => setJcTaxaAnual(e.target.value)} className={inputClass(cor)} placeholder="Ex: 12" />
              </div>
              <div>
                <label className={labelClass}>Período (anos) *</label>
                <input type="number" value={jcAnos} onChange={e => setJcAnos(e.target.value)} className={inputClass(cor)} placeholder="Ex: 10" />
              </div>
            </div>
            <button onClick={calcular} className="w-full text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap cursor-pointer" style={{ background: `linear-gradient(to right, ${cor}, #0D9488)` }}>Simular Juros Compostos</button>
          </div>

          {resultadoJuros && (
            <div className="space-y-4">
              <div className="rounded-xl p-6 border" style={{ background: `${cor}15`, borderColor: `${cor}40` }}>
                <p className="text-sm text-[#9CA3AF] mb-1">Total Acumulado</p>
                <p className="text-4xl font-bold" style={{ color: cor }}>{formatCurrency(resultadoJuros.totalAcumulado)}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Total Aportado</p>
                  <p className="text-base font-bold text-[#F9FAFB]">{formatCurrency(resultadoJuros.totalAportado)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Rendimento</p>
                  <p className="text-base font-bold text-[#10B981]">{formatCurrency(resultadoJuros.rendimento)}</p>
                </div>
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">Rentabilidade</p>
                  <p className="text-base font-bold text-[#10B981]">{formatPercent(resultadoJuros.rendimentoPercent)}</p>
                </div>
              </div>

              {resultadoJuros.pontos.length > 0 && (
                <div className="bg-[#111827] border border-[#374151] rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#D1D5DB] mb-3 flex items-center gap-2">
                    <i className="ri-bar-chart-line" style={{ color: cor }}></i>
                    Evolução Anual
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[#6B7280] border-b border-[#374151]">
                          <th className="text-left pb-2">Ano</th>
                          <th className="text-right pb-2">Aportado</th>
                          <th className="text-right pb-2">Rendimento</th>
                          <th className="text-right pb-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadoJuros.pontos.map((p) => (
                          <tr key={p.ano} className="border-b border-[#1F2937] hover:bg-[#1F2937]/50 transition-colors">
                            <td className="py-2 text-[#9CA3AF]">{p.ano}º ano</td>
                            <td className="py-2 text-right text-[#F9FAFB]">{formatCurrency(p.totalAportado)}</td>
                            <td className="py-2 text-right text-[#10B981]">{formatCurrency(p.rendimento)}</td>
                            <td className="py-2 text-right font-bold" style={{ color: cor }}>{formatCurrency(p.totalAcumulado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
