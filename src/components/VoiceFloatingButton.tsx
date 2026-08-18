import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceFloatingButtonProps {
  onClick: () => void;
}

export const VoiceFloatingButton: React.FC<VoiceFloatingButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-20 lg:bottom-8 right-3 sm:right-6 lg:right-8 z-30 font-brand-sans">
      <button
        type="button"
        onClick={onClick}
        aria-label="Abrir assistente de voz para registrar vendas e comandos"
        className="group relative flex items-center space-x-2 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-full shadow-xl hover:shadow-[#8A5A44]/40 transition-all transform hover:scale-105 active:scale-95 border-2 border-[#CF734E]/80 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B85C38]"
        title="Falar / Registrar por Voz"
      >
        <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E7D5BE] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-[#F7F1E7]"></span>
        </span>
        <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-[#F7F1E7] shrink-0 animate-pulse" />
        <span className="tracking-wider uppercase font-bold text-xs sm:text-sm">Falar</span>
      </button>
    </div>
  );
};
