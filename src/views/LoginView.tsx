import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Fingerprint, 
  Flame, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  User,
  Smartphone, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Building2, 
  CheckCircle2,
  Layers,
  ArrowLeft,
  Wrench,
  KeyRound,
  Database
} from 'lucide-react';
import { AuthService } from '../services/authService';
import { AuthUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  onNavigateToTechnical: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigateToTechnical }) => {
  // Mode: 'production' (default) vs 'demo' (sandbox evaluation)
  const [activeTab, setActiveTab] = useState<'production' | 'demo'>('production');

  // Alternative fast-auth: 'none' (password), 'pin', or 'biometric'
  const [authMethod, setAuthMethod] = useState<'none' | 'pin' | 'biometric'>('none');

  // Credentials
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // PIN
  const [pinDigits, setPinDigits] = useState<string>('');

  // Biometrics
  const [isBioScanning, setIsBioScanning] = useState(false);

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Handover / First Access Modal
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverCompanyName, setHandoverCompanyName] = useState('Olaria do Zico');
  const [handoverOwnerName, setHandoverOwnerName] = useState('');
  const [handoverOwnerEmail, setHandoverOwnerEmail] = useState('');
  const [handoverOwnerPhone, setHandoverOwnerPhone] = useState('');
  const [handoverPassword, setHandoverPassword] = useState('');
  const [handoverPin, setHandoverPin] = useState('1234');
  const [handoverSetupToken, setHandoverSetupToken] = useState('SETUP-OLARIA-2026-ZICO');
  const [handoverError, setHandoverError] = useState<string | null>(null);

  // Technical Auth Modal (Separate authentication challenge)
  const [showTechModal, setShowTechModal] = useState(false);
  const [techEmail, setTechEmail] = useState('dev.tecnico@olaria-infra.net');
  const [techPassword, setTechPassword] = useState('');
  const [techError, setTechError] = useState<string | null>(null);

  // 1. Password Login
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Informe seu e-mail/celular e senha.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = AuthService.login(identifier, password, rememberMe);
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    }, 350);
  };

  // 2. Google Login (Continuar com Google)
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.loginWithGoogle();
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Falha ao autenticar com a Conta Google.');
      }
    } catch (e: any) {
      setIsLoading(false);
      setErrorMessage('Erro de conexão com o Google: ' + (e.message || 'Tente novamente.'));
    }
  };

  // 3. Quick PIN
  const handlePinInput = (digit: string) => {
    if (pinDigits.length < 4) {
      const newPin = pinDigits + digit;
      setPinDigits(newPin);

      if (newPin.length === 4) {
        setErrorMessage(null);
        setIsLoading(true);
        setTimeout(() => {
          const res = AuthService.loginWithPin(newPin);
          setIsLoading(false);
          if (res.success && res.user) {
            onLoginSuccess(res.user);
          } else {
            setErrorMessage(res.message || 'PIN incorreto.');
            setPinDigits('');
          }
        }, 300);
      }
    }
  };

  const handlePinBackspace = () => {
    setPinDigits(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  // 4. Biometric
  const handleBiometricLogin = async () => {
    setErrorMessage(null);
    setIsBioScanning(true);

    try {
      const res = await AuthService.loginWithBiometrics();
      setIsBioScanning(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Biometria não reconhecida.');
      }
    } catch (e: any) {
      setIsBioScanning(false);
      setErrorMessage('Erro no sensor biométrico: ' + (e.message || 'Falha na leitura'));
    }
  };

  // 5. Demo Sandbox Login (100% isolated fictitious dataset)
  const handleDemoLogin = (role: 'PROPRIETARIO' | 'FUNCIONARIO') => {
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const res = AuthService.loginDemo(role);
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage('Erro ao inicializar ambiente sandbox de demonstração.');
      }
    }, 300);
  };

  // 6. Password Reset Flow
  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const res = AuthService.requestPasswordReset(resetIdentifier || identifier);
    if (res.success && res.resetToken) {
      setResetToken(res.resetToken);
      setResetStep('confirm');
      setResetSuccessMessage(res.message);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AuthService.resetPasswordWithToken(resetToken, newPassword);
    if (res.success) {
      setShowResetModal(false);
      setPassword(newPassword);
      setResetStep('request');
      setResetToken('');
      setNewPassword('');
      alert('Senha redefinida com sucesso! Você já pode entrar com sua nova senha.');
    } else {
      setErrorMessage(res.message);
    }
  };

  // 7. Handover Submission
  const handleHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHandoverError(null);

    if (!handoverOwnerName.trim() || !handoverOwnerEmail.trim() || !handoverCompanyName.trim()) {
      setHandoverError('Por favor, informe o nome da olaria, nome do titular e e-mail.');
      return;
    }

    if (handoverPassword.length < 4) {
      setHandoverError('A senha privada deve conter pelo menos 4 caracteres.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = AuthService.completeOwnerHandover({
        companyName: handoverCompanyName,
        ownerName: handoverOwnerName,
        ownerEmail: handoverOwnerEmail,
        ownerPhone: handoverOwnerPhone,
        password: handoverPassword,
        pin: handoverPin || '1234',
        setupToken: handoverSetupToken
      });

      setIsLoading(false);

      if (res.success && res.user) {
        setShowHandoverModal(false);
        alert(`Parabéns, ${res.user.name}!\n\nA posse de "${res.user.companyName}" foi transferida para você com sucesso.\nA conta temporária de implantação foi destruída.`);
        onLoginSuccess(res.user);
      } else {
        setHandoverError(res.message || 'Erro ao processar passagem de titularidade.');
      }
    }, 450);
  };

  // 8. Technical Authentication Submit
  const handleTechSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTechError(null);

    const res = AuthService.loginTechnical(techEmail, techPassword);
    if (res.success && res.user) {
      setShowTechModal(false);
      onNavigateToTechnical();
    } else {
      setTechError(res.message || 'Credenciais técnicas inválidas.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-amber-800 selection:text-white">
      {/* Top Header: Brand & Environment Selector */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-900 flex items-center justify-center text-amber-100 shadow-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-amber-950 tracking-tight leading-none uppercase">Olaria do Zico</h1>
            <span className="text-[11px] font-semibold text-stone-500 tracking-wide">Gestão & Produção</span>
          </div>
        </div>

        {/* Clean Environment Navigation: Produção · Demonstração */}
        <div className="flex items-center bg-stone-200/90 p-1 rounded-xl border border-stone-300 text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('production');
              setAuthMethod('none');
              setErrorMessage(null);
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'production'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Produção
          </button>
          <span className="text-stone-400 px-0.5 select-none">·</span>
          <button
            type="button"
            onClick={() => {
              setActiveTab('demo');
              setErrorMessage(null);
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-amber-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Demonstração
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md w-full mx-auto my-auto py-3 space-y-4">
        {/* ========================================================================= */}
        {/* PRODUCTION ENVIRONMENT: SECURE COMMERCIAL ACCESS */}
        {/* ========================================================================= */}
        {activeTab === 'production' && (
          <div className="bg-white border border-stone-200 rounded-3xl shadow-xs p-6 sm:p-8 space-y-5">
            {/* Title & Scope */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-stone-900 tracking-tight">Acesso ao Sistema</h2>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Ambiente protegido por empresa, usuário e permissões.
              </p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {/* Standard Login (Password) */}
            {authMethod === 'none' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                {/* Identifier */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    E-mail ou celular
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="zico@olaria.com.br"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-amber-800 focus:ring-2 focus:ring-amber-200 outline-hidden transition-all bg-white font-medium text-stone-900"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetModal(true);
                        setResetIdentifier(identifier);
                        setResetStep('request');
                      }}
                      className="text-xs font-semibold text-amber-900 hover:text-amber-950 hover:underline cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-amber-800 focus:ring-2 focus:ring-amber-200 outline-hidden transition-all bg-white font-medium text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember device */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-amber-900 focus:ring-amber-500"
                    />
                    <span>Manter conectado neste aparelho</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-950/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-1 uppercase tracking-wider"
                >
                  {isLoading ? (
                    <span>Verificando...</span>
                  ) : (
                    <>
                      <span>ENTRAR NO SISTEMA</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-2.5">
                  <div className="border-t border-stone-200 w-full"></div>
                  <span className="bg-white px-3 text-[11px] font-medium text-stone-400 lowercase tracking-wider shrink-0">
                    ou
                  </span>
                  <div className="border-t border-stone-200 w-full"></div>
                </div>

                {/* Continuar com Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 font-bold rounded-xl border border-stone-300 shadow-2xs hover:border-stone-400 text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                  <span>Continuar com Google</span>
                </button>

                {/* Alternative Access Links: Usar PIN · Usar biometria */}
                <div className="flex items-center justify-center gap-4 pt-1.5 text-xs font-semibold text-stone-600">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('pin');
                      setPinDigits('');
                      setErrorMessage(null);
                    }}
                    className="hover:text-amber-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-stone-500" />
                    <span>Usar PIN</span>
                  </button>

                  <span className="text-stone-300">·</span>

                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={isBioScanning}
                    className="hover:text-amber-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Fingerprint className="w-3.5 h-3.5 text-stone-500" />
                    <span>Usar biometria</span>
                  </button>
                </div>
              </form>
            )}

            {/* Alternative View: PIN Keypad */}
            {authMethod === 'pin' && (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('none')}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar para Senha</span>
                  </button>
                  <span className="text-xs font-bold text-stone-500">PIN de 4 Dígitos</span>
                </div>

                <p className="text-xs text-stone-600">
                  Digite seu PIN registrado para acesso rápido ao balcão:
                </p>

                {/* PIN Display */}
                <div className="flex justify-center items-center gap-3 my-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all ${
                        pinDigits.length > idx
                          ? 'border-amber-900 bg-amber-900 text-white'
                          : 'border-stone-200 bg-stone-50 text-stone-400'
                      }`}
                    >
                      {pinDigits.length > idx ? '●' : ''}
                    </div>
                  ))}
                </div>

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePinInput(num)}
                      className="h-11 bg-stone-50 hover:bg-stone-100 text-stone-900 text-base font-bold rounded-xl border border-stone-200 active:scale-95 flex items-center justify-center cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPinDigits('')}
                    className="h-11 text-stone-500 hover:text-stone-800 text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePinInput('0')}
                    className="h-11 bg-stone-50 hover:bg-stone-100 text-stone-900 text-base font-bold rounded-xl border border-stone-200 active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handlePinBackspace}
                    className="h-11 text-stone-500 hover:text-stone-800 text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            )}

            {/* Handover Link */}
            <div className="pt-3 border-t border-stone-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setHandoverError(null);
                  setShowHandoverModal(true);
                }}
                className="text-xs font-semibold text-stone-600 hover:text-amber-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Primeiro acesso como proprietário? <strong>Ativar olaria</strong></span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DEMO ENVIRONMENT: EXPLORE WITH SAMPLE DATA IN ISOLATED SANDBOX DATASET */}
        {/* ========================================================================= */}
        {activeTab === 'demo' && (
          <div className="bg-white border border-amber-200 rounded-3xl shadow-xs p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-11 h-11 rounded-2xl bg-amber-900 text-amber-100 mx-auto flex items-center justify-center mb-1.5 shadow-2xs">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-amber-950">Demonstração</h2>
              <p className="text-xs font-bold text-amber-900">Explore o sistema com dados fictícios</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Teste as funcionalidades sem alterar os dados reais da empresa.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            <div className="space-y-3 pt-1">
              {/* Option 1: Demo Owner */}
              <button
                type="button"
                onClick={() => handleDemoLogin('PROPRIETARIO')}
                disabled={isLoading}
                className="w-full p-4 rounded-2xl border-2 border-amber-900/30 bg-amber-50/70 hover:bg-amber-100 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                    <UserCheck className="w-4 h-4 text-amber-800" />
                    <span>Entrar como Proprietário — Demonstração</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-900 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-stone-600 mt-1 pl-6">
                  Acesso completo aos módulos disponíveis no ambiente de demonstração.
                </p>
              </button>

              {/* Option 2: Demo Employee */}
              <button
                type="button"
                onClick={() => handleDemoLogin('FUNCIONARIO')}
                disabled={isLoading}
                className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-stone-900">
                    <User className="w-4 h-4 text-stone-700" />
                    <span>Entrar como Funcionário — Demonstração</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-700 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-stone-600 mt-1 pl-6">
                  Acesso operacional limitado a pedidos, estoque e entregas.
                </p>
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
              <strong className="text-stone-800 block">Isolamento de Sandbox (Tenant Demo):</strong>
              <p>Operações realizadas na demonstração operam em dataset isolado e nunca alcançam o banco de dados da produção.</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECURITY & ARCHITECTURAL PRIVACY BULLET CARD */}
        {/* ========================================================================= */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-xs text-stone-700">
          <div className="flex items-center gap-2 font-bold text-stone-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Segurança & Privacidade por Arquitetura</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-stone-600 list-disc list-inside">
            <li><strong>Perfil automático:</strong> Perfil e permissões são determinados automaticamente pelo sistema durante a autenticação.</li>
            <li><strong>Isolamento Multi-Tenant:</strong> Cada empresa possui seus próprios dados e usuários, com isolamento estrito entre empresas.</li>
            <li><strong>Acesso Isolado:</strong> Sem senha mestra. Sem acesso técnico aos dados comerciais por padrão.</li>
          </ul>
        </div>
      </main>

      {/* Footer: Dedicated Technical Maintenance Entry Point */}
      <footer className="max-w-md w-full mx-auto text-center py-2 space-y-1.5">
        <div>
          <button
            type="button"
            onClick={() => {
              setTechError(null);
              setShowTechModal(true);
            }}
            className="text-stone-500 hover:text-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
          >
            <Wrench className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
            <span>Manutenção & Infraestrutura</span>
          </button>
          <p className="text-[10px] text-stone-400">
            Acesso técnico separado para manutenção do sistema.
          </p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* SEPARATE TECHNICAL AUTHENTICATION CHALLENGE MODAL */}
      {/* ========================================================================= */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-700 text-cyan-300 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Console Técnico & DevOps</h3>
                  <p className="text-[11px] text-slate-400">Autenticação restrita para manutenção</p>
                </div>
              </div>
              <button
                onClick={() => setShowTechModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xl font-bold p-1 leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 space-y-1">
              <span className="font-bold text-cyan-400 block">Isolamento de Dados:</span>
              <p>O perfil técnico acessa apenas telemetria, logs de sistema e integridade de schema. Não há visualização de faturamento ou senhas de clientes.</p>
            </div>

            {techError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs font-medium">
                {techError}
              </div>
            )}

            <form onSubmit={handleTechSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">E-mail do Administrador Técnico</label>
                <input
                  type="email"
                  required
                  value={techEmail}
                  onChange={(e) => setTechEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Senha de Infraestrutura</label>
                <input
                  type="password"
                  required
                  value={techPassword}
                  onChange={(e) => setTechPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:border-cyan-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTechModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>Conectar Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HANDOVER & FIRST ACCESS MODAL */}
      {/* ========================================================================= */}
      {showHandoverModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-amber-300 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-900 text-amber-100 flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-950">Ativação & Passagem de Titularidade</h3>
                  <p className="text-xs text-amber-800 font-medium">Entrega oficial do sistema para o proprietário</p>
                </div>
              </div>
              <button
                onClick={() => setShowHandoverModal(false)}
                className="text-stone-400 hover:text-stone-700 text-2xl font-bold p-1 leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-950">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Como funciona a segurança na entrega:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-amber-900/90 list-disc list-inside">
                <li>Você cadastra seu <strong>e-mail pessoal</strong> e cria sua <strong>senha privada</strong>.</li>
                <li>O sistema torna você o <strong>único Proprietário Titular</strong> da olaria.</li>
                <li>A conta temporária utilizada para implantação é <strong>destruída permanentemente</strong>.</li>
                <li><strong>Privacidade por Arquitetura:</strong> O desenvolvedor nunca saberá sua senha e não existe nenhuma senha mestra.</li>
              </ul>
            </div>

            {handoverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{handoverError}</span>
              </div>
            )}

            <form onSubmit={handleHandoverSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Nome da Sua Olaria</label>
                  <input
                    type="text"
                    required
                    value={handoverCompanyName}
                    onChange={(e) => setHandoverCompanyName(e.target.value)}
                    placeholder="Ex: Olaria do Zico"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:ring-2 focus:ring-amber-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Seu Nome Completo (Titular)</label>
                  <input
                    type="text"
                    required
                    value={handoverOwnerName}
                    onChange={(e) => setHandoverOwnerName(e.target.value)}
                    placeholder="Ex: Zico da Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:ring-2 focus:ring-amber-300 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Seu E-mail Oficial</label>
                  <input
                    type="email"
                    required
                    value={handoverOwnerEmail}
                    onChange={(e) => setHandoverOwnerEmail(e.target.value)}
                    placeholder="seu.email@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:ring-2 focus:ring-amber-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Telefone / WhatsApp (Opcional)</label>
                  <input
                    type="text"
                    value={handoverOwnerPhone}
                    onChange={(e) => setHandoverOwnerPhone(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:ring-2 focus:ring-amber-300 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Crie sua Senha Privada</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={handoverPassword}
                    onChange={(e) => setHandoverPassword(e.target.value)}
                    placeholder="Sua senha secreta"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium focus:ring-2 focus:ring-amber-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">PIN de 4 dígitos (p/ Balcão)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={handoverPin}
                    onChange={(e) => setHandoverPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Ex: 1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-bold text-center tracking-widest focus:ring-2 focus:ring-amber-300 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1">Token de Implantação / Chave da Olaria</label>
                <input
                  type="text"
                  value={handoverSetupToken}
                  onChange={(e) => setHandoverSetupToken(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 font-mono text-xs bg-stone-50 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setShowHandoverModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs sm:text-sm font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isLoading ? 'Transferindo Posse...' : 'Assumir Titularidade & Entrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSWORD RESET MODAL */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Recuperação de Senha</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {resetStep === 'request' ? (
              <form onSubmit={handleRequestReset} className="space-y-3">
                <p className="text-xs text-stone-600">
                  Informe o e-mail cadastrado na sua conta para emitir um token seguro de redefinição:
                </p>
                <input
                  type="text"
                  required
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="seu.email@olaria.com.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-amber-800 focus:ring-2 focus:ring-amber-200 outline-hidden font-medium text-stone-900"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-900 text-white text-xs font-bold hover:bg-amber-950 cursor-pointer"
                  >
                    Gerar Token
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-3">
                {resetSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                    {resetSuccessMessage}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Token Recebido</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Cole o token aqui"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-900 text-white text-xs font-bold hover:bg-amber-950 cursor-pointer"
                  >
                    Salvar Nova Senha
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
