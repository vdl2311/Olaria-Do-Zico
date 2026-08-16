import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Flame, 
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
  UserCheck,
  Palette,
  Sparkles
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
        { id: 'producao', label: 'Produção (Fornos)', icon: Flame, requiredPermission: 'producao' },
        { id: 'estoque', label: 'Estoque & Insumos', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined, requiredPermission: 'estoque' },
      ]
    },
    {
      title: 'Clientes & Pedidos',
      items: [
        { id: 'clientes', label: 'Clientes & Obras', icon: Users, requiredPermission: 'clientes' },
        { id: 'pedidos', label: 'Pedidos Especiais', icon: ClipboardList, requiredPermission: 'pedidos' },
        { id: 'entregas', label: 'Entregas & Frete', icon: Truck, badge: pendingDeliveriesCount > 0 ? pendingDeliveriesCount : undefined, requiredPermission: 'entregas' },
      ]
    },
    {
      title: 'Gestão & Marca',
      items: [
        { id: 'financeiro', label: 'Financeiro', icon: DollarSign, requiredPermission: 'financeiro' },
        { id: 'produtos', label: 'Catálogo de Peças', icon: Box, requiredPermission: 'produtos' },
        { id: 'brandkit', label: 'Brand Kit & Identidade', icon: Palette },
        { id: 'relatorios', label: 'Relatórios e Busca', icon: BarChart3, requiredPermission: 'relatorios' },
        { id: 'auditoria', label: 'Histórico & Auditoria', icon: History, requiredPermission: 'auditoria' },
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
    { id: 'producao', label: 'Produção', icon: Flame },
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
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-[#8A5A44] text-[#F7F1E7] border-r border-[#6E4533] p-4 shrink-0 min-h-[calc(100vh-4.5rem)] rounded-2xl shadow-md my-2">
        <div className="space-y-6">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#E7D5BE] px-3 font-brand-sans">
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
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer font-brand-sans ${
                        isActive
                          ? 'bg-[#B85C38] text-white font-bold shadow-sm translate-x-1'
                          : 'text-[#E7D5BE] hover:bg-[#6E4533] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#E7D5BE]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-[#9E4A2A] text-white' : 'bg-rose-600 text-white'
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
        <div className="pt-4 border-t border-[#6E4533] mt-4 font-brand-sans">
          <div className="p-3 bg-[#6E4533]/60 rounded-xl border border-[#A7735B]/30 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#B85C38] flex items-center justify-center text-white font-bold text-xs shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#F7F1E7] truncate">
                  {currentUser?.name || 'Oleiro'}
                </p>
                <p className="text-[10px] text-[#E7D5BE] truncate">
                  {currentUser?.role === 'PROPRIETARIO' ? '👑 Proprietário' : '👷 Operacional'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#6E4533]/40 hover:bg-rose-950/80 text-[#E7D5BE] hover:text-rose-200 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-rose-800/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Quick Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#8A5A44] border-t border-[#6E4533] z-30 px-3 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto font-brand-sans">
          {PRIMARY_MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectView(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-[#F7F1E7] font-bold scale-105'
                    : 'text-[#E7D5BE]/80 hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#F7F1E7]' : 'text-[#E7D5BE]/80'}`} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[9px] font-bold px-1 rounded-full">
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
              isMobileDrawerOpen ? 'text-[#F7F1E7] font-bold' : 'text-[#E7D5BE]/80 hover:text-white'
            }`}
          >
            <Menu className="w-5 h-5 text-[#E7D5BE]/80" />
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
          <div className="relative bg-[#8A5A44] text-[#F7F1E7] rounded-t-3xl border-t border-[#6E4533] p-5 shadow-2xl max-h-[85vh] overflow-y-auto z-10 space-y-5 font-brand-sans">
            <div className="flex items-center justify-between border-b border-[#6E4533] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#E7D5BE]" />
                <h3 className="font-brand-serif font-bold text-white text-base">Menu Olaria</h3>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(false)}
                className="p-1 rounded-full bg-[#6E4533] text-[#E7D5BE] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {NAV_GROUPS.map((group, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#E7D5BE] border-b border-[#6E4533] pb-1">
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
                              ? 'bg-[#B85C38] text-white shadow-md'
                              : 'bg-[#6E4533]/60 text-[#E7D5BE] hover:bg-[#6E4533]'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#E7D5BE]'}`} />
                          <span className="truncate flex-1">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
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
                className="w-full py-2.5 bg-rose-950/80 text-rose-200 hover:bg-rose-900 font-bold rounded-xl text-center text-xs flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Sistema</span>
              </button>
              <button
                onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(false)}
                className="w-full py-2.5 bg-[#6E4533] text-[#E7D5BE] font-bold rounded-xl text-center text-xs"
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
