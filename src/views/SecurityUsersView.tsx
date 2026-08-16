import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Key, 
  Lock, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Eye, 
  ShieldAlert, 
  Play, 
  RefreshCw, 
  XCircle,
  HelpCircle,
  Smartphone,
  Fingerprint,
  Building2,
  Sparkles,
  Shield,
  ArrowRight,
  Database,
  Layers
} from 'lucide-react';
import { AuthService } from '../services/authService';
import { AuthUser, EmployeePermissions, TemporarySupportGrant, SecurityTestResult, TenantInfo } from '../types';

export const SecurityUsersView: React.FC = () => {
  const currentUser = AuthService.getCurrentUser();
  const isOwner = currentUser?.role === 'PROPRIETARIO';

  const [activeTab, setActiveTab] = useState<'users' | 'sovereignty' | 'support_grants' | 'security_tests'>('users');
  
  // Users state
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Tenant / Sovereignty state
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(() => {
    return currentUser?.tenantId ? AuthService.getTenant(currentUser.tenantId) : null;
  });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferOwnerName, setTransferOwnerName] = useState('');
  const [transferOwnerEmail, setTransferOwnerEmail] = useState('');
  const [transferOwnerPhone, setTransferOwnerPhone] = useState('');
  const [transferPassword, setTransferPassword] = useState('');
  const [transferPin, setTransferPin] = useState('1234');
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  
  // User form state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<'PROPRIETARIO' | 'FUNCIONARIO'>('FUNCIONARIO');
  const [userPin, setUserPin] = useState('0000');
  const [permissions, setPermissions] = useState<EmployeePermissions>({
    vendas: true,
    producao: true,
    estoque: true,
    clientes: true,
    pedidos: true,
    entregas: true,
    produtos: true,
    financeiro: false,
    relatorios: false,
    auditoria: false,
    configuracoes: false
  });

  // Temporary Support Grant state
  const [supportGrants, setSupportGrants] = useState<TemporarySupportGrant[]>([]);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantReason, setGrantReason] = useState('Análise de lentidão em sincronização');
  const [grantDurationMinutes, setGrantDurationMinutes] = useState(60);
  const [grantScope, setGrantScope] = useState<TemporarySupportGrant['accessScope']>('LOGS_AVANCADOS');

  // Security Tests State
  const [testResults, setTestResults] = useState<SecurityTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const refreshUsers = () => {
    if (currentUser?.tenantId) {
      setUsers(AuthService.getUsers(currentUser.tenantId));
      setTenantInfo(AuthService.getTenant(currentUser.tenantId));
    }
  };

  const refreshGrants = () => {
    if (currentUser?.tenantId) {
      setSupportGrants(AuthService.getActiveSupportGrants(currentUser.tenantId));
    }
  };

  useEffect(() => {
    refreshUsers();
    refreshGrants();
  }, [currentUser]);

  const handleOpenNewUser = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPhone('');
    setUserRole('FUNCIONARIO');
    setUserPin('1234');
    setPermissions({
      vendas: true,
      producao: true,
      estoque: true,
      clientes: true,
      pedidos: true,
      entregas: true,
      produtos: true,
      financeiro: false,
      relatorios: false,
      auditoria: false,
      configuracoes: false
    });
    setShowUserModal(true);
  };

  const handleEditUser = (u: AuthUser) => {
    setEditingUserId(u.id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserPhone(u.phone || '');
    setUserRole(u.role === 'ADMIN_TECNICO' ? 'FUNCIONARIO' : u.role);
    setUserPin(u.pin || '1234');
    setPermissions({ ...u.permissions });
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const targetId = editingUserId || `usr-${Date.now()}`;
    const updatedUser: AuthUser = {
      id: targetId,
      name: userName.trim(),
      email: userEmail.trim().toLowerCase(),
      phone: userPhone.trim(),
      role: userRole,
      tenantId: currentUser.tenantId,
      companyName: currentUser.companyName,
      permissions: userRole === 'PROPRIETARIO' ? {
        vendas: true,
        producao: true,
        estoque: true,
        clientes: true,
        pedidos: true,
        entregas: true,
        produtos: true,
        financeiro: true,
        relatorios: true,
        auditoria: true,
        configuracoes: true
      } : permissions,
      pin: userPin,
      status: 'ativo',
      createdAt: new Date().toISOString()
    };

    AuthService.saveUser(updatedUser);
    setShowUserModal(false);
    refreshUsers();
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      alert('Você não pode excluir a sua própria conta ativa de proprietário.');
      return;
    }
    if (confirm('Tem certeza que deseja desativar/remover o acesso deste usuário?')) {
      AuthService.deleteUser(userId);
      refreshUsers();
    }
  };

  const handleCreateGrant = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      AuthService.createTemporarySupportGrant(grantReason, grantDurationMinutes, grantScope);
      setShowGrantModal(false);
      refreshGrants();
      alert('Acesso temporário concedido com sucesso! O desenvolvedor técnico agora pode consultar logs avançados até a expiração.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRevokeGrant = (grantId: string) => {
    if (confirm('Deseja revogar imediatamente este passe de acesso de suporte?')) {
      AuthService.revokeSupportGrant(grantId);
      refreshGrants();
    }
  };

  const handleRunSecuritySuite = async () => {
    setIsRunningTests(true);
    const results = await AuthService.runSecurityVerificationSuite();
    setTestResults(results);
    setIsRunningTests(false);
  };

  const handleTransferOwnership = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferMessage(null);

    if (!transferOwnerName.trim() || !transferOwnerEmail.trim()) {
      setTransferMessage('Informe o nome e e-mail do novo titular.');
      return;
    }

    if (transferPassword.length < 4) {
      setTransferMessage('A senha deve conter pelo menos 4 caracteres.');
      return;
    }

    const res = AuthService.completeOwnerHandover({
      tenantId: currentUser?.tenantId,
      companyName: currentUser?.companyName || 'Olaria',
      ownerName: transferOwnerName,
      ownerEmail: transferOwnerEmail,
      ownerPhone: transferOwnerPhone,
      password: transferPassword,
      pin: transferPin || '1234'
    });

    if (res.success && res.user) {
      setShowTransferModal(false);
      alert(`Titularidade transferida com sucesso para ${res.user.name}!\n\nA posse comercial foi atualizada com arquitetura Zero-Knowledge.`);
      window.location.reload();
    } else {
      setTransferMessage(res.message || 'Erro ao transferir titularidade.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-950 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-800" />
            <span>Segurança, Acessos & Privacidade</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Controle de usuários, permissões granulares por funcionário e isolamento comercial estrito
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleOpenNewUser}
            className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-950/10 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar Funcionário</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-200/80 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-amber-900 text-amber-950'
              : 'border-transparent text-stone-500 hover:text-amber-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipe & Permissões ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sovereignty')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'sovereignty'
              ? 'border-amber-900 text-amber-950'
              : 'border-transparent text-stone-500 hover:text-amber-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Soberania & Titularidade</span>
        </button>

        <button
          onClick={() => setActiveTab('support_grants')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'support_grants'
              ? 'border-amber-900 text-amber-950'
              : 'border-transparent text-stone-500 hover:text-amber-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Acesso Temporário p/ Suporte Técnico ({supportGrants.filter(g => g.status === 'ATIVO').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security_tests')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'security_tests'
              ? 'border-amber-900 text-amber-950'
              : 'border-transparent text-stone-500 hover:text-amber-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Verificador de Segurança</span>
        </button>
      </div>

      {/* TAB 1: USERS & PERMISSIONS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(u => (
              <div
                key={u.id}
                className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        u.role === 'PROPRIETARIO' 
                          ? 'bg-amber-900 text-amber-100' 
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {u.role === 'PROPRIETARIO' ? '👑 Proprietário' : '👷 Funcionário'}
                      </span>
                      <h3 className="text-base font-bold text-amber-950 mt-1.5">{u.name}</h3>
                      <p className="text-xs text-stone-500">{u.email}</p>
                      {u.phone && <p className="text-xs text-stone-500">{u.phone}</p>}
                    </div>

                    {isOwner && u.id !== currentUser?.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditUser(u)}
                          className="p-1.5 text-stone-400 hover:text-amber-900 rounded-lg hover:bg-amber-50"
                          title="Editar permissões"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg hover:bg-red-50"
                          title="Remover usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Permissions Chips */}
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <span className="text-[11px] font-bold text-stone-600 block mb-2">Permissões de Acesso:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {u.permissions?.vendas && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md">Vendas</span>
                      )}
                      {u.permissions?.producao && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-md">Produção</span>
                      )}
                      {u.permissions?.estoque && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md">Estoque</span>
                      )}
                      {u.permissions?.clientes && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[10px] font-bold rounded-md">Clientes</span>
                      )}
                      {u.permissions?.entregas && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 text-[10px] font-bold rounded-md">Entregas</span>
                      )}
                      {u.permissions?.financeiro ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-900 text-[10px] font-bold rounded-md">Financeiro (Liberado)</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-400 text-[10px] font-medium rounded-md line-through">Financeiro Bloqueado</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>PIN Rápido: <strong>{u.pin ? '••••' : 'Não definido'}</strong></span>
                  <span>Status: <strong className="text-emerald-700 capitalize">{u.status}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SOVEREIGNTY & HANDOVER (ZERO-KNOWLEDGE & SAAS ARCHITECTURE) */}
      {activeTab === 'sovereignty' && (
        <div className="space-y-6">
          {/* Main Status Hero */}
          <div className="bg-white border border-amber-300 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 pb-5">
              <div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Posse & Titularidade Entregues com Sucesso</span>
                </span>
                <h3 className="text-xl font-black text-amber-950">{currentUser?.companyName || 'Olaria do Zico'}</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Proprietário Titular Atual: <strong className="text-amber-900">{currentUser?.name}</strong> ({currentUser?.email})
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer shrink-0 flex items-center gap-2"
                >
                  <Key className="w-4 h-4 text-amber-300" />
                  <span>Transferir Titularidade</span>
                </button>
              )}
            </div>

            {/* 3 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pillar 1: Zero Knowledge */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-amber-950">Garantia Zero-Knowledge</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  O desenvolvedor <strong>nunca conhece a sua senha</strong> e nenhuma <em>senha mestra</em> existe capaz de acessar seus dados comerciais ou faturamento.
                </p>
              </div>

              {/* Pillar 2: Setup Purge */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5 text-amber-300" />
                </div>
                <h4 className="text-sm font-bold text-amber-950">Conta de Setup Destruída</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  A conta temporária utilizada na implantação foi <strong>permanentemente expurgada</strong> no seu primeiro acesso, garantindo posse 100% exclusiva.
                </p>
              </div>

              {/* Pillar 3: Multi-tenant SaaS */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5 text-blue-300" />
                </div>
                <h4 className="text-sm font-bold text-amber-950">Isolamento Multi-Tenant (SaaS)</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Tenant ID: <code className="text-xs font-mono font-bold text-amber-900">{currentUser?.tenantId}</code>. Seus clientes, vendas e caixa estão 100% blindados de outras empresas.
                </p>
              </div>
            </div>

            {/* Architecture Details Box */}
            <div className="bg-amber-950 text-amber-50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-black text-amber-200">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Arquitetura de Segurança da Entrega (Handover Protocol)</span>
              </div>
              <p className="text-xs text-amber-100/80 leading-relaxed">
                Este sistema foi concebido para que o cliente tenha soberania total. O desenvolvedor ou operador de suporte atua exclusivamente na camada de telemetria e manutenção de infraestrutura via conta técnica separada (<code className="font-mono text-amber-300">ADMIN_TECNICO</code>), necessitando de passe de acesso temporário explícito emitido por você para qualquer intervenção diagnóstica avançada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPORARY SUPPORT GRANTS */}
      {activeTab === 'support_grants' && (
        <div className="space-y-6">
          <div className="bg-amber-900/5 border border-amber-200/80 p-5 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-800" />
                  <span>Concessão de Acesso Temporário para Suporte Técnico</span>
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-2xl">
                  Se você precisar que a equipe de desenvolvimento/DevOps investigue um bug no sistema, gere uma autorização temporária com prazo de expiração automático.
                </p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setShowGrantModal(true)}
                  className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer shrink-0"
                >
                  Conceder Novo Acesso
                </button>
              )}
            </div>
          </div>

          {/* List of Grants */}
          <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-amber-900/10 text-amber-900 font-bold border-b border-amber-200">
                  <tr>
                    <th className="p-3.5">Data / Hora</th>
                    <th className="p-3.5">Autorizado Por</th>
                    <th className="p-3.5">Motivo Informado</th>
                    <th className="p-3.5">Escopo</th>
                    <th className="p-3.5">Expiração</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {supportGrants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-500">
                        Nenhuma autorização de suporte temporário ativa no momento.
                      </td>
                    </tr>
                  ) : (
                    supportGrants.map(grant => (
                      <tr key={grant.id} className="hover:bg-amber-50/40">
                        <td className="p-3.5 text-stone-600 whitespace-nowrap">
                          {new Date(grant.grantedAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3.5 font-bold text-amber-950">
                          {grant.grantedByUserName}
                        </td>
                        <td className="p-3.5 text-stone-800 max-w-xs">
                          {grant.reason}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-800 text-xs font-mono font-bold rounded">
                            {grant.accessScope}
                          </span>
                        </td>
                        <td className="p-3.5 text-stone-600 whitespace-nowrap">
                          {new Date(grant.expiresAt).toLocaleTimeString('pt-BR')}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            grant.status === 'ATIVO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {grant.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {grant.status === 'ATIVO' && isOwner && (
                            <button
                              onClick={() => handleRevokeGrant(grant.id)}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs transition-colors"
                            >
                              Revogar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE SECURITY SUITE */}
      {activeTab === 'security_tests' && (
        <div className="space-y-6">
          <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-800" />
                  <span>Auditoria e Verificação de Blindagem de Dados</span>
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Execute testes automatizados que comprovam que o desenvolvedor/admin técnico NÃO consegue acessar seus clientes, faturamento e vendas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunSecuritySuite}
                disabled={isRunningTests}
                className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Play className="w-4 h-4" />
                <span>{isRunningTests ? 'Executando...' : 'Verificar Blindagem Agora'}</span>
              </button>
            </div>

            {/* Test Results */}
            <div className="space-y-3 pt-2">
              {testResults.length === 0 ? (
                <div className="p-8 text-center text-stone-500 border border-dashed border-stone-200 rounded-xl">
                  Clique no botão acima para rodar o teste de conformidade de segurança e privacidade.
                </div>
              ) : (
                testResults.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-900 font-mono">#{idx + 1}</span>
                        <span className="font-bold text-stone-900 text-sm">{t.title}</span>
                      </div>
                      <p className="text-stone-600">{t.description}</p>
                      {t.details && (
                        <p className="text-[11px] text-stone-500 font-mono mt-1">&bull; {t.details}</p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {t.status === 'PASSED' ? (
                        <span className="px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold rounded-lg flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>BLINDADO (APROVADO)</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-red-100 border border-red-300 text-red-800 font-bold rounded-lg flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>FALHA DETECTADA</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-800" />
                <span>{editingUserId ? 'Editar Usuário da Olaria' : 'Cadastrar Novo Funcionário'}</span>
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: Carlos Ferreira"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:border-amber-700 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="carlos@olaria.com.br"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:border-amber-700 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:border-amber-700 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Perfil de Acesso</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm bg-white font-medium focus:border-amber-700 outline-hidden"
                  >
                    <option value="FUNCIONARIO">Funcionário Operacional</option>
                    <option value="PROPRIETARIO">Proprietário (Acesso Total)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">PIN de Acesso Rápido (4 dígitos)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={userPin}
                    onChange={(e) => setUserPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm font-mono focus:border-amber-700 outline-hidden"
                  />
                </div>
              </div>

              {userRole === 'FUNCIONARIO' && (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <span className="text-xs font-bold text-stone-800 block">Permissões Específicas do Funcionário:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.vendas}
                        onChange={(e) => setPermissions({ ...permissions, vendas: e.target.checked })}
                        className="rounded text-amber-800 focus:ring-amber-500"
                      />
                      <span>Registrar Vendas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.producao}
                        onChange={(e) => setPermissions({ ...permissions, producao: e.target.checked })}
                        className="rounded text-amber-800 focus:ring-amber-500"
                      />
                      <span>Lotes de Produção</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.estoque}
                        onChange={(e) => setPermissions({ ...permissions, estoque: e.target.checked })}
                        className="rounded text-amber-800 focus:ring-amber-500"
                      />
                      <span>Consultar Estoque</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.clientes}
                        onChange={(e) => setPermissions({ ...permissions, clientes: e.target.checked })}
                        className="rounded text-amber-800 focus:ring-amber-500"
                      />
                      <span>Cadastro de Clientes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.pedidos}
                        onChange={(e) => setPermissions({ ...permissions, pedidos: e.target.checked })}
                        className="rounded text-amber-800 focus:ring-amber-500"
                      />
                      <span>Sob Encomenda</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.entregas}
                        onChange={(e) => setPermissions({ ...permissions, entregas: e.target.checked })}
                        className="rounded text-amber-800 focus:ring-amber-500"
                      />
                      <span>Entregas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-red-900 col-span-2 pt-1 border-t border-stone-200">
                      <input
                        type="checkbox"
                        checked={permissions.financeiro}
                        onChange={(e) => setPermissions({ ...permissions, financeiro: e.target.checked })}
                        className="rounded text-red-800 focus:ring-red-500"
                      />
                      <span>Acesso a Dados Financeiros (Despesas, Recebíveis & Faturamento)</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-800" />
                <span>Autorizar Suporte Técnico Temporário</span>
              </h3>
              <button
                onClick={() => setShowGrantModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateGrant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Motivo do Suporte</label>
                <input
                  type="text"
                  required
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Ex: Diagnóstico de erro na sincronização"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:border-amber-700 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Duração da Autorização</label>
                <select
                  value={grantDurationMinutes}
                  onChange={(e) => setGrantDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm bg-white font-medium focus:border-amber-700 outline-hidden"
                >
                  <option value={30}>30 Minutos (Recomendado)</option>
                  <option value={60}>1 Hora</option>
                  <option value={120}>2 Horas</option>
                  <option value={1440}>24 Horas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Escopo Técnico Permitido</label>
                <select
                  value={grantScope}
                  onChange={(e) => setGrantScope(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm bg-white font-medium focus:border-amber-700 outline-hidden"
                >
                  <option value="LOGS_AVANCADOS">Logs Técnicos Avançados (Sem PII)</option>
                  <option value="ESTRUTURA_DADOS">Verificação de Integridade de Schema</option>
                  <option value="TESTE_SISTEMA">Teste Completo de Rotinas</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                Esta permissão expira automaticamente e não permite ao técnico ler dados comerciais sensíveis.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Emitir Autorização
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-amber-300 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-900 text-amber-100 flex items-center justify-center shadow-md">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-amber-950">Passagem de Titularidade</h3>
                  <p className="text-xs text-amber-800 font-medium">Transferir a posse da olaria para um novo proprietário</p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
              <strong className="block mb-1">Aviso Importante:</strong>
              Esta operação transfere o controle soberano desta olaria para o novo titular cadastrado. O desenvolvedor continua sem acesso à senha.
            </div>

            {transferMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-medium">
                {transferMessage}
              </div>
            )}

            <form onSubmit={handleTransferOwnership} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome Completo do Novo Titular</label>
                <input
                  type="text"
                  required
                  value={transferOwnerName}
                  onChange={(e) => setTransferOwnerName(e.target.value)}
                  placeholder="Ex: Roberto Zico Filho"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:ring-2 focus:ring-amber-300 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">E-mail do Novo Titular</label>
                  <input
                    type="email"
                    required
                    value={transferOwnerEmail}
                    onChange={(e) => setTransferOwnerEmail(e.target.value)}
                    placeholder="novo.proprietario@olaria.com.br"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:ring-2 focus:ring-amber-300 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={transferOwnerPhone}
                    onChange={(e) => setTransferOwnerPhone(e.target.value)}
                    placeholder="(11) 98888-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:ring-2 focus:ring-amber-300 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nova Senha Privada</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={transferPassword}
                    onChange={(e) => setTransferPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:ring-2 focus:ring-amber-300 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Novo PIN (4 dígitos)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={transferPin}
                    onChange={(e) => setTransferPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-bold text-center tracking-widest focus:ring-2 focus:ring-amber-300 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Confirmar & Transferir</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
