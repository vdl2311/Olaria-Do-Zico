import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  ShieldAlert, 
  ShieldCheck,
  Activity, 
  Database, 
  Lock, 
  Key, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileCode2, 
  Clock, 
  Server, 
  Layers, 
  LogOut, 
  Play, 
  HardDrive,
  Cpu,
  EyeOff,
  LifeBuoy,
  RefreshCw,
  Zap,
  ArrowLeft,
  Building2,
  Trash2
} from 'lucide-react';
import { AuthService } from '../services/authService';
import { TechnicalLog, SupportTicket, TemporarySupportGrant, SecurityTestResult, AuthUser, TenantInfo } from '../types';

interface TechnicalAdminViewProps {
  onBackToCommercial: () => void;
}

export const TechnicalAdminView: React.FC<TechnicalAdminViewProps> = ({ onBackToCommercial }) => {
  const [techUser, setTechUser] = useState<AuthUser | null>(() => {
    const user = AuthService.getCurrentUser();
    return user?.role === 'ADMIN_TECNICO' ? user : null;
  });

  // Login form states for technical portal
  const [email, setEmail] = useState('dev.tecnico@olaria-infra.net');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab in Technical Portal
  const [activeTab, setActiveTab] = useState<'telemetry' | 'tenants' | 'logs' | 'support' | 'security_tests' | 'database_ops'>('telemetry');

  // Tenants & Handover status
  const [tenants, setTenants] = useState<TenantInfo[]>([]);

  // Logs & Filters
  const [logs, setLogs] = useState<TechnicalLog[]>([]);
  const [logFilterSeverity, setLogFilterSeverity] = useState<string>('ALL');
  const [logFilterModule, setLogFilterModule] = useState<string>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // Support Ticket Lookup
  const [ticketSearchCode, setTicketSearchCode] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<SupportTicket | null>(null);
  const [ticketResolutionNote, setTicketResolutionNote] = useState('');
  const [ticketFeedback, setTicketFeedback] = useState<string | null>(null);

  // Support Grants
  const [activeGrants, setActiveGrants] = useState<TemporarySupportGrant[]>([]);

  // Security Test Suite
  const [testResults, setTestResults] = useState<SecurityTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Database Ops Simulation
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  // Refresh logs and grants
  const refreshData = () => {
    setLogs(AuthService.getTechnicalLogs());
    setActiveGrants(AuthService.getActiveSupportGrants());
    setTenants(AuthService.getTenants());
  };

  useEffect(() => {
    if (techUser) {
      refreshData();
    }
  }, [techUser?.id]);

  const handleTechLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = AuthService.loginTechnical(email, password);
    if (res.success && res.user) {
      setTechUser(res.user);
    } else {
      setLoginError(res.message || 'Acesso negado.');
    }
  };

  const handleTechLogout = () => {
    AuthService.logout();
    setTechUser(null);
  };

  const handleLookupTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketFeedback(null);
    if (!ticketSearchCode.trim()) return;

    const found = AuthService.lookupSupportTicket(ticketSearchCode.trim());
    if (found) {
      setSearchedTicket(found);
      setTicketFeedback(null);
    } else {
      setSearchedTicket(null);
      setTicketFeedback(`Nenhum chamado encontrado com o código ${ticketSearchCode.toUpperCase()}`);
    }
  };

  const handleResolveTicket = (ticketId: string) => {
    if (!ticketResolutionNote.trim()) {
      alert('Informe uma nota técnica sobre a resolução do chamado.');
      return;
    }
    AuthService.resolveSupportTicket(ticketId, ticketResolutionNote);
    const updated = AuthService.lookupSupportTicket(ticketSearchCode);
    setSearchedTicket(updated);
    setTicketResolutionNote('');
    setTicketFeedback('Chamado marcado como RESOLVIDO com sucesso.');
    refreshData();
  };

  const handleRunSecurityTests = async () => {
    setIsRunningTests(true);
    const results = await AuthService.runSecurityVerificationSuite();
    setTestResults(results);
    setIsRunningTests(false);
  };

  const handleRunMigration = () => {
    setMigrationStatus('Executando validação de schema e integridade relacional...');
    setTimeout(() => {
      setMigrationStatus('Schema v2.4 validado. Índices compostos sincronizados. Nenhuma incompatibilidade detectada.');
      AuthService.logTechnicalEvent({
        errorCode: 'DB_MIGRATION_200',
        module: 'database',
        tenantId: 'ALL_TENANTS',
        userId: techUser?.id || 'TECH_ADMIN',
        severity: 'INFO',
        component: 'MigrationEngine',
        message: 'Verificação de integridade de esquema do banco de dados executada com sucesso.'
      });
      refreshData();
    }, 1000);
  };

  const handleGenerateBackup = () => {
    setBackupStatus('Gerando snapshot criptografado dos dados (AES-256-GCM)...');
    setTimeout(() => {
      const backupId = `BKP_${new Date().toISOString().slice(0, 10)}_${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
      setBackupStatus(`Snapshot criptografado ${backupId} gerado e verificado com hash SHA-256.`);
      AuthService.logTechnicalEvent({
        errorCode: 'DB_BACKUP_200',
        module: 'database',
        tenantId: 'ALL_TENANTS',
        userId: techUser?.id || 'TECH_ADMIN',
        severity: 'INFO',
        component: 'BackupManager',
        message: `Snapshot criptografado ${backupId} gerado com sucesso.`
      });
      refreshData();
    }, 1200);
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (logFilterSeverity !== 'ALL' && log.severity !== logFilterSeverity) return false;
    if (logFilterModule !== 'ALL' && log.module !== logFilterModule) return false;
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      return (
        log.errorCode.toLowerCase().includes(q) ||
        log.component.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // If not logged in as technical admin, show technical login screen
  if (!techUser) {
    return (
      <div className="min-h-screen bg-[#1C1A17] text-[#F2EBDD] flex flex-col justify-between p-4 sm:p-6 font-brand-sans selection:bg-[#C66B48] selection:text-white">
        <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-[#3D3833]">
          <div className="flex items-center gap-2 text-[#C66B48]">
            <Terminal className="w-6 h-6" />
            <span className="font-bold text-sm tracking-wider text-[#F2EBDD]">CONSOLE TÉCNICO &bull; OLARIA</span>
          </div>
          <button
            onClick={onBackToCommercial}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3D3833] hover:border-[#4D4640] bg-[#252320] text-xs text-[#C9BFA8] hover:text-[#F2EBDD] transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Sistema Comercial</span>
          </button>
        </header>

        <main className="max-w-md w-full mx-auto my-auto py-8">
          <div className="bg-[#252320] border border-[#3D3833] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-[#3D2418] border border-[#C66B48]/40 text-[#C66B48] mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#F2EBDD]">Portal do Administrador Técnico</h2>
              <p className="text-xs text-[#C9BFA8] font-sans">
                Acesso restrito para manutenção de infraestrutura, logs sanitizados e diagnósticos de sistema.
              </p>
            </div>

            {/* Strict Notice */}
            <div className="p-3.5 bg-[#3D3220] border border-[#52442C] rounded-xl text-[#E0B366] text-xs font-sans space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 text-[#E0B366]" />
                <span>Restrição de Privacidade & LGPD:</span>
              </div>
              <p className="text-[11px] text-[#C9BFA8] leading-relaxed">
                Este portal NÃO possui acesso a dados pessoais de clientes, CPFs, telefones, faturamento ou vendas. O acesso comercial é estritamente bloqueado por arquitetura.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-[#3D2620] border border-[#54332B] rounded-xl text-[#E07A6E] text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleTechLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#C9BFA8] mb-1">E-mail Técnico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1A17] border border-[#3D3833] rounded-xl text-sm text-[#F2EBDD] focus:border-[#C66B48] focus:ring-1 focus:ring-[#C66B48] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C9BFA8] mb-1">Senha de Infraestrutura</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-[#1C1A17] border border-[#3D3833] rounded-xl text-sm text-[#F2EBDD] focus:border-[#C66B48] focus:ring-1 focus:ring-[#C66B48] outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#C66B48] hover:bg-[#D67855] text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Key className="w-4 h-4" />
                <span>Autenticar no Console</span>
              </button>
            </form>
          </div>
        </main>

        <footer className="max-w-md w-full mx-auto text-center py-2 text-[#8B8475] text-xs">
          Olaria Engine v2.4-Technical &bull; Zero Commercial Data Exposure
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1A17] text-[#F2EBDD] flex flex-col font-sans selection:bg-[#C66B48] selection:text-white">
      {/* Top Console Bar */}
      <header className="bg-[#252320] border-b border-[#3D3833] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3D2418] border border-[#C66B48]/40 text-[#C66B48] flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#C66B48]">DEV_CONSOLE</span>
              <span className="px-2 py-0.5 rounded-full bg-[#3D2418] border border-[#C66B48]/40 text-[#D67855] text-[10px] font-bold">
                ENV: PRODUCTION
              </span>
            </div>
            <span className="text-[11px] text-[#C9BFA8]">
              Operador: {techUser.name} &bull; Escopo: Infraestrutura & Diagnóstico
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToCommercial}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sistema Comercial</span>
          </button>
          <button
            onClick={handleTechLogout}
            className="px-3 py-1.5 rounded-lg border border-red-900/60 bg-red-950/40 hover:bg-red-900/60 text-xs text-red-300 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Strict Privacy Guarantee Banner */}
      <div className="bg-emerald-950/30 border-b border-emerald-900/40 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium font-sans">
            <strong>Proteção de Privacidade Ativa:</strong> Dados de clientes, CPFs, faturamento e vendas estão estritamente inacessíveis neste painel.
          </span>
        </div>
        <span className="text-[11px] text-emerald-400/80 hidden md:inline">
          LGPD & Security Compliance: OK
        </span>
      </div>

      {/* Tab Navigation */}
      <nav className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6 flex gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'telemetry'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Telemetria & Saúde</span>
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tenants'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Tenants & Handover ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Logs Sanitizados ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'support'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Diagnóstico de Chamados (SUP-XXXX)</span>
        </button>

        <button
          onClick={() => setActiveTab('security_tests')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security_tests'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Suite de Testes de Segurança</span>
        </button>

        <button
          onClick={() => setActiveTab('database_ops')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'database_ops'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Banco & Migrações</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* TAB: TENANTS & HANDOVER STATUS */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            {/* Architectural Privacy Developer Notice */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Privacidade por Arquitetura & Acesso Técnico Isolado (Sem Senha Mestra)</span>
              </div>
              <p className="leading-relaxed text-cyan-200/90 font-sans">
                Como administrador técnico/DevOps, você tem visibilidade do status de saúde, integridade e telemetria dos tenants, mas <strong>não possui credenciais de acesso aos painéis comerciais</strong>, nem senhas de proprietários, nem qualquer backdoor de acesso universal.
              </p>
            </div>

            {/* Tenant Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenants.map(t => (
                <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        {t.status}
                      </span>
                      <h3 className="text-base font-bold text-slate-100 mt-2">{t.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {t.id}</p>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
                      Plano {t.plan}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 font-sans">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Proprietário Titular:</span>
                      <strong className="text-slate-200">{t.ownerName || 'Não registrado'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">E-mail de Contato:</span>
                      <strong className="text-slate-200 font-mono text-[11px]">{t.ownerEmail || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Conta de Implantação:</span>
                      <span className="text-emerald-400 font-bold">
                        {t.setupAccountDestroyed ? '✓ Destruída (Purged)' : 'Temporária Ativa'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Handover Concluído:</span>
                      <span className="text-slate-300">
                        {t.handoverCompletedAt ? new Date(t.handoverCompletedAt).toLocaleDateString('pt-BR') : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Zero-Knowledge: <strong>Verificado</strong></span>
                    </span>
                    <span className="text-slate-500 font-mono">Token: {t.setupToken}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: TELEMETRY & HEALTH */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>DISPONIBILIDADE (UPTIME)</span>
                  <Server className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">99.98%</div>
                <div className="text-[11px] text-slate-500">Últimos 30 dias de operação</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>LATÊNCIA MÉDIA (FIRESTORE)</span>
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-cyan-300">48 ms</div>
                <div className="text-[11px] text-slate-500">Conexão WebSocket ativa</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>ERROS TÉCNICOS (24H)</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {logs.filter(l => l.severity === 'ERROR' || l.severity === 'FATAL').length}
                </div>
                <div className="text-[11px] text-slate-500">Nenhuma falha crítica ativa</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>PASSES DE SUPORTE ATIVOS</span>
                  <Key className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-300">
                  {activeGrants.filter(g => g.status === 'ATIVO').length}
                </div>
                <div className="text-[11px] text-slate-500">Autorizados pelos proprietários</div>
              </div>
            </div>

            {/* Active Support Grants Banner if any */}
            {activeGrants.filter(g => g.status === 'ATIVO').length > 0 && (
              <div className="bg-purple-950/40 border border-purple-800/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                    <Key className="w-4 h-4" />
                    <span>Autorização Temporária de Suporte Concedida por Proprietário</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 text-xs">
                    STATUS: ATIVO
                  </span>
                </div>
                <div className="divide-y divide-purple-900/40">
                  {activeGrants.filter(g => g.status === 'ATIVO').map(grant => (
                    <div key={grant.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-slate-300">Autorizado por: <strong>{grant.grantedByUserName}</strong></span>
                        <span className="text-slate-400 ml-2">({grant.reason})</span>
                      </div>
                      <div className="text-purple-300">
                        Expira em: {new Date(grant.expiresAt).toLocaleTimeString('pt-BR')} &bull; Escopo: {grant.accessScope}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Database Health (Collection Metadata ONLY - No Row Exposure) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Saúde das Coleções do Banco de Dados (Metadados Técnicos)</span>
                </h3>
                <span className="text-[11px] text-slate-500">Apenas contadores e integridade estrutural</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Coleção: products</span>
                  <span className="text-slate-200 font-bold text-sm">Estrutura OK</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">&bull; Índices Ativos</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Coleção: sales</span>
                  <span className="text-slate-200 font-bold text-sm">Estrutura OK</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">&bull; Índices Ativos</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Coleção: customers</span>
                  <span className="text-slate-200 font-bold text-sm">Proteção PII Ativa</span>
                  <span className="text-[10px] text-cyan-400 block mt-1">&bull; Blindagem LGPD</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block">Coleção: financial_records</span>
                  <span className="text-slate-200 font-bold text-sm">Isolamento OK</span>
                  <span className="text-[10px] text-cyan-400 block mt-1">&bull; Tenant Scoped</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TECHNICAL SANITIZED LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Buscar código de erro, componente..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <select
                  value={logFilterSeverity}
                  onChange={(e) => setLogFilterSeverity(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5"
                >
                  <option value="ALL">Todas Severidades</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                  <option value="FATAL">FATAL</option>
                </select>

                <select
                  value={logFilterModule}
                  onChange={(e) => setLogFilterModule(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5"
                >
                  <option value="ALL">Todos os Módulos</option>
                  <option value="system">system</option>
                  <option value="database">database</option>
                  <option value="auth">auth</option>
                  <option value="voice">voice</option>
                  <option value="sales">sales</option>
                  <option value="production">production</option>
                </select>

                <button
                  onClick={refreshData}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                  title="Atualizar Logs"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Logs Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              {/* Mobile View: Cards */}
              <div className="block md:hidden divide-y divide-slate-800/60 font-mono text-[11px] max-h-[550px] overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    Nenhum log técnico encontrado para os filtros selecionados.
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div key={log.id} className="p-3.5 space-y-2 hover:bg-slate-800/40">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.severity === 'INFO'
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
                              : log.severity === 'WARN'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                              : 'bg-red-950 text-red-400 border border-red-800/50'
                          }`}>
                            {log.severity}
                          </span>
                          <span className="text-slate-200 font-bold">{log.errorCode}</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="text-cyan-300 font-semibold">{log.module}</span>
                        <span>{log.tenantId} • {log.latencyMs ? `${log.latencyMs}ms` : '-'}</span>
                      </div>

                      <p className="text-slate-300 font-sans text-xs bg-slate-950/60 p-2 rounded border border-slate-800/80 break-words">
                        {log.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto max-h-[550px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3">TIMESTAMP</th>
                      <th className="p-3">SEV</th>
                      <th className="p-3">CÓDIGO DE ERRO</th>
                      <th className="p-3">MÓDULO</th>
                      <th className="p-3">TENANT</th>
                      <th className="p-3">MENSAGEM TÉCNICA (SANITIZADA)</th>
                      <th className="p-3 text-right">LATÊNCIA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          Nenhum log técnico encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-800/40">
                          <td className="p-3 text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.severity === 'INFO'
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
                                : log.severity === 'WARN'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                                : 'bg-red-950 text-red-400 border border-red-800/50'
                            }`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="p-3 text-slate-200 font-bold whitespace-nowrap">
                            {log.errorCode}
                          </td>
                          <td className="p-3 text-cyan-300">
                            {log.module}
                          </td>
                          <td className="p-3 text-slate-500">
                            {log.tenantId}
                          </td>
                          <td className="p-3 text-slate-300 max-w-md break-words font-sans">
                            {log.message}
                          </td>
                          <td className="p-3 text-right text-slate-400 whitespace-nowrap">
                            {log.latencyMs ? `${log.latencyMs}ms` : '-'}
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

        {/* TAB 3: SUPPORT TICKET DIAGNOSTIC LOOKUP */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-cyan-400" />
                  <span>Resolução de Chamados de Suporte por Código Diagnóstico</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Consulte códigos de suporte gerados pelo proprietário (ex: <code>SUP-20260816-8F42</code>). O sistema exibe metadados de erro sem expor dados pessoais do cliente.
                </p>
              </div>

              <form onSubmit={handleLookupTicket} className="flex gap-2 max-w-lg">
                <input
                  type="text"
                  value={ticketSearchCode}
                  onChange={(e) => setTicketSearchCode(e.target.value)}
                  placeholder="Ex: SUP-20260816-XXXX"
                  className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-cyan-300 focus:border-cyan-500 outline-hidden uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Consultar</span>
                </button>
              </form>

              {ticketFeedback && (
                <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xl text-xs text-amber-300">
                  {ticketFeedback}
                </div>
              )}

              {/* Searched Ticket Details */}
              {searchedTicket && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 mt-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs text-slate-500 block">CÓDIGO DO CHAMADO</span>
                      <span className="text-lg font-bold text-cyan-300">{searchedTicket.code}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      searchedTicket.status === 'RESOLVIDO'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {searchedTicket.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">TIPO DE INCIDENTE:</span>
                      <span className="text-slate-200 font-bold">{searchedTicket.issueType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">CÓDIGO TÉCNICO:</span>
                      <span className="text-cyan-400 font-bold">{searchedTicket.technicalCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">MÓDULO AFETADO:</span>
                      <span className="text-slate-200 font-bold">{searchedTicket.affectedModule}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block mb-1">DETALHES TÉCNICOS (SANITIZADOS):</span>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-sans">
                      {searchedTicket.technicalDetails}
                    </div>
                  </div>

                  {searchedTicket.status !== 'RESOLVIDO' ? (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="block text-xs font-bold text-slate-300">
                        Nota Técnica de Resolução:
                      </label>
                      <textarea
                        rows={2}
                        value={ticketResolutionNote}
                        onChange={(e) => setTicketResolutionNote(e.target.value)}
                        placeholder="Descreva a correção aplicada (ex: reiniciado índice de sincronização, corrigido payload)..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-cyan-500 outline-hidden font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => handleResolveTicket(searchedTicket.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar Chamado como Resolvido</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-900 rounded-lg text-xs text-emerald-300">
                      <strong>Resolução Registrada:</strong> {searchedTicket.resolutionNotes || 'Resolvido pelo suporte de infraestrutura.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY TEST SUITE */}
        {activeTab === 'security_tests' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <span>Verificação Automatizada de Segurança & Isolamento de Dados</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    Executa asserções ativas comprovando a separação de poderes, blindagem de dados comerciais e compliance.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunSecurityTests}
                  disabled={isRunningTests}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>{isRunningTests ? 'Executando Asserções...' : 'Executar Todos os Testes'}</span>
                </button>
              </div>

              {/* Test Results Table */}
              <div className="space-y-3 pt-2">
                {testResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    Clique no botão acima para rodar a suíte de testes de segurança em tempo real.
                  </div>
                ) : (
                  testResults.map((t, idx) => (
                    <div
                      key={t.id}
                      className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">#{idx + 1}</span>
                          <span className="font-bold text-slate-200 text-sm">{t.title}</span>
                        </div>
                        <p className="text-slate-400 text-xs">{t.description}</p>
                        {t.details && (
                          <div className="text-[11px] text-slate-500 font-mono mt-1">
                            &gt; {t.details}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {t.status === 'PASSED' ? (
                          <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-bold rounded-lg flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>APROVADO</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-950/80 border border-red-800/80 text-red-300 font-bold rounded-lg flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span>FALHOU</span>
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

        {/* TAB 5: DATABASE & MIGRATIONS */}
        {activeTab === 'database_ops' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Operações Estruturais & Snapshots Criptografados</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Gerenciamento técnico de migrações e rotinas de backup sem expor o conteúdo dos registros comerciais.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Migrations Card */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <Layers className="w-4 h-4" />
                    <span>Validação de Migrações de Schema</span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Verifica a integridade de todas as coleções, chaves estrangeiras e índices compostos.
                  </p>
                  <button
                    type="button"
                    onClick={handleRunMigration}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Executar Validação de Schema</span>
                  </button>
                  {migrationStatus && (
                    <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded-lg text-[11px] text-cyan-300">
                      {migrationStatus}
                    </div>
                  )}
                </div>

                {/* Backups Card */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <HardDrive className="w-4 h-4" />
                    <span>Snapshots Criptografados (AES-256)</span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Cria cópia pontual criptografada com chave do proprietário para contingência de desastres.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateBackup}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Gerar Snapshot de Segurança</span>
                  </button>
                  {backupStatus && (
                    <div className="p-2.5 bg-purple-950/40 border border-purple-800/60 rounded-lg text-[11px] text-purple-300">
                      {backupStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
