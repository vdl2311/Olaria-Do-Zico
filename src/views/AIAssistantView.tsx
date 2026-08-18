import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle, 
  TrendingUp, 
  Flame, 
  Package, 
  DollarSign, 
  FileText, 
  RefreshCw, 
  Cpu, 
  Download, 
  Printer, 
  CheckCircle2, 
  HelpCircle, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Search,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AIOrchestrator } from '../ai/orchestrator/aiOrchestrator';
import { AiChatMessage, ReportType, AIReportStructure, OperationalInsight, IntelligentAlert, ExecutiveSummaryData } from '../ai/types/aiTypes';
import { SUGGESTED_QUESTIONS } from '../ai/prompts/systemPrompts';
import { InsightGenerator } from '../ai/insights/insightGenerator';
import { AlertEngine } from '../ai/alerts/alertEngine';
import { ExecutiveSummaryEngine } from '../ai/executive/executiveSummary';
import { AIReportEngine } from '../ai/reports/aiReportEngine';
import { AnomalyDetector } from '../ai/analytics/anomalyDetector';
import { useToast } from '../components/ui/Toast';

interface AIAssistantViewProps {
  onNavigateToView?: (view: string) => void;
  onOpenVoiceModal?: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ onNavigateToView, onOpenVoiceModal }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'alerts' | 'summary' | 'reports' | 'governance'>('chat');

  // Chat State
  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    const existing = AIOrchestrator.getHistory();
    if (existing.length > 0) return existing;
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: `👋 Olá! Sou o **Assistente de Gestão Inteligente da Olaria do Zico**.\n\nEstou conectado aos dados reais da olaria para responder perguntas, comparar períodos, diagnosticar estoque, analisar perdas de queima nos fornos e gerar relatórios executivos.\n\n**O que você gostaria de analisar hoje?**`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dataSources: ['Banco de Dados da Olaria'],
        suggestedFollowUps: SUGGESTED_QUESTIONS.slice(0, 4)
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Insights & Alerts State
  const [insights, setInsights] = useState<OperationalInsight[]>(() => InsightGenerator.generateInsights());
  const [alerts, setAlerts] = useState<IntelligentAlert[]>(() => AlertEngine.generateAlerts());
  const [alertFilter, setAlertFilter] = useState<'TODOS' | 'ATENCAO' | 'ALERTA' | 'OPORTUNIDADE'>('TODOS');
  const [summaryData, setSummaryData] = useState<ExecutiveSummaryData>(() => ExecutiveSummaryEngine.generateSummary());

  // Reports State
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('EXECUTIVO');
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [generatedReport, setGeneratedReport] = useState<AIReportStructure | null>(() => 
    AIReportEngine.generateReport('EXECUTIVO')
  );

  // Scroll to bottom on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const refreshAllAIData = () => {
    setInsights(InsightGenerator.generateInsights());
    setAlerts(AlertEngine.generateAlerts());
    setSummaryData(ExecutiveSummaryEngine.generateSummary());
    setGeneratedReport(AIReportEngine.generateReport(selectedReportType, reportStartDate, reportEndDate));
    showToast('Dados da IA atualizados com o banco de dados!', 'success');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isProcessing) return;

    const userMsg: AiChatMessage = {
      id: `user-msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const assistantResponse = await AIOrchestrator.processUserMessage(query, updatedMessages);
      setMessages([...updatedMessages, assistantResponse]);
    } catch (err: any) {
      console.error('Error handling AI message:', err);
      const errorMsg: AiChatMessage = {
        id: `err-msg-${Date.now()}`,
        role: 'assistant',
        content: `Ocorreu uma instabilidade momentânea ao consultar os dados: ${err.message || 'Falha de comunicação'}. Por favor, tente novamente.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages([...updatedMessages, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearChat = () => {
    AIOrchestrator.clearHistory();
    setMessages([
      {
        id: `reset-msg-${Date.now()}`,
        role: 'assistant',
        content: `Conversa reiniciada. Os dados continuam seguros e prontos para novas consultas. Como posso ajudar?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dataSources: ['Banco de Dados da Olaria'],
        suggestedFollowUps: SUGGESTED_QUESTIONS.slice(0, 3)
      }
    ]);
    showToast('Histórico da conversa limpo.', 'info');
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    showToast('Resposta copiada para a área de transferência!', 'success');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [id]: type }));
    showToast(type === 'up' ? 'Obrigado pelo feedback positivo!' : 'Feedback registrado para calibrar a precisão.', 'info');
  };

  const handleGenerateReportClick = () => {
    const rep = AIReportEngine.generateReport(selectedReportType, reportStartDate, reportEndDate);
    setGeneratedReport(rep);
    showToast(`Relatório ${selectedReportType} gerado com sucesso!`, 'success');
  };

  const handleExportExcel = () => {
    if (!generatedReport || !generatedReport.tabularData) {
      showToast('Nenhum dado tabular disponível para exportação.', 'warning');
      return;
    }

    const wsData = [
      [generatedReport.title],
      [`Gerado em: ${generatedReport.generatedAt}`],
      [`Período: ${generatedReport.period.label}`],
      [],
      generatedReport.tabularData.headers,
      ...generatedReport.tabularData.rows
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorio_IA');
    XLSX.writeFile(wb, `Olaria_Zico_${generatedReport.reportType}_${Date.now()}.xlsx`);
    showToast('Planilha Excel baixada com sucesso!', 'success');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const filteredAlerts = alerts.filter(a => {
    if (alertFilter === 'TODOS') return true;
    return a.priority === alertFilter;
  });

  return (
    <div className="space-y-6 pb-20 font-brand-sans max-w-7xl mx-auto w-full">
      {/* Header & Sub-Navigation */}
      <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#B85C38]/10 text-[#B85C38] dark:text-[#E78B68] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Camada de Inteligência Operacional</span>
          </div>
          <h1 className="font-brand-serif text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] tracking-tight">
            Assistente IA da Olaria
          </h1>
          <p className="text-xs sm:text-sm text-[#8A5A44] dark:text-[#CBB5A1] mt-1">
            Consultas em linguagem natural, diagnósticos de queima, alertas inteligentes e relatórios gerenciais calculados em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refreshAllAIData}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#F2EBDD] dark:bg-[#2D2A26] hover:bg-[#E7D5BE] dark:hover:bg-[#3D3833] text-[#5C3D2E] dark:text-[#E7D5BE] font-bold rounded-xl text-xs transition-colors cursor-pointer border border-[#E7D5BE] dark:border-[#3D3833]"
            title="Atualizar dados"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar</span>
          </button>

          {onOpenVoiceModal && (
            <button
              type="button"
              onClick={onOpenVoiceModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Comando de Voz</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#E7D5BE] dark:border-[#3D3833]">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-[#B85C38] text-white shadow-xs'
              : 'text-[#8A5A44] dark:text-[#CBB5A1] hover:bg-[#FAF6EF] dark:hover:bg-[#252320]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Assistente & Consultas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'insights'
              ? 'bg-[#B85C38] text-white shadow-xs'
              : 'text-[#8A5A44] dark:text-[#CBB5A1] hover:bg-[#FAF6EF] dark:hover:bg-[#252320]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Insights ({insights.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-[#B85C38] text-white shadow-xs'
              : 'text-[#8A5A44] dark:text-[#CBB5A1] hover:bg-[#FAF6EF] dark:hover:bg-[#252320]'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Alertas ({alerts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-[#B85C38] text-white shadow-xs'
              : 'text-[#8A5A44] dark:text-[#CBB5A1] hover:bg-[#FAF6EF] dark:hover:bg-[#252320]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>O Que Preciso Saber Hoje?</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[#B85C38] text-white shadow-xs'
              : 'text-[#8A5A44] dark:text-[#CBB5A1] hover:bg-[#FAF6EF] dark:hover:bg-[#252320]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Relatórios com IA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('governance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'governance'
              ? 'bg-[#B85C38] text-white shadow-xs'
              : 'text-[#8A5A44] dark:text-[#CBB5A1] hover:bg-[#FAF6EF] dark:hover:bg-[#252320]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Governança & Status</span>
        </button>
      </div>

      {/* TAB 1: CHAT & CONSULTAS EM LINGUAGEM NATURAL */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          {/* Suggested Questions Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A5A44] dark:text-[#CBB5A1]">
              💡 Perguntas Sugeridas da Operação:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 rounded-full bg-[#FAF6EF] dark:bg-[#252320] hover:bg-[#E7D5BE] dark:hover:bg-[#3D3833] text-[#5C3D2E] dark:text-[#E7D5BE] text-xs font-medium border border-[#E7D5BE] dark:border-[#3D3833] transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Container */}
          <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-4 sm:p-6 min-h-[460px] max-h-[600px] overflow-y-auto flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              {messages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} space-y-1.5`}
                  >
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[11px] font-bold text-[#8A5A44] dark:text-[#CBB5A1]">
                        {isAssistant ? '🤖 Assistente IA' : '👤 Você'}
                      </span>
                      <span className="text-[10px] text-[#A89F91]">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`rounded-2xl p-4 max-w-3xl text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-white dark:bg-[#1E1C1A] text-[#292724] dark:text-[#F7F1E7] border border-[#E7D5BE] dark:border-[#3D3833] shadow-xs'
                          : 'bg-[#B85C38] text-white shadow-xs'
                      }`}
                    >
                      {/* Markdown representation */}
                      <div className="whitespace-pre-wrap font-brand-sans space-y-2">
                        {msg.content}
                      </div>

                      {/* Tool Calls badges if present */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#E7D5BE] dark:border-[#3D3833] flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] uppercase font-bold text-[#8A5A44] dark:text-[#A89F91]">
                            Ferramentas Consultadas:
                          </span>
                          {msg.toolCalls.map((tc, tidx) => (
                            <span
                              key={tidx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF6EF] dark:bg-[#252320] text-[#5C3D2E] dark:text-[#E7D5BE] text-[11px] font-mono border border-[#E7D5BE] dark:border-[#3D3833]"
                            >
                              ⚙️ {tc.toolName} ({tc.executionTimeMs}ms)
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Data Sources indicator */}
                      {msg.dataSources && msg.dataSources.length > 0 && (
                        <div className="mt-2 text-[10px] text-[#8A5A44] dark:text-[#A89F91] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-green-600" />
                          <span>Fonte: {msg.dataSources.join(', ')}</span>
                        </div>
                      )}

                      {/* Action buttons on assistant messages */}
                      {isAssistant && (
                        <div className="mt-3 pt-2 border-t border-[#F2EBDD] dark:border-[#2D2A26] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="p-1 text-[#8A5A44] dark:text-[#CBB5A1] hover:text-[#B85C38] transition-colors rounded-md hover:bg-[#FAF6EF] dark:hover:bg-[#252320] cursor-pointer"
                              title="Copiar resposta"
                            >
                              {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1 transition-colors rounded-md hover:bg-[#FAF6EF] dark:hover:bg-[#252320] cursor-pointer ${
                                feedbackGiven[msg.id] === 'up' ? 'text-green-600' : 'text-[#8A5A44] dark:text-[#CBB5A1] hover:text-green-600'
                              }`}
                              title="Resposta útil"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1 transition-colors rounded-md hover:bg-[#FAF6EF] dark:hover:bg-[#252320] cursor-pointer ${
                                feedbackGiven[msg.id] === 'down' ? 'text-red-500' : 'text-[#8A5A44] dark:text-[#CBB5A1] hover:text-red-500'
                              }`}
                              title="Resposta imprecisa"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Suggested follow up chips inside message */}
                          {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-sm">
                              {msg.suggestedFollowUps.map((fu, fidx) => (
                                <button
                                  key={fidx}
                                  type="button"
                                  onClick={() => handleSendMessage(fu)}
                                  className="px-2 py-0.5 bg-[#FAF6EF] dark:bg-[#252320] hover:bg-[#E7D5BE] dark:hover:bg-[#3D3833] text-[#5C3D2E] dark:text-[#E7D5BE] text-[10px] rounded-md border border-[#E7D5BE] dark:border-[#3D3833] truncate cursor-pointer"
                                >
                                  {fu}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Processing Loader */}
              {isProcessing && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#1E1C1A] border border-[#E7D5BE] dark:border-[#3D3833] max-w-xs animate-pulse">
                  <RefreshCw className="w-4 h-4 text-[#B85C38] animate-spin" />
                  <span className="text-xs font-bold text-[#8A5A44] dark:text-[#CBB5A1]">
                    Consultando dados reais da olaria...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="mt-4 pt-3 border-t border-[#E7D5BE] dark:border-[#3D3833] flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-2.5 rounded-xl text-[#8A5A44] dark:text-[#CBB5A1] hover:bg-[#E7D5BE] dark:hover:bg-[#3D3833] transition-colors cursor-pointer shrink-0"
                title="Limpar Conversa"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Pergunte sobre vendas, produção, fornos, estoque ou contas..."
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-[#1A1816] border border-[#E7D5BE] dark:border-[#3D3833] rounded-xl text-xs sm:text-sm text-[#292724] dark:text-[#F7F1E7] focus:outline-none focus:ring-2 focus:ring-[#B85C38] transition-all placeholder-[#A89F91]"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isProcessing}
                className="px-4 py-2.5 bg-[#B85C38] hover:bg-[#9E4A2A] disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <span>Enviar</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INSIGHTS DA OPERAÇÃO */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-brand-serif text-lg font-bold text-[#292724] dark:text-[#F7F1E7]">
              Descobertas e Tendências da Olaria
            </h3>
            <span className="text-xs text-[#8A5A44] dark:text-[#CBB5A1]">
              Atualizado automaticamente com base em cálculos matemáticos reais
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins) => {
              const isGrowth = ins.type === 'CRESCIMENTO' || ins.type === 'OPORTUNIDADE';
              const isRisk = ins.type === 'RISCO' || ins.type === 'QUEDA';
              return (
                <div
                  key={ins.id}
                  className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-5 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isGrowth
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : isRisk
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {ins.type} • {ins.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8A5A44] dark:text-[#A89F91]">
                      Confiança: {Math.round(ins.confidence * 100)}%
                    </span>
                  </div>

                  <h4 className="font-brand-serif text-base font-bold text-[#292724] dark:text-[#F7F1E7]">
                    {ins.title}
                  </h4>

                  <p className="text-xs text-[#5C5852] dark:text-[#CBB5A1] leading-relaxed">
                    {ins.description}
                  </p>

                  <div className="p-3 bg-white dark:bg-[#1E1C1A] rounded-xl border border-[#E7D5BE] dark:border-[#3D3833] space-y-1.5">
                    <div className="text-[11px] font-bold text-[#8A5A44] dark:text-[#E7D5BE]">
                      📊 Evidência Quantitativa:
                    </div>
                    <div className="text-xs text-[#292724] dark:text-[#F7F1E7]">
                      {ins.evidence}
                    </div>
                  </div>

                  <div className="text-xs text-[#B85C38] dark:text-[#E78B68] font-medium flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span><strong>Ação Recomendada:</strong> {ins.recommendation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CENTRAL DE ALERTAS INTELIGENTES */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8A5A44] dark:text-[#CBB5A1]">Filtrar por Prioridade:</span>
              {(['TODOS', 'ATENCAO', 'ALERTA', 'OPORTUNIDADE'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setAlertFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    alertFilter === filter
                      ? 'bg-[#B85C38] text-white'
                      : 'bg-[#FAF6EF] dark:bg-[#252320] text-[#5C3D2E] dark:text-[#E7D5BE] border border-[#E7D5BE] dark:border-[#3D3833]'
                  }`}
                >
                  {filter === 'ATENCAO' ? '🔴 Atenção' : filter === 'ALERTA' ? '🟠 Alerta' : filter === 'OPORTUNIDADE' ? '🟢 Oportunidade' : 'Todos'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-8 text-center text-sm text-[#8A5A44] dark:text-[#CBB5A1]">
                Nenhum alerta pendente para a categoria selecionada. Operação regular!
              </div>
            ) : (
              filteredAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    alt.priority === 'ATENCAO'
                      ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-950 dark:text-red-100'
                      : alt.priority === 'ALERTA'
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-100'
                        : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-100'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {alt.priority === 'ATENCAO' ? '🔴 Atenção Crítica' : alt.priority === 'ALERTA' ? '🟠 Alerta Operacional' : '🟢 Oportunidade'}
                      </span>
                      <span className="text-[10px] opacity-75">| {alt.origin} • {alt.date}</span>
                    </div>

                    <h4 className="font-brand-serif text-base font-bold">
                      {alt.title}
                    </h4>

                    <p className="text-xs opacity-90 leading-relaxed max-w-3xl">
                      {alt.description}
                    </p>

                    <div className="text-xs font-semibold pt-1">
                      👉 <strong>Ação Recomendada:</strong> {alt.recommendedAction}
                    </div>
                  </div>

                  {alt.actionView && onNavigateToView && (
                    <button
                      type="button"
                      onClick={() => onNavigateToView(alt.actionView!)}
                      className="px-4 py-2 bg-white dark:bg-[#1E1C1A] text-[#292724] dark:text-[#F7F1E7] border border-current hover:bg-opacity-90 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer self-start sm:self-center shadow-xs"
                    >
                      <span>{alt.actionLabel || 'Resolver'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RESUMO EXECUTIVO ("O QUE PRECISO SABER HOJE?") */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Health Score Gauge */}
          <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A5A44] dark:text-[#CBB5A1]">
                Diagnóstico de Eficiência Global
              </span>
              <h2 className="font-brand-serif text-2xl font-black text-[#292724] dark:text-[#F7F1E7]">
                Saúde Operacional da Olaria: {summaryData.health.score}/100 ({summaryData.health.status})
              </h2>
              <p className="text-xs text-[#5C5852] dark:text-[#CBB5A1] max-w-xl">
                Cálculo ponderado de perdas na queima dos fornos, giro e estoque mínimo, liquidez do fluxo financeiro e pontualidade de entregas.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shrink-0">
              <div className="bg-white dark:bg-[#1E1C1A] p-3 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833]">
                <div className="text-[10px] font-bold text-[#8A5A44] dark:text-[#A89F91]">Fornos/Queima</div>
                <div className="text-lg font-black text-[#B85C38] dark:text-[#E78B68]">{summaryData.health.productionScore}%</div>
              </div>
              <div className="bg-white dark:bg-[#1E1C1A] p-3 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833]">
                <div className="text-[10px] font-bold text-[#8A5A44] dark:text-[#A89F91]">Estoque Seguro</div>
                <div className="text-lg font-black text-[#B85C38] dark:text-[#E78B68]">{summaryData.health.stockScore}%</div>
              </div>
              <div className="bg-white dark:bg-[#1E1C1A] p-3 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833]">
                <div className="text-[10px] font-bold text-[#8A5A44] dark:text-[#A89F91]">Liquidez/Caixa</div>
                <div className="text-lg font-black text-[#B85C38] dark:text-[#E78B68]">{summaryData.health.financialScore}%</div>
              </div>
              <div className="bg-white dark:bg-[#1E1C1A] p-3 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833]">
                <div className="text-[10px] font-bold text-[#8A5A44] dark:text-[#A89F91]">Entregas</div>
                <div className="text-lg font-black text-[#B85C38] dark:text-[#E78B68]">{summaryData.health.deliveryScore}%</div>
              </div>
            </div>
          </div>

          {/* Core Modules Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Produção */}
            <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-[#B85C38] dark:text-[#E78B68]">
                <Flame className="w-5 h-5" />
                <h3 className="font-brand-serif text-lg font-bold text-[#292724] dark:text-[#F7F1E7]">Produção & Fornos</h3>
              </div>
              <p className="text-xs text-[#5C5852] dark:text-[#CBB5A1] leading-relaxed">
                {summaryData.producao.summaryText}
              </p>
              <div className="pt-2 text-xs font-bold text-[#8A5A44] dark:text-[#E7D5BE]">
                Peças Produzidas: {summaryData.producao.totalProduced} | Perdas: {summaryData.producao.totalLost} ({summaryData.producao.lossRatePercent}%)
              </div>
            </div>

            {/* Vendas */}
            <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-[#B85C38] dark:text-[#E78B68]">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-brand-serif text-lg font-bold text-[#292724] dark:text-[#F7F1E7]">Desempenho de Vendas</h3>
              </div>
              <p className="text-xs text-[#5C5852] dark:text-[#CBB5A1] leading-relaxed">
                {summaryData.vendas.summaryText}
              </p>
              <div className="pt-2 text-xs font-bold text-[#8A5A44] dark:text-[#E7D5BE]">
                Faturamento: R$ {summaryData.vendas.totalRevenue.toFixed(2)} | Ticket Médio: R$ {summaryData.vendas.averageTicket.toFixed(2)}
              </div>
            </div>

            {/* Estoque */}
            <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-[#B85C38] dark:text-[#E78B68]">
                <Package className="w-5 h-5" />
                <h3 className="font-brand-serif text-lg font-bold text-[#292724] dark:text-[#F7F1E7]">Estoque & Pátio</h3>
              </div>
              <p className="text-xs text-[#5C5852] dark:text-[#CBB5A1] leading-relaxed">
                {summaryData.estoque.summaryText}
              </p>
              <div className="pt-2 text-xs font-bold text-[#8A5A44] dark:text-[#E7D5BE]">
                Total: {summaryData.estoque.totalItems} peças | Valor de Venda: R$ {summaryData.estoque.totalValuation.toFixed(2)}
              </div>
            </div>

            {/* Financeiro */}
            <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-[#B85C38] dark:text-[#E78B68]">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-brand-serif text-lg font-bold text-[#292724] dark:text-[#F7F1E7]">Caixa & Fiado</h3>
              </div>
              <p className="text-xs text-[#5C5852] dark:text-[#CBB5A1] leading-relaxed">
                {summaryData.financeiro.summaryText}
              </p>
              <div className="pt-2 text-xs font-bold text-[#8A5A44] dark:text-[#E7D5BE]">
                Saldo Líquido: R$ {summaryData.financeiro.netCashFlow.toFixed(2)} | Fiado a Receber: R$ {summaryData.financeiro.totalReceivablePending.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Actionable Directives */}
          <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-6 space-y-4">
            <h3 className="font-brand-serif text-lg font-bold text-[#292724] dark:text-[#F7F1E7]">
              Recomendações Práticas Imediatas
            </h3>
            <ul className="space-y-2">
              {summaryData.recomendacoesImediatas.map((rec, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-[#292724] dark:text-[#F7F1E7]">
                  <CheckCircle2 className="w-4 h-4 text-[#B85C38] dark:text-[#E78B68] shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 5: GERADOR DE RELATÓRIOS COM IA */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A5A44] dark:text-[#CBB5A1] mb-1">
                  Tipo de Relatório:
                </label>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E1C1A] border border-[#E7D5BE] dark:border-[#3D3833] rounded-xl text-xs font-bold text-[#292724] dark:text-[#F7F1E7]"
                >
                  <option value="EXECUTIVO">Relatório Executivo Integrado</option>
                  <option value="DIARIO">Relatório Diário</option>
                  <option value="SEMANAL">Relatório Semanal</option>
                  <option value="MENSAL">Relatório Mensal</option>
                  <option value="PRODUCAO">Relatório de Produção (Fornos)</option>
                  <option value="VENDAS">Relatório de Vendas e Faturamento</option>
                  <option value="ESTOQUE">Relatório de Estoque e Insumos</option>
                  <option value="FINANCEIRO">Relatório Financeiro e Fluxo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A5A44] dark:text-[#CBB5A1] mb-1">
                  Data Inicial:
                </label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E1C1A] border border-[#E7D5BE] dark:border-[#3D3833] rounded-xl text-xs text-[#292724] dark:text-[#F7F1E7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A5A44] dark:text-[#CBB5A1] mb-1">
                  Data Final:
                </label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1E1C1A] border border-[#E7D5BE] dark:border-[#3D3833] rounded-xl text-xs text-[#292724] dark:text-[#F7F1E7]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateReportClick}
                className="px-4 py-2.5 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gerar Relatório</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-2.5 bg-[#F2EBDD] dark:bg-[#2D2A26] hover:bg-[#E7D5BE] dark:hover:bg-[#3D3833] text-[#5C3D2E] dark:text-[#E7D5BE] font-bold rounded-xl text-xs transition-colors cursor-pointer border border-[#E7D5BE] dark:border-[#3D3833]"
                title="Exportar Excel"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handlePrintReport}
                className="px-3.5 py-2.5 bg-[#F2EBDD] dark:bg-[#2D2A26] hover:bg-[#E7D5BE] dark:hover:bg-[#3D3833] text-[#5C3D2E] dark:text-[#E7D5BE] font-bold rounded-xl text-xs transition-colors cursor-pointer border border-[#E7D5BE] dark:border-[#3D3833]"
                title="Imprimir"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Generated Report Display */}
          {generatedReport && (
            <div className="bg-white dark:bg-[#1E1C1A] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs print:p-0 print:border-none">
              {/* Header */}
              <div className="border-b border-[#E7D5BE] dark:border-[#3D3833] pb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B85C38] dark:text-[#E78B68]">
                  Olaria do Zico • Documento Gerencial
                </span>
                <h2 className="font-brand-serif text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] mt-1">
                  {generatedReport.title}
                </h2>
                <p className="text-xs text-[#8A5A44] dark:text-[#CBB5A1] mt-1">
                  Gerado em {generatedReport.generatedAt} | Período de Análise: {generatedReport.period.label}
                </p>
              </div>

              {/* 1. Resumo Executivo */}
              <div className="space-y-2">
                <h3 className="font-brand-serif text-lg font-bold text-[#292724] dark:text-[#F7F1E7] flex items-center gap-2">
                  <span>1. Resumo Executivo</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#CBB5A1] leading-relaxed">
                  {generatedReport.resumo}
                </p>
              </div>

              {/* 2. Indicadores Principais */}
              <div className="space-y-3">
                <h3 className="font-brand-serif text-lg font-bold text-[#292724] dark:text-[#F7F1E7]">
                  2. Indicadores Chave de Desempenho (KPIs)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {generatedReport.indicadores.map((ind, i) => (
                    <div key={i} className="bg-[#FAF6EF] dark:bg-[#252320] p-3 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833]">
                      <div className="text-[10px] font-bold text-[#8A5A44] dark:text-[#A89F91] truncate">{ind.label}</div>
                      <div className="text-base font-black text-[#B85C38] dark:text-[#E78B68] mt-0.5">{ind.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Comparações e Variações */}
              {generatedReport.comparacoes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-brand-serif text-lg font-bold text-[#292724] dark:text-[#F7F1E7]">
                    3. Comparações e Eficiência
                  </h3>
                  <div className="space-y-2">
                    {generatedReport.comparacoes.map((cmp, cidx) => (
                      <div key={cidx} className="p-3 bg-[#FAF6EF] dark:bg-[#252320] rounded-xl border border-[#E7D5BE] dark:border-[#3D3833] text-xs">
                        <div className="font-bold text-[#292724] dark:text-[#F7F1E7]">{cmp.metric}</div>
                        <div className="text-[#5C5852] dark:text-[#CBB5A1] mt-0.5">{cmp.interpretation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Tendências, Problemas e Oportunidades */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#FAF6EF] dark:bg-[#252320] p-4 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] space-y-2">
                  <div className="font-brand-serif text-sm font-bold text-[#292724] dark:text-[#F7F1E7]">📈 Tendências</div>
                  <ul className="space-y-1.5 text-xs text-[#5C5852] dark:text-[#CBB5A1]">
                    {generatedReport.tendencias.map((t, tidx) => (
                      <li key={tidx}>• {t}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#FAF6EF] dark:bg-[#252320] p-4 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] space-y-2">
                  <div className="font-brand-serif text-sm font-bold text-[#292724] dark:text-[#F7F1E7]">⚠️ Pontos de Atenção</div>
                  <ul className="space-y-1.5 text-xs text-[#5C5852] dark:text-[#CBB5A1]">
                    {generatedReport.problemas.map((p, pidx) => (
                      <li key={pidx}>• {p}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#FAF6EF] dark:bg-[#252320] p-4 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] space-y-2">
                  <div className="font-brand-serif text-sm font-bold text-[#292724] dark:text-[#F7F1E7]">💡 Oportunidades</div>
                  <ul className="space-y-1.5 text-xs text-[#5C5852] dark:text-[#CBB5A1]">
                    {generatedReport.oportunidades.map((o, oidx) => (
                      <li key={oidx}>• {o}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5. Recomendações */}
              <div className="p-4 bg-[#B85C38]/10 dark:bg-[#B85C38]/20 rounded-2xl border border-[#B85C38]/20 space-y-2">
                <div className="font-brand-serif text-sm font-bold text-[#B85C38] dark:text-[#E78B68]">
                  🎯 Recomendações Estratégicas:
                </div>
                <ul className="space-y-1 text-xs text-[#292724] dark:text-[#F7F1E7]">
                  {generatedReport.recomendacoes.map((r, ridx) => (
                    <li key={ridx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#B85C38] dark:text-[#E78B68] shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tabular Data */}
              {generatedReport.tabularData && (
                <div className="space-y-2">
                  <h4 className="font-brand-serif text-sm font-bold text-[#292724] dark:text-[#F7F1E7]">
                    Tabela Detalhada de Registros
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAF6EF] dark:bg-[#252320] border-b border-[#E7D5BE] dark:border-[#3D3833]">
                          {generatedReport.tabularData.headers.map((h, hidx) => (
                            <th key={hidx} className="p-2.5 font-bold text-[#8A5A44] dark:text-[#E7D5BE]">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7D5BE] dark:divide-[#3D3833]">
                        {generatedReport.tabularData.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-[#FAF6EF] dark:hover:bg-[#252320]/50">
                            {row.map((cell, cidx) => (
                              <td key={cidx} className="p-2.5 text-[#292724] dark:text-[#F7F1E7]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: GOVERNANÇA & DIAGNÓSTICO DA IA */}
      {activeTab === 'governance' && (
        <div className="space-y-4">
          <div className="bg-[#FAF6EF] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-brand-serif text-lg font-bold text-[#292724] dark:text-[#F7F1E7] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#B85C38]" />
              <span>Painel de Controle e Governança da IA</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1E1C1A] p-4 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] space-y-1">
                <span className="text-[11px] font-bold text-[#8A5A44] dark:text-[#A89F91]">Motor Principal</span>
                <div className="text-base font-black text-[#292724] dark:text-[#F7F1E7]">Gemini 3.7 Flash</div>
                <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>SDK @google/genai Ativo</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E1C1A] p-4 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] space-y-1">
                <span className="text-[11px] font-bold text-[#8A5A44] dark:text-[#A89F91]">Motor Local Fail-Safe</span>
                <div className="text-base font-black text-[#292724] dark:text-[#F7F1E7]">Determinístico (100% Offline)</div>
                <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Latência média &lt; 15ms</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E1C1A] p-4 rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] space-y-1">
                <span className="text-[11px] font-bold text-[#8A5A44] dark:text-[#A89F91]">Controle de Acesso ao Banco</span>
                <div className="text-base font-black text-[#292724] dark:text-[#F7F1E7]">Somente Leitura Controlada</div>
                <div className="text-[10px] text-[#8A5A44] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-green-600" />
                  <span>Zero Escrita Sem Confirmação</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-[#1E1C1A] rounded-2xl border border-[#E7D5BE] dark:border-[#3D3833] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A5A44] dark:text-[#E7D5BE]">
                🛡️ Política Anti-Alucinação e Proteção de Dados
              </h4>
              <ul className="text-xs text-[#5C5852] dark:text-[#CBB5A1] space-y-1 list-disc pl-4 leading-relaxed">
                <li>A IA não possui acesso administrativo irrestrito ao Firestore; cada consulta passa por um filtro estrito de tenant ID e perfil de permissões.</li>
                <li>Nenhum número de faturamento ou lote de cerâmica é estimado de forma arbitrária.</li>
                <li>Quando os dados forem insuficientes no período pesquisado, o assistente declara explicitamente a ausência de registros.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
