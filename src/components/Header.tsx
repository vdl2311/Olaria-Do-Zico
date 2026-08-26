import React from 'react';
import { RefreshCw, Menu, Cloud, ShieldCheck, Cpu, FlaskConical, Palette, Sun, Moon } from 'lucide-react';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/authService';
import { BrandSymbol } from './BrandLogo';
import { useTheme } from '../context/ThemeContext';
import olariaLogoUrl from '../assets/images/favicon.png';

interface HeaderProps {
  onOpenVoiceModal?: () => void;
  activeView: string;
  onOpenMobileDrawer?: () => void;
  onNavigateToTechnical?: () => void;
  onNavigateToSecurity?: () => void;
  onNavigateToBrandKit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  onOpenMobileDrawer,
  onNavigateToTechnical,
  onNavigateToSecurity,
  onNavigateToBrandKit
}) => {
  const { isDark, toggleTheme } = useTheme();
  const currentUser = AuthService.getCurrentUser();
  const isOwner = currentUser?.role === 'PROPRIETARIO';
  const isDemo = currentUser?.tenantId === 'tenant_demo_sandbox_01';

  const handleReset = () => {
    if (isDemo) {
      if (window.confirm('Deseja restaurar os dados de demonstração (sandbox)? As modificações de teste serão resetadas para o padrão.')) {
        StorageService.resetDemoSandbox();
      }
    } else {
      if (window.confirm('Deseja restaurar os dados padrão da Olaria? Todos os registros locais serão reiniciados.')) {
        StorageService.resetToDefault();
        window.location.reload();
      }
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Início & Visão Geral';
      case 'assistente-ia': return 'Assistente IA & Gestão';
      case 'vendas': return 'Gestão de Vendas';
      case 'producao': return 'Controle de Produção';
      case 'estoque': return 'Estoque & Insumos';
      case 'clientes': return 'Cadastro de Clientes';
      case 'pedidos': return 'Pedidos Personalizados';
      case 'entregas': return 'Logística de Entregas';
      case 'financeiro': return 'Financeiro & Contas';
      case 'produtos': return 'Catálogo de Produtos';
      case 'relatorios': return 'Relatórios e Busca';
      case 'auditoria': return 'Histórico e Auditoria';
      case 'seguranca': return 'Segurança & Permissões';
      case 'brandkit': return 'Brand Kit & Manual da Marca';
      default: return 'Olaria';
    }
  };

  return (
    <header className="bg-[#8A5A44] dark:bg-[#252320] text-[#F7F1E7] dark:text-[#F2EBDD] border-b border-[#6E4533] dark:border-[#3D3833] sticky top-0 z-30 shadow-md transition-colors font-brand-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2">
        {/* Left: Mobile menu toggle + Brand Logo & Title */}
        <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0 flex-1">
          {onOpenMobileDrawer && (
            <button
              type="button"
              onClick={onOpenMobileDrawer}
              aria-label="Abrir menu principal de navegação"
              className="lg:hidden p-2.5 rounded-xl bg-[#6E4533] dark:bg-[#2E2A26] text-[#E7D5BE] dark:text-[#F2EBDD] hover:text-white hover:bg-[#5C3829] dark:hover:bg-[#3D3833] transition-colors cursor-pointer shrink-0"
              title="Abrir Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <img
              src={olariaLogoUrl}
              alt="Olaria do Zico"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-md select-none"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-[#F7F1E7] flex items-center gap-2 truncate">
                <span className="font-brand-serif font-black tracking-wider uppercase truncate">
                  {currentUser?.companyName || (isDemo ? 'Olaria (Demo)' : 'OLARIA DO ZICO')}
                </span>
                {isDemo ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-200 border border-cyan-700 hidden sm:inline-flex items-center gap-1 shrink-0 font-brand-sans">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Sandbox</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#667052] text-[#F7F1E7] border border-[#4F583D] hidden md:inline-flex items-center gap-1 shrink-0 font-brand-sans">
                    <Cloud className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Nuvem</span>
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-[#E7D5BE] font-medium truncate hidden sm:block font-brand-sans">
                {getViewTitle()}
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions: Dark/Light Mode + Brandkit + Reset */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#6E4533] dark:bg-[#2E2A26] text-[#FAF6EF] hover:bg-[#5C3829] dark:hover:bg-[#3D3833] transition-all flex items-center gap-2 cursor-pointer border border-[#A7735B]/40 dark:border-[#3D3833] shadow-2xs font-brand-sans"
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-xs font-bold hidden md:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-amber-100 shrink-0" />
                <span className="text-xs font-bold hidden md:inline">Escuro</span>
              </>
            )}
          </button>

          {/* Reset Demo / Production Data */}
          <button
            type="button"
            onClick={handleReset}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#6E4533] dark:bg-[#2E2A26] text-[#FAF6EF] hover:bg-[#5C3829] dark:hover:bg-[#3D3833] transition-colors flex items-center gap-1.5 cursor-pointer border border-[#A7735B]/40 dark:border-[#3D3833]"
            title={isDemo ? 'Restaurar Sandbox Demo' : 'Restaurar Dados Padrão'}
            aria-label="Restaurar dados padrão"
          >
            <RefreshCw className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="text-xs font-bold hidden xl:inline">Restaurar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
