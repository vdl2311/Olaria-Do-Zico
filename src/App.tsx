import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { VoiceModal } from './components/VoiceModal';
import { VoiceFloatingButton } from './components/VoiceFloatingButton';

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

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleOpenVoiceModal = () => {
    setIsVoiceModalOpen(true);
  };

  const handleCloseVoiceModal = () => {
    setIsVoiceModalOpen(false);
  };

  const handleActionApplied = () => {
    // Re-render views if needed when a voice action is confirmed and applied
    setActiveView((prev) => prev);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onOpenVoiceModal={handleOpenVoiceModal} setActiveView={setActiveView} />;
      case 'vendas':
        return <SalesView onOpenVoiceModal={handleOpenVoiceModal} />;
      case 'producao':
        return <ProductionView onOpenVoiceModal={handleOpenVoiceModal} />;
      case 'estoque':
        return <StockView onOpenVoiceModal={handleOpenVoiceModal} />;
      case 'clientes':
        return <CustomersView />;
      case 'pedidos':
        return <CustomOrdersView onOpenVoiceModal={handleOpenVoiceModal} />;
      case 'entregas':
        return <DeliveriesView onOpenVoiceModal={handleOpenVoiceModal} />;
      case 'financeiro':
        return <FinanceView onOpenVoiceModal={handleOpenVoiceModal} />;
      case 'produtos':
        return <ProductsView />;
      case 'relatorios':
        return <ReportsView />;
      case 'auditoria':
        return <AuditView />;
      default:
        return <DashboardView onOpenVoiceModal={handleOpenVoiceModal} setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col antialiased selection:bg-amber-200 selection:text-amber-950">
      {/* Top Header */}
      <Header 
        activeView={activeView} 
        onOpenVoiceModal={handleOpenVoiceModal} 
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Main Body with Desktop Sidebar Navigation */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6">
        <Navigation 
          activeView={activeView} 
          setActiveView={setActiveView} 
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />

        <main className="flex-1 min-w-0 pb-20 lg:pb-6">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Voice Button */}
      <VoiceFloatingButton onClick={handleOpenVoiceModal} />

      {/* Voice Assistant Modal */}
      {isVoiceModalOpen && (
        <VoiceModal
          onClose={handleCloseVoiceModal}
          onActionApplied={handleActionApplied}
        />
      )}
    </div>
  );
}
