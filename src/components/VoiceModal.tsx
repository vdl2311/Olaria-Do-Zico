import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X, Edit3, AlertTriangle, Send, Volume2 } from 'lucide-react';
import { StorageService } from '../services/storage';
import { VoiceNluService } from '../services/voiceNluService';
import { NluActionPayload } from '../types';
import { BrandSymbol } from './BrandLogo';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
      setFeedbackMsg('Seu navegador não suporta reconhecimento de voz nativo. Use o campo de texto abaixo.');
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

      const result = await VoiceNluService.processVoiceCommand(textToSend, {
        products: products.map(p => ({ name: p.name, stock: p.stock, price: p.price })),
        customers: customers.map(c => ({ name: c.name }))
      });

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
      setFeedbackMsg('Não foi possível interpretar o comando. Tente com palavras como "Vendi", "Produzi" ou "Paguei".');
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Assistente da Olaria"
      description="Registro Rápido por Comando de Voz"
      size="lg"
    >
      <div className="space-y-4 font-brand-sans">
        {/* Visual Microphone Section */}
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? "Parar gravação de voz" : "Iniciar gravação de voz"}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-90 cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white ring-8 ring-rose-500/30 animate-pulse'
                : 'bg-[#B85C38] dark:bg-[#C66B48] hover:bg-[#9E4A2A] dark:hover:bg-[#D67855] text-white hover:scale-105 border-2 border-[#CF734E] dark:border-[#D67855]'
            }`}
          >
            {isListening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
          </button>
          <p className="mt-3 text-sm font-bold text-[#292724] dark:text-[#F2EBDD]">
            {isListening ? 'Estou ouvindo... Pode falar naturalmente' : 'Toque no microfone para Falar'}
          </p>
          <p className="text-xs text-[#8A5A44] dark:text-[#C9BFA8]">
            {isListening ? 'Diga vendas, fornos, entregas ou despesas' : 'Ou toque em um exemplo abaixo:'}
          </p>

          {/* Quick Example Chips for One-Tap Testing */}
          <div className="mt-3 w-full">
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
                  type="button"
                  onClick={() => {
                    setManualText(sample);
                    handleSendText(sample);
                  }}
                  className="bg-[#F7F1E7] dark:bg-[#2E2A26] hover:bg-[#E7D5BE] dark:hover:bg-[#3D3833] text-[#292724] dark:text-[#F2EBDD] border border-[#D4BEA2] dark:border-[#3D3833] px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors text-left shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B85C38]"
                >
                  🏺 "{sample}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Transcription or Input */}
        <div className="bg-[#F7F1E7] dark:bg-[#252320] border border-[#E7D5BE] dark:border-[#3D3833] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-[#8A5A44] dark:text-[#C9BFA8] tracking-wider font-brand-sans">
              O que você falou / digitou:
            </span>
            {currentText && (
              <button
                type="button"
                onClick={() => { setTranscript(''); setManualText(''); setNluResult(null); }}
                className="text-[11px] text-[#B85C38] dark:text-[#C66B48] hover:underline cursor-pointer font-bold"
              >
                Limpar
              </button>
            )}
          </div>
          <p className="text-sm font-medium text-[#292724] dark:text-[#F2EBDD] min-h-[36px] italic">
            {currentText ? `"${currentText}"` : 'Aguardando sua fala ou digitação...'}
          </p>

          {/* Prominent Send/Process Button for Audio/Text */}
          {currentText && !nluResult && !isLoading && (
            <Button
              type="button"
              onClick={() => handleSendText(currentText)}
              variant="primary"
              size="md"
              icon={Send}
              className="w-full uppercase tracking-wider"
            >
              Processar com Inteligência
            </Button>
          )}
        </div>

        {/* Action Loading */}
        {isLoading && (
          <div className="flex items-center justify-center space-x-2 py-3 text-[#8A5A44] dark:text-[#C9BFA8] text-sm font-semibold">
            <div className="w-4 h-4 border-2 border-[#B85C38] dark:border-[#C66B48] border-t-transparent rounded-full animate-spin" />
            <span>Interpretando intenção da olaria...</span>
          </div>
        )}

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className="p-3 bg-[#667052]/15 dark:bg-[#2D3326] border border-[#667052]/30 dark:border-[#3D4634] text-[#4F583D] dark:text-[#A4B38A] rounded-xl text-xs sm:text-sm font-semibold text-center">
            {feedbackMsg}
          </div>
        )}

        {/* NLU Result Confirmation Card */}
        {nluResult && !isLoading && (
          <div className="bg-[#FAF6EF] dark:bg-[#252320] border-2 border-[#B85C38] dark:border-[#C66B48] rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-[#E7D5BE] dark:border-[#3D3833] pb-2">
              <span className="text-xs font-bold text-[#B85C38] dark:text-[#C66B48] uppercase tracking-wider flex items-center gap-1.5 font-brand-sans">
                <Volume2 className="w-4 h-4 text-[#B85C38] dark:text-[#C66B48]" />
                <span>Entendi:</span>
              </span>
              <span className="text-[10px] bg-[#667052]/15 dark:bg-[#2D3326] text-[#4F583D] dark:text-[#A4B38A] px-2 py-0.5 rounded-full font-bold">
                {Math.round(nluResult.confidence * 100)}% precisão
              </span>
            </div>

            {/* Missing Info Question */}
            {nluResult.needsMoreInfo && nluResult.questionToUser && (
              <div className="bg-[#F7F1E7] dark:bg-[#2E2A26] p-3 rounded-xl border border-[#D4BEA2] dark:border-[#3D3833] text-[#292724] dark:text-[#F2EBDD] text-xs sm:text-sm font-semibold">
                ❓ {nluResult.questionToUser}
              </div>
            )}

            {/* Query Result */}
            {nluResult.intent === 'QUERY' && nluResult.parsedData?.queryAnswer && (
              <div className="text-xs sm:text-sm font-medium text-[#292724] dark:text-[#F2EBDD] leading-relaxed bg-[#F7F1E7] dark:bg-[#2E2A26] p-3 rounded-xl border border-[#E7D5BE] dark:border-[#3D3833]">
                {nluResult.parsedData.queryAnswer}
              </div>
            )}

            {/* Action Summary & Edit mode */}
            {nluResult.intent !== 'QUERY' && (
              <div>
                {editMode ? (
                  <div className="space-y-1.5">
                    <label htmlFor="voice-summary-edit" className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] font-bold">
                      Editar Resumo da Operação:
                    </label>
                    <Input
                      id="voice-summary-edit"
                      type="text"
                      value={editedSummary}
                      onChange={(e) => setEditedSummary(e.target.value)}
                    />
                  </div>
                ) : (
                  <p className="text-sm font-bold text-[#292724] dark:text-[#F2EBDD] bg-[#F7F1E7] dark:bg-[#2E2A26] p-3 rounded-xl border border-[#E7D5BE] dark:border-[#3D3833]">
                    {editedSummary}
                  </p>
                )}
              </div>
            )}

            {/* Buttons */}
            {nluResult.intent !== 'QUERY' && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handleConfirmAction}
                  variant="primary"
                  size="sm"
                  icon={Check}
                >
                  Confirmar
                </Button>

                <Button
                  type="button"
                  onClick={() => setEditMode(!editMode)}
                  variant="secondary"
                  size="sm"
                  icon={Edit3}
                >
                  {editMode ? 'Salvar' : 'Editar'}
                </Button>

                <Button
                  type="button"
                  onClick={() => setNluResult(null)}
                  variant="ghost"
                  size="sm"
                  icon={X}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Manual Text Input Option */}
        <div className="pt-2 border-t border-[#E7D5BE] dark:border-[#3D3833]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualText.trim()) handleSendText(manualText);
            }}
            className="flex items-center space-x-2"
          >
            <Input
              id="voice-manual-input"
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Ou digite aqui (ex: Vendi 2 vasos por 360...)"
              aria-label="Texto do comando de voz"
            />
            <Button
              type="submit"
              disabled={isLoading || !manualText.trim()}
              variant="primary"
              size="md"
              icon={Send}
              ariaLabel="Enviar texto do comando"
            />
          </form>
        </div>
      </div>
    </Modal>
  );
};
