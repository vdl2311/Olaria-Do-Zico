import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X, Edit3, AlertTriangle, Send, Sparkles, Volume2 } from 'lucide-react';
import { StorageService } from '../services/storage';
import { NluActionPayload } from '../types';

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

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Check if voice confirmation command in text
    if (nluResult) {
      const lower = textToSend.toLowerCase().trim();
      if (['sim', 'pode registrar', 'confirma', 'confirmar', 'ok', 'pode'].includes(lower)) {
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

      // Speak response if query or question
      if (result.intent === 'QUERY' && result.parsedData?.queryAnswer) {
        speakText(result.parsedData.queryAnswer);
      } else if (result.needsMoreInfo && result.questionToUser) {
        speakText(result.questionToUser);
      } else if (result.summary) {
        speakText(`${result.summary}. Confirmar?`);
      }

    } catch (err: any) {
      console.error(err);
      setFeedbackMsg('Erro ao conectar com assistente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
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

  const handleConfirmAction = () => {
    if (!nluResult) return;

    if (nluResult.intent === 'QUERY') {
      onClose();
      return;
    }

    // Apply edited summary if edited
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-amber-950 border border-amber-800 text-amber-50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-900/60 border-b border-amber-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-bold text-amber-100 text-base">Assistente da Olaria</h3>
              <p className="text-xs text-amber-300/80">Comando e Registro por Voz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-300 hover:text-white rounded-lg hover:bg-amber-800/60"
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
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-90 ${
                isListening
                  ? 'bg-red-600 text-white ring-8 ring-red-500/30 animate-pulse'
                  : 'bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white hover:scale-105'
              }`}
            >
              {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>
            <p className="mt-3 text-sm font-bold text-amber-100">
              {isListening ? 'Estou ouvindo... Fale naturalmente' : 'Toque no microfone para falar'}
            </p>

            {/* Quick Example Chips for One-Tap Testing */}
            <div className="mt-3 w-full">
              <p className="text-[11px] font-semibold text-amber-300/80 mb-2">Exemplos de voz (clique para simular):</p>
              <div className="flex flex-wrap gap-1.5 justify-center text-xs">
                {[
                  "Vendi 2 Vaso Espiral por 240 reais no Pix para Carlos",
                  "Produzi lote de 30 Vasos Espiral com 2 perdas na queima",
                  "Cliente Marcos comprou 150 reais no Fiado",
                  "Paguei 120 reais de conta de luz",
                  "Qual é o meu saldo e total a receber hoje?"
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setManualText(sample);
                      handleSendText(sample);
                    }}
                    className="bg-amber-900/80 hover:bg-amber-800 text-amber-200 border border-amber-700/60 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors text-left shadow-xs"
                  >
                    ⚡ "{sample}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Transcription or Input */}
          <div className="bg-amber-900/40 border border-amber-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
                O que você falou / digitou:
              </span>
              {currentText && (
                <button
                  onClick={() => { setTranscript(''); setManualText(''); setNluResult(null); }}
                  className="text-[11px] text-amber-300 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
            <p className="text-sm font-medium text-amber-100 min-h-[36px] italic">
              {currentText ? `"${currentText}"` : 'Aguardando voz ou texto...'}
            </p>
          </div>

          {/* Action Loading */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2 py-3 text-amber-300 text-sm">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Analisando intenção do oleiro...</span>
            </div>
          )}

          {/* Feedback Message */}
          {feedbackMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-sm font-medium text-center">
              {feedbackMsg}
            </div>
          )}

          {/* NLU Result Confirmation Card */}
          {nluResult && !isLoading && (
            <div className="bg-amber-900/80 border-2 border-amber-600 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom duration-200 shadow-md">
              <div className="flex items-center justify-between border-b border-amber-700/60 pb-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  {nluResult.intent === 'QUERY' ? 'Resposta do Assistente' : 'Interpretação do Sistema'}
                </span>
                <span className="text-[10px] bg-amber-800 text-amber-200 px-2 py-0.5 rounded-full font-semibold">
                  {Math.round(nluResult.confidence * 100)}% confiança
                </span>
              </div>

              {/* Warning alert if discrepancy */}
              {nluResult.warning && (
                <div className="flex items-start space-x-2 bg-amber-500/20 border border-amber-500/50 p-2.5 rounded-xl text-amber-200 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{nluResult.warning}</span>
                </div>
              )}

              {/* Missing Info Question */}
              {nluResult.needsMoreInfo && nluResult.questionToUser && (
                <div className="bg-amber-800/60 p-3 rounded-xl border border-amber-700 text-amber-100 text-sm font-semibold">
                  ❓ {nluResult.questionToUser}
                </div>
              )}

              {/* Query Result */}
              {nluResult.intent === 'QUERY' && nluResult.parsedData?.queryAnswer && (
                <div className="text-sm font-medium text-amber-100 leading-relaxed bg-amber-950/60 p-3 rounded-xl border border-amber-800">
                  {nluResult.parsedData.queryAnswer}
                </div>
              )}

              {/* Action Summary & Edit mode */}
              {nluResult.intent !== 'QUERY' && (
                <div>
                  {editMode ? (
                    <div className="space-y-1.5">
                      <label className="text-xs text-amber-300">Editar Resumo da Operação:</label>
                      <input
                        type="text"
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        className="w-full bg-amber-950 border border-amber-700 text-white rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  ) : (
                    <p className="text-base font-bold text-white bg-amber-950/70 p-3 rounded-xl border border-amber-800">
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
                    className="flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-sm transition-all shadow-md active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>CONFIRMAR</span>
                  </button>

                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center justify-center space-x-1 bg-amber-800 hover:bg-amber-700 text-amber-100 font-semibold py-2.5 px-3 rounded-xl text-sm transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{editMode ? 'SALVAR' : 'EDITAR'}</span>
                  </button>

                  <button
                    onClick={() => setNluResult(null)}
                    className="flex items-center justify-center space-x-1 bg-amber-900/60 hover:bg-amber-900 text-amber-300 font-semibold py-2.5 px-3 rounded-xl text-sm transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>CANCELAR</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual Text Input Option */}
          <div className="pt-2 border-t border-amber-900/60">
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
                placeholder="Ou digite sua frase aqui (ex: Vendi 2 vasos...)"
                className="flex-1 bg-amber-900/40 border border-amber-800 text-amber-100 placeholder-amber-400/60 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isLoading || !manualText.trim()}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all"
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
