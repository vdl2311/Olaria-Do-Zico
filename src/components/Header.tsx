import React from 'react';
import { Sparkles, RefreshCw, Mic, Menu, Cloud, ShieldCheck, Cpu, FlaskConical, Palette } from 'lucide-react';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/authService';
import { BrandLogo, BrandSymbol } from './BrandLogo';

interface HeaderProps {
  onOpenVoiceModal: () => void;
  activeView: string;
  onOpenMobileDrawer?: () => void;
  onNavigateToTechnical?: () => void;
  onNavigateToSecurity?: () => void;
  onNavigateToBrandKit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenVoiceModal, 
  activeView, 
  onOpenMobileDrawer,
  onNavigateToTechnical,
  onNavigateToSecurity,
  onNavigateToBrandKit
}) => {
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
    <header className="bg-[#8A5A44] text-[#F7F1E7] border-b border-[#6E4533] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Left: Mobile menu toggle + Brand Logo & Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          {onOpenMobileDrawer && (
            <button
              onClick={onOpenMobileDrawer}
              className="lg:hidden p-2 rounded-xl bg-[#6E4533] text-[#E7D5BE] hover:text-white hover:bg-[#5C3829] transition-colors cursor-pointer shrink-0"
              title="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F7F1E7] flex items-center justify-center p-1.5 sm:p-2 shadow-xs border border-[#E7D5BE] shrink-0">
              <BrandSymbol variant="terracota" className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-[#F7F1E7] flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="font-brand-serif font-black tracking-wider uppercase truncate">
                  {currentUser?.companyName || (isDemo ? 'Olaria (Demo)' : 'OLARIA')}
                </span>
                {isDemo ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-200 border border-cyan-700 hidden sm:inline-flex items-center gap-1 shrink-0 font-brand-sans">
                    <FlaskConical className="w-3 h-3 text-cyan-300" />
                    <span>Sandbox</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#667052] text-[#F7F1E7] border border-[#4F583D] hidden md:inline-flex items-center gap-1 shrink-0 font-brand-sans">
                    <Cloud className="w-3 h-3 text-emerald-200" />
                    <span>Nuvem</span>
                  </span>
                )}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#E7D5BE]/80 font-medium truncate hidden xs:block font-brand-sans">
                {getViewTitle()}
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Brand Kit Quick Access Button */}
          {onNavigateToBrandKit && (
            <button
              onClick={onNavigateToBrandKit}
              className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer font-brand-sans shrink-0 ${
                activeView === 'brandkit'
                  ? 'bg-[#B85C38] text-white border-[#B85C38] shadow-sm'
                  : 'bg-[#6E4533] hover:bg-[#5C3829] text-[#E7D5BE] border-[#A7735B]/40'
              }`}
              title="Acessar Brand Kit & Manual da Marca"
            >
              <Palette className="w-3.5 h-3.5 text-[#E7D5BE] shrink-0" />
              <span className="hidden md:inline">Brand Kit</span>
            </button>
          )}

          {/* Security & Access Quick Badge */}
          {isOwner && onNavigateToSecurity && (
            <button
              onClick={onNavigateToSecurity}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6E4533] hover:bg-[#5C3829] text-[#E7D5BE] border border-[#A7735B]/40 text-xs font-bold transition-all cursor-pointer font-brand-sans shrink-0"
              title="Gerenciar Usuários e Segurança"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#E7D5BE] shrink-0" />
              <span>Segurança</span>
            </button>
          )}

          {/* DevOps portal access */}
          {onNavigateToTechnical && (
            <button
              onClick={onNavigateToTechnical}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#292724] hover:bg-black text-[#E7D5BE] border border-stone-700 text-xs font-semibold transition-all cursor-pointer font-brand-sans shrink-0"
              title="Acessar Console Técnico de Manutenção"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Área Dev</span>
            </button>
          )}

          {/* Voice Command Button in Header (Section #21 - Terracota #B85C38) */}
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center space-x-1.5 sm:space-x-2 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold text-xs sm:text-sm px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all shadow-sm active:scale-95 border border-[#CF734E]/60 cursor-pointer font-brand-sans shrink-0"
            title="Falar / Registrar por Voz"
          >
            <Mic className="w-4 h-4 animate-pulse text-[#F7F1E7] shrink-0" />
            <span className="hidden xs:inline">Falar</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleReset}
            className="p-1.5 sm:p-2 text-[#E7D5BE]/80 hover:text-[#F7F1E7] hover:bg-[#6E4533] rounded-xl transition-colors shrink-0 cursor-pointer"
            title={isDemo ? 'Restaurar dados da demonstração' : 'Restaurar dados de exemplo'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
