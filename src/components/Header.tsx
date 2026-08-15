import React from 'react';
import { Sparkles, RefreshCw, Mic, Store, Menu, Cloud } from 'lucide-react';
import { StorageService } from '../services/storage';

interface HeaderProps {
  onOpenVoiceModal: () => void;
  activeView: string;
  onOpenMobileDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenVoiceModal, activeView, onOpenMobileDrawer }) => {
  const handleReset = () => {
    if (window.confirm('Deseja restaurar os dados de exemplo da Olaria do Zico? Todos os registros atuais serão resetados.')) {
      StorageService.resetToDefault();
      window.location.reload();
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Visão Geral (Início)';
      case 'vendas': return 'Gestão de Vendas';
      case 'producao': return 'Controle de Produção';
      case 'estoque': return 'Estoque de Peças e Insumos';
      case 'clientes': return 'Cadastro de Clientes';
      case 'pedidos': return 'Pedidos Personalizados';
      case 'entregas': return 'Logística de Entregas';
      case 'financeiro': return 'Financeiro & Contas';
      case 'produtos': return 'Catálogo de Produtos';
      case 'relatorios': return 'Relatórios e Busca';
      case 'auditoria': return 'Histórico e Auditoria';
      default: return 'Olaria do Zico';
    }
  };

  return (
    <header className="bg-amber-950/95 text-amber-50 border-b border-amber-900/60 sticky top-0 z-30 shadow-md backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile menu toggle + Logo & Title */}
        <div className="flex items-center space-x-3">
          {onOpenMobileDrawer && (
            <button
              onClick={onOpenMobileDrawer}
              className="lg:hidden p-2 rounded-xl bg-amber-900/80 text-amber-200 hover:text-amber-50 hover:bg-amber-800 transition-colors"
              title="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-amber-950 shadow-inner font-bold text-xl border border-amber-500/40 shrink-0">
            <Store className="w-5 h-5 text-amber-100" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-amber-100 flex items-center gap-2 truncate">
              <span className="truncate">Olaria do Zico</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-700 hidden sm:inline-flex items-center gap-1 shrink-0">
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>Firebase Firestore</span>
              </span>
            </h1>
            <p className="text-[11px] text-amber-300/80 font-medium truncate hidden xs:block">{getViewTitle()}</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Voice Command Button in Header */}
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 border border-amber-400/30"
            title="Registrar por Voz"
          >
            <Mic className="w-4 h-4 animate-pulse text-amber-100" />
            <span className="hidden sm:inline">Comando de Voz</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleReset}
            className="p-2 text-amber-300/80 hover:text-amber-100 hover:bg-amber-900/60 rounded-xl transition-colors shrink-0"
            title="Restaurar dados de exemplo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};


