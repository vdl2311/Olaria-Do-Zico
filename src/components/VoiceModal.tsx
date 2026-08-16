import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X, Edit3, AlertTriangle, Send, Sparkles, Volume2 } from 'lucide-react';
import { StorageService } from '../services/storage';
import { NluActionPayload } from '../types';
import { BrandSymbol } from './BrandLogo';

interface VoiceModalProps {
  onClose: () => void;
  onActionApplied?: () => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ onClose, onActionApplied }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nluResult, setNluResult] = useState<NluActionPayload | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Reset state when modal mounts
  useEffect(() => {
    setTranscript('');
    setManualText('');
    setNluResult(null);
    setEditMode(false);
    setFeedbackMsg(null);
    return () => {
      stopListening();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setTranscript('');
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Already listening or error:', e);
      }
    } else {
      alert('Seu navegador não suporta reconhecimento de voz nativo. Use o campo de texto abaixo.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    if (nluResult) {
      const lower = textToSend.toLowerCase().trim();
      if (['sim', 'pode registrar', 'confirma', 'confirmar', 'ok', 'pode', 'entendi'].includes(lower)) {
        handleConfirmAction();
        return;
      }
    }

    setIsLoading(true);
    setFeedbackMsg(null);

    try {
      const products = StorageService.getProducts();
      const customers = StorageService.getCustomers();

      const response = await fetch('/api/voice-nlu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToSend,
          context: {
            products: products.map(p => ({ name: p.name, stock: p.stock, price: p.price })),
            customers: customers.map(c => ({ name: c.name }))
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha no processamento de voz');
      }

      const result: NluActionPayload = await response.json();
      setNluResult(result);
      setEditedSummary(result.summary);

      if (result.intent === 'QUERY' && result.parsedData?.queryAnswer) {
        speakText(result.parsedData.queryAnswer);
      } else if (result.needsMoreInfo && result.questionToUser) {
        speakText(result.questionToUser);
      } else if (result.summary) {
        speakText(`Entendi: ${result.summary}. Confirmar?`);
      }

    } catch (err: any) {
      console.error(err);
      setFeedbackMsg('Erro ao conectar com assistente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = () => {
    if (!nluResult) return;

    if (nluResult.intent === 'QUERY') {
      onClose();
      return;
    }

    const finalPayload = { ...nluResult, summary: editedSummary };
    const res = StorageService.applyVoiceAction(finalPayload);

    if (res.success) {
      setFeedbackMsg(res.message);
      speakText('Operação registrada com sucesso!');
      if (onActionApplied) onActionApplied();
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setFeedbackMsg(res.message);
    }
  };

  const currentText = transcript || manualText;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200 font-brand-sans">
      <div className="bg-[#FAF6EF] border-2 border-[#E7D5BE] text-[#292724] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#8A5A44] text-[#F7F1E7] border-b border-[#6E4533] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#B85C38] flex items-center justify-center text-white border border-[#CF734E]/60 shadow-xs">
              <BrandSymbol variant="creme" className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-brand-serif font-bold text-white text-base">Assistente da Olaria</h3>
              <p className="text-xs text-[#E7D5BE]/80">Registro Rápido por Voz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#E7D5BE] hover:text-white rounded-lg hover:bg-[#6E4533] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Visual Microphone Section */}
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-90 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white ring-8 ring-rose-500/30 animate-pulse'
                  : 'bg-[#B85C38] hover:bg-[#9E4A2A] text-white hover:scale-105 border-2 border-[#CF734E]'
              }`}
            >
              {isListening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
            </button>
            <p className="mt-3 text-sm font-bold text-[#292724]">
              {isListening ? 'Estou ouvindo... Pode falar naturalmente' : 'Toque no microfone para Falar'}
            </p>
            <p className="text-xs text-[#8A5A44]">
              {isListening ? 'Diga vendas, fornos, entregas ou despesas' : 'Ou selecione um exemplo rápido abaixo:'}
            </p>

            {/* Quick Example Chips for One-Tap Testing */}
            <div className="mt-3.5 w-full">
              <div className="flex flex-wrap gap-1.5 justify-center text-xs">
                {[
                  "Vendi 2 Vasos Terracota por 360 reais no Pix para Carlos",
                  "Produzi lote de 30 Vasos com 2 perdas na queima",
                  "Cliente Roberto comprou 480 reais no Fiado",
                  "Paguei 1450 reais de energia dos fornos",
                  "Qual é o saldo devedor de Roberto?"
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setManualText(sample);
                      handleSendText(sample);
                    }}
                    className="bg-[#F7F1E7] hover:bg-[#E7D5BE] text-[#292724] border border-[#D4BEA2] px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors text-left shadow-2xs cursor-pointer"
                  >
                    🏺 "{sample}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Transcription or Input */}
          <div className="bg-[#F7F1E7] border border-[#E7D5BE] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-[#8A5A44] tracking-wider font-brand-sans">
                O que você falou / digitou:
              </span>
              {currentText && (
                <button
                  onClick={() => { setTranscript(''); setManualText(''); setNluResult(null); }}
                  className="text-[11px] text-[#B85C38] hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
            <p className="text-sm font-medium text-[#292724] min-h-[36px] italic">
              {currentText ? `"${currentText}"` : 'Aguardando sua fala ou digitação...'}
            </p>

            {/* Prominent Send/Process Button for Audio/Text */}
            {currentText && !nluResult && !isLoading && (
              <button
                onClick={() => handleSendText(currentText)}
                className="w-full flex items-center justify-center space-x-2 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span className="uppercase tracking-wider">Processar com Inteligência</span>
              </button>
            )}
          </div>

          {/* Action Loading */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 py-3 text-[#8A5A44] text-sm">
              <div className="w-4 h-4 border-2 border-[#B85C38] border-t-transparent rounded-full animate-spin" />
              <span>Interpretando intenção do oleiro...</span>
            </div>
          )}

          {/* Feedback Message */}
          {feedbackMsg && (
            <div className="p-3 bg-[#667052]/15 border border-[#667052]/30 text-[#4F583D] rounded-xl text-sm font-semibold text-center">
              {feedbackMsg}
            </div>
          )}

          {/* NLU Result Confirmation Card */}
          {nluResult && !isLoading && (
            <div className="bg-[#FAF6EF] border-2 border-[#B85C38] rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom duration-200 shadow-md">
              <div className="flex items-center justify-between border-b border-[#E7D5BE] pb-2">
                <span className="text-xs font-bold text-[#B85C38] uppercase tracking-wider flex items-center gap-1.5 font-brand-sans">
                  <Volume2 className="w-4 h-4 text-[#B85C38]" />
                  <span>Entendi:</span>
                </span>
                <span className="text-[10px] bg-[#667052]/15 text-[#4F583D] px-2 py-0.5 rounded-full font-bold">
                  {Math.round(nluResult.confidence * 100)}% precisão
                </span>
              </div>

              {/* Warning alert if discrepancy */}
              {nluResult.warning && (
                <div className="flex items-start space-x-2 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-amber-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>{nluResult.warning}</span>
                </div>
              )}

              {/* Missing Info Question */}
              {nluResult.needsMoreInfo && nluResult.questionToUser && (
                <div className="bg-[#F7F1E7] p-3 rounded-xl border border-[#D4BEA2] text-[#292724] text-sm font-semibold">
                  ❓ {nluResult.questionToUser}
                </div>
              )}

              {/* Query Result */}
              {nluResult.intent === 'QUERY' && nluResult.parsedData?.queryAnswer && (
                <div className="text-sm font-medium text-[#292724] leading-relaxed bg-[#F7F1E7] p-3 rounded-xl border border-[#E7D5BE]">
                  {nluResult.parsedData.queryAnswer}
                </div>
              )}

              {/* Action Summary & Edit mode */}
              {nluResult.intent !== 'QUERY' && (
                <div>
                  {editMode ? (
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#8A5A44] font-bold">Editar Resumo da Operação:</label>
                      <input
                        type="text"
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        className="w-full bg-[#F7F1E7] border border-[#B85C38] text-[#292724] rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  ) : (
                    <p className="text-base font-bold text-[#292724] bg-[#F7F1E7] p-3 rounded-xl border border-[#E7D5BE]">
                      {editedSummary}
                    </p>
                  )}
                </div>
              )}

              {/* Buttons */}
              {nluResult.intent !== 'QUERY' && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={handleConfirmAction}
                    className="flex items-center justify-center space-x-1 bg-[#667052] hover:bg-[#4F583D] text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar</span>
                  </button>

                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center justify-center space-x-1 bg-[#8A5A44] hover:bg-[#6E4533] text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{editMode ? 'Salvar' : 'Editar'}</span>
                  </button>

                  <button
                    onClick={() => setNluResult(null)}
                    className="flex items-center justify-center space-x-1 bg-[#E7D5BE] hover:bg-[#D4BEA2] text-[#292724] font-semibold py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual Text Input Option */}
          <div className="pt-2 border-t border-[#E7D5BE]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualText.trim()) handleSendText(manualText);
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Ou digite aqui (ex: Vendi 2 vasos por 360...)"
                className="flex-1 bg-[#F7F1E7] border border-[#E7D5BE] text-[#292724] placeholder-[#8A5A44]/60 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#B85C38]"
              />
              <button
                type="submit"
                disabled={isLoading || !manualText.trim()}
                className="bg-[#B85C38] hover:bg-[#9E4A2A] disabled:opacity-50 text-white p-2.5 rounded-xl transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
