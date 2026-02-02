import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import TrabalhoCalculadoras from './components/TrabalhoCalculadoras';
import ConstrucaoCalculadoras from './components/ConstrucaoCalculadoras';
import ServicoCalculadoras from './components/ServicoCalculadoras';

type SubPage = 'trabalho' | 'construcao' | 'servico';

export default function CalculadorasPage() {
  const [currentPage, setCurrentPage] = useState<SubPage>('trabalho');

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F9FAFB]">
            Calculadoras Inteligentes
          </h1>
          <p className="text-sm sm:text-base text-[#9CA3AF] mt-1">Ferramentas práticas para o seu dia a dia</p>
        </div>

        {/* Subnavegação */}
        <div className="flex flex-wrap gap-3 mb-6 lg:mb-8">
          <button
            onClick={() => setCurrentPage('trabalho')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
              currentPage === 'trabalho'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-lg shadow-[#7C3AED]/30'
                : 'bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:border-[#7C3AED]/50'
            }`}
          >
            <i className="ri-briefcase-line mr-2"></i>
            Trabalho
          </button>
          <button
            onClick={() => setCurrentPage('construcao')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
              currentPage === 'construcao'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-lg shadow-[#7C3AED]/30'
                : 'bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:border-[#7C3AED]/50'
            }`}
          >
            <i className="ri-hammer-line mr-2"></i>
            Construção / Reforma
          </button>
          <button
            onClick={() => setCurrentPage('servico')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
              currentPage === 'servico'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-lg shadow-[#7C3AED]/30'
                : 'bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:border-[#7C3AED]/50'
            }`}
          >
            <i className="ri-tools-line mr-2"></i>
            Prestação de Serviço
          </button>
        </div>

        {/* Conteúdo */}
        {currentPage === 'trabalho' && <TrabalhoCalculadoras />}
        {currentPage === 'construcao' && <ConstrucaoCalculadoras />}
        {currentPage === 'servico' && <ServicoCalculadoras />}
      </div>
    </MainLayout>
  );
}
