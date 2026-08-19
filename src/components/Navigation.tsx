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
  ShieldCheck, 
  Palette, 
  Sparkles,
  LogOut,
  UserCheck,
  X
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

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  ownerOnly?: boolean;
  requiredPermission?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  setActiveView,
  isMobileDrawerOpen,
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
      title: 'Inteligência & Operação',
      items: [
        { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
        { id: 'assistente-ia', label: 'Assistente IA', icon: Sparkles, badge: 'IA' },
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
        { id: 'brandkit', label: 'Manual de Identidade', icon: Palette },
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
    { id: 'assistente-ia', label: 'Assistente IA', icon: Sparkles },
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
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-[#8A5A44] dark:bg-[#252320] text-[#F7F1E7] dark:text-[#F2EBDD] border-r border-[#6E4533] dark:border-[#3D3833] p-4 shrink-0 min-h-[calc(100vh-4.5rem)] rounded-2xl shadow-md my-2 transition-colors font-brand-sans" aria-label="Navegação Principal Desktop">
        <div className="space-y-6">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E7D5BE] dark:text-[#D4BEA2] px-3 font-brand-sans">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectView(item.id)}
                      aria-label={`Navegar para módulo ${item.label}`}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer font-brand-sans focus-visible:outline-2 focus-visible:outline-[#FAF6EF] ${
                        isActive
                          ? 'bg-[#B85C38] text-white shadow-sm translate-x-1'
                          : 'text-[#E7D5BE] hover:bg-[#6E4533] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#E7D5BE]'}`} />
                        <span className="text-sm sm:text-base">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
        <div className="pt-4 border-t border-[#6E4533] dark:border-[#3D3833] mt-4 font-brand-sans">
          <div className="p-3.5 bg-[#6E4533]/80 dark:bg-[#1E1C1A] rounded-xl border border-[#A7735B]/40 dark:border-stone-700 mb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#B85C38] flex items-center justify-center text-white font-bold text-sm shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#F7F1E7] truncate">
                  {currentUser?.name || 'Oleiro'}
                </p>
                <p className="text-xs text-[#E7D5BE] dark:text-[#C9BFA8] font-semibold truncate">
                  {currentUser?.role === 'PROPRIETARIO' ? '👑 Proprietário' : '👷 Operacional'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogoutClick}
            aria-label="Sair do sistema de gestão"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#6E4533] hover:bg-rose-900 text-[#FAF6EF] hover:text-white text-sm font-bold transition-colors cursor-pointer border border-[#A7735B]/40 hover:border-rose-700/60 focus-visible:outline-2 focus-visible:outline-[#FAF6EF]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Todos os Módulos) */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex font-brand-sans">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-sm bg-[#8A5A44] dark:bg-[#252320] text-[#F7F1E7] dark:text-[#F2EBDD] flex flex-col justify-between p-5 shadow-2xl overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#6E4533] dark:border-[#3D3833] mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-brand-serif font-black text-lg uppercase text-[#F7F1E7]">
                    Menu de Módulos
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen && setIsMobileDrawerOpen(false)}
                  className="p-2 rounded-xl bg-[#6E4533] hover:bg-[#5C3829] text-[#E7D5BE] hover:text-white transition-colors"
                  aria-label="Fechar menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Groups inside Drawer */}
              <div className="space-y-5">
                {NAV_GROUPS.map((group, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#E7D5BE] dark:text-[#D4BEA2] px-3">
                      {group.title}
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectView(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#B85C38] text-white shadow-sm'
                                : 'text-[#E7D5BE] hover:bg-[#6E4533] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#E7D5BE]'}`} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge !== undefined && (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
            </div>

            {/* User & Logout in Drawer Bottom */}
            <div className="pt-4 border-t border-[#6E4533] mt-6">
              <div className="p-3.5 bg-[#6E4533]/80 rounded-xl border border-[#A7735B]/40 mb-3">
                <p className="text-sm font-bold text-[#F7F1E7] truncate">
                  {currentUser?.name || 'Oleiro'}
                </p>
                <p className="text-xs text-[#E7D5BE] font-semibold truncate">
                  {currentUser?.role === 'PROPRIETARIO' ? '👑 Proprietário' : '👷 Operacional'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#6E4533] hover:bg-rose-900 text-[#FAF6EF] text-sm font-bold transition-colors cursor-pointer border border-[#A7735B]/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair do Sistema</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#8A5A44] dark:bg-[#252320] border-t border-[#6E4533] dark:border-[#3D3833] z-30 px-3 py-2 shadow-2xl transition-colors font-brand-sans" aria-label="Navegação Mobile Inferior">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {PRIMARY_MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectView(item.id)}
                aria-label={`Acessar ${item.label}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FAF6EF] ${
                  isActive
                    ? 'text-[#FAF6EF] bg-[#6E4533] dark:bg-[#C66B48] scale-105 shadow-xs'
                    : 'text-[#E7D5BE] dark:text-[#C9BFA8] hover:text-white dark:hover:text-[#F2EBDD]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#FAF6EF]' : 'text-[#E7D5BE] dark:text-[#C9BFA8]'}`} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
