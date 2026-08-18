import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { StorageService } from './services/storage';
import { AuthService } from './services/authService';
import { AuthUser } from './types';

// Views
import { DashboardView } from './views/DashboardView';
import { SalesView } from './views/SalesView';
import { ProductionView } from './views/ProductionView';
import { StockView } from './views/StockView';
import { CustomersView } from './views/CustomersView';
import { CustomOrdersView } from './views/CustomOrdersView';
import { DeliveriesView } from './views/DeliveriesView';
import { FinanceView } from './views/FinanceView';
import { ProductsView } from './views/ProductsView';
import { ReportsView } from './views/ReportsView';
import { AuditView } from './views/AuditView';
import { SecurityUsersView } from './views/SecurityUsersView';
import { BrandKitView } from './views/BrandKitView';
import { LoginView } from './views/LoginView';
import { TechnicalAdminView } from './views/TechnicalAdminView';
import { AIAssistantView } from './views/AIAssistantView';
import { Lock } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => AuthService.getCurrentUser());
  const [isTechnicalPortalOpen, setIsTechnicalPortalOpen] = useState(false);
  
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Scroll to top whenever the active view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [activeView]);

  // Initialize real-time cloud database sync with Firebase
  useEffect(() => {
    StorageService.initFirestoreSync();
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsTechnicalPortalOpen(false);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setIsTechnicalPortalOpen(false);
  };

  // If in Technical DevOps portal mode
  if (isTechnicalPortalOpen) {
    return (
      <ToastProvider>
        <TechnicalAdminView onBackToCommercial={() => setIsTechnicalPortalOpen(false)} />
      </ToastProvider>
    );
  }

  // If not authenticated, display login screen
  if (!currentUser) {
    return (
      <ToastProvider>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
        />
      </ToastProvider>
    );
  }

  // Permission Guard Helper
  const checkPermission = (requiredKey: string): boolean => {
    if (currentUser.role === 'PROPRIETARIO') return true;
    if (!currentUser.permissions) return false;
    return (currentUser.permissions as any)[requiredKey] === true;
  };

  const renderAccessDenied = (moduleName: string) => (
    <div className="bg-[#FAF6EF] border border-[#E7D5BE] rounded-3xl p-5 sm:p-8 text-center max-w-lg mx-auto my-6 sm:my-12 shadow-xs space-y-4 font-brand-sans w-full">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E7D5BE] text-[#8A5A44] mx-auto flex items-center justify-center">
        <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>
      <h3 className="font-brand-serif text-lg sm:text-xl font-bold text-[#292724]">Acesso Restrito: {moduleName}</h3>
      <p className="text-xs sm:text-sm text-[#5C5852] leading-relaxed">
        Seu perfil de usuário (<strong>{currentUser?.name || 'Usuário'}</strong>) não possui permissão para visualizar este módulo. Solicite a liberação ao proprietário da olaria.
      </p>
      <button
        type="button"
        onClick={() => setActiveView('dashboard')}
        className="px-5 py-2.5 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
      >
        Voltar para a Visão Geral
      </button>
    </div>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView setActiveView={setActiveView} />;
      case 'assistente-ia':
        return <AIAssistantView onNavigateToView={setActiveView} />;
      case 'vendas':
        return checkPermission('vendas') ? <SalesView /> : renderAccessDenied('Vendas');
      case 'producao':
        return checkPermission('producao') ? <ProductionView /> : renderAccessDenied('Produção');
      case 'estoque':
        return checkPermission('estoque') ? <StockView /> : renderAccessDenied('Estoque');
      case 'clientes':
        return checkPermission('clientes') ? <CustomersView /> : renderAccessDenied('Clientes');
      case 'pedidos':
        return checkPermission('pedidos') ? <CustomOrdersView /> : renderAccessDenied('Pedidos Sob Encomenda');
      case 'entregas':
        return checkPermission('entregas') ? <DeliveriesView /> : renderAccessDenied('Entregas');
      case 'financeiro':
        return checkPermission('financeiro') ? <FinanceView /> : renderAccessDenied('Financeiro & Contas');
      case 'produtos':
        return checkPermission('produtos') ? <ProductsView onNavigateToStock={() => setActiveView('estoque')} /> : renderAccessDenied('Produtos');
      case 'brandkit':
        return <BrandKitView />;
      case 'relatorios':
        return checkPermission('relatorios') ? <ReportsView /> : renderAccessDenied('Relatórios');
      case 'auditoria':
        return checkPermission('auditoria') ? <AuditView /> : renderAccessDenied('Histórico e Auditoria');
      case 'seguranca':
        return currentUser.role === 'PROPRIETARIO' ? <SecurityUsersView /> : renderAccessDenied('Segurança & Permissões');
      default:
        return <DashboardView setActiveView={setActiveView} />;
    }
  };

  const isDemo = currentUser.tenantId === 'tenant_demo_sandbox_01';

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="min-h-screen bg-[#F7F1E7] dark:bg-[#1A1816] text-[#292724] dark:text-[#F7F1E7] font-brand-sans flex flex-col antialiased selection:bg-[#E7D5BE] selection:text-[#292724] transition-colors duration-200 overflow-x-hidden w-full">
          {/* Top Header */}
        <Header 
          activeView={activeView} 
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onNavigateToSecurity={() => setActiveView('seguranca')}
          onNavigateToBrandKit={() => setActiveView('brandkit')}
        />

        {/* Demo Sandbox Banner */}
        {isDemo && (
          <div className="bg-[#8A5A44] text-[#F7F1E7] border-b border-[#6E4533] px-4 py-2.5 shadow-xs font-brand-sans">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-center sm:text-left">
                <span className="px-2 py-0.5 rounded-md bg-[#6E4533] font-black text-[10px] tracking-wider uppercase border border-[#A7735B]/40 shrink-0 text-[#E7D5BE]">
                  Sandbox
                </span>
                <span className="font-medium text-[#F7F1E7]">
                  Você está no <strong>Ambiente de Demonstração</strong>. Todos os dados (vendas, estoque, financeiro) são fictícios e 100% isolados da produção real.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    StorageService.resetDemoSandbox();
                  }}
                  className="px-3 py-1 bg-[#B85C38] hover:bg-[#9E4A2A] text-white rounded-lg font-bold transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[#FAF6EF]"
                >
                  Resetar Demonstração
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1 bg-[#292724] hover:bg-black text-[#E7D5BE] rounded-lg font-semibold transition-colors cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-[#FAF6EF]"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Body with Desktop Sidebar Navigation */}
        <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6 min-w-0">
          <Navigation 
            activeView={activeView} 
            setActiveView={setActiveView} 
            isMobileDrawerOpen={isMobileDrawerOpen}
            setIsMobileDrawerOpen={setIsMobileDrawerOpen}
            onLogout={handleLogout}
          />

          <main className="flex-1 min-w-0 w-full pb-20 lg:pb-6">
            {renderActiveView()}
          </main>
        </div>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
