import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Hammer, 
  Package, 
  Users, 
  ClipboardList, 
  Truck, 
  DollarSign, 
  Box, 
  BarChart3, 
  History,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  UserCheck
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/authService';

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isMobileDrawerOpen?: boolean;
  setIsMobileDrawerOpen?: (open: boolean) => void;
  onLogout?: () => void;
}

export interface NavGroup {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    requiredPermission?: string;
    ownerOnly?: boolean;
  }[];
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeView, 
  setActiveView,
  isMobileDrawerOpen = false,
  setIsMobileDrawerOpen,
  onLogout
}) => {
  const currentUser = AuthService.getCurrentUser();
  const isOwner = currentUser?.role === 'PROPRIETARIO';
  const userPerms = currentUser?.permissions;

  const products = StorageService.getProducts();
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const deliveries = StorageService.getDeliveries();
  const pendingDeliveriesCount = deliveries.filter(d => d.status !== 'Entregue').length;

  const ALL_NAV_GROUPS: NavGroup[] = [
    {
      title: 'Operacional',
      items: [
        { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
        { id: 'vendas', label: 'Vendas', icon: ShoppingCart, requiredPermission: 'vendas' },
        { id: 'producao', label: 'Produção', icon: Hammer, requiredPermission: 'producao' },
        { id: 'estoque', label: 'Estoque', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined, requiredPermission: 'estoque' },
      ]
    },
    {
      title: 'Clientes & Pedidos',
      items: [
        { id: 'clientes', label: 'Clientes', icon: Users, requiredPermission: 'clientes' },
        { id: 'pedidos', label: 'Pedidos Especiais', icon: ClipboardList, requiredPermission: 'pedidos' },
        { id: 'entregas', label: 'Entregas', icon: Truck, badge: pendingDeliveriesCount > 0 ? pendingDeliveriesCount : undefined, requiredPermission: 'entregas' },
      ]
    },
    {
      title: 'Gestão & Cadastros',
      items: [
        { id: 'financeiro', label: 'Financeiro', icon: DollarSign, requiredPermission: 'financeiro' },
        { id: 'produtos', label: 'Produtos', icon: Box, requiredPermission: 'produtos' },
        { id: 'relatorios', label: 'Relatórios', icon: BarChart3, requiredPermission: 'relatorios' },
        { id: 'auditoria', label: 'Histórico', icon: History, requiredPermission: 'auditoria' },
        { id: 'seguranca', label: 'Segurança & Acessos', icon: ShieldCheck, ownerOnly: true },
      ]
    }
  ];

  // Filter groups based on user permissions
  const NAV_GROUPS = ALL_NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (isOwner) return true;
      if (item.ownerOnly) return false;
      if (item.requiredPermission && userPerms) {
        return (userPerms as any)[item.requiredPermission] === true;
      }
      return true;
    })
  })).filter(group => group.items.length > 0);

  const PRIMARY_MOBILE_NAV = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
    { id: 'producao', label: 'Produção', icon: Hammer },
    { id: 'estoque', label: 'Estoque', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
  ];

  const handleSelectView = (viewId: string) => {
    setActiveView(viewId);
    if (setIsMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      AuthService.logout();
      window.location.reload();
    }
  };

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-amber-950/95 text-amber-100 border-r border-amber-900/40 p-4 shrink-0 min-h-[calc(100vh-4rem)] rounded-2xl shadow-lg my-2">
        <div className="space-y-6">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80 px-3">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectView(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white font-semibold shadow-md translate-x-1'
                          : 'text-amber-200/80 hover:bg-amber-900/60 hover:text-amber-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-amber-800 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card at Sidebar Bottom */}
        <div className="pt-4 border-t border-amber-900/60 mt-4">
          <div className="p-3 bg-amber-900/40 rounded-xl border border-amber-900/60 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-800 flex items-center justify-center text-amber-100 font-bold text-xs shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-amber-100 truncate">
                  {currentUser?.name || 'Oleiro Zico'}
                </p>
                <p className="text-[10px] text-amber-300/80 truncate">
                  {currentUser?.role === 'PROPRIETARIO' ? '👑 Proprietário' : '👷 Operacional'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-900/30 hover:bg-red-950/60 text-amber-200/70 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-red-900/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Quick Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-amber-950 border-t border-amber-900/60 z-30 px-3 py-1.5 shadow-2xl backdrop-blur-md bg-amber-950/95">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {PRIMARY_MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectView(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-amber-400 font-bold scale-105'
                    : 'text-amber-300/70 hover:text-amber-100'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-amber-300/70'}`} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-0.5">{item.label}</span>
              </button>
            );
          })}

          {/* More Menu Trigger */}
          <button
            onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
              isMobileDrawerOpen ? 'text-amber-400 font-bold' : 'text-amber-300/70 hover:text-amber-100'
            }`}
          >
            <Menu className="w-5 h-5 text-amber-300/70" />
            <span className="mt-0.5">Mais</span>
          </button>
        </div>
      </nav>

      {/* Mobile Slide-Up Navigation Drawer */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(false)} 
          />
          <div className="relative bg-amber-950 text-amber-50 rounded-t-3xl border-t border-amber-800 p-5 shadow-2xl max-h-[85vh] overflow-y-auto z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-amber-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-amber-100 text-base">Menu Olaria do Zico</h3>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(false)}
                className="p-1 rounded-full bg-amber-900 text-amber-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {NAV_GROUPS.map((group, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90 border-b border-amber-900/60 pb-1">
                    {group.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectView(item.id)}
                          className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-600 text-white shadow-md'
                              : 'bg-amber-900/50 text-amber-200 hover:bg-amber-900'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-amber-400'}`} />
                          <span className="truncate flex-1">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleLogoutClick}
                className="w-full py-2.5 bg-red-950/60 text-red-200 hover:bg-red-900 font-bold rounded-xl text-center text-xs flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Sistema</span>
              </button>
              <button
                onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(false)}
                className="w-full py-2.5 bg-amber-900 text-amber-200 font-bold rounded-xl text-center text-xs"
              >
                Fechar Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


