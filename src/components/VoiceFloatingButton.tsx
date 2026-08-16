import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceFloatingButtonProps {
  onClick: () => void;
}

export const VoiceFloatingButton: React.FC<VoiceFloatingButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-16 lg:bottom-8 right-3 sm:right-6 lg:right-8 z-30 font-brand-sans">
      <button
        onClick={onClick}
        className="group relative flex items-center space-x-2.5 bg-[#B85C38] hover:bg-[#9E4A2A] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-3 sm:py-3.5 rounded-full shadow-xl hover:shadow-[#8A5A44]/40 transition-all transform hover:scale-105 active:scale-95 border-2 border-[#CF734E]/60 cursor-pointer"
        title="Falar / Registrar por Voz"
      >
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E7D5BE] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F7F1E7]"></span>
        </span>
        <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-[#F7F1E7] shrink-0 animate-pulse" />
        <span className="tracking-wider uppercase font-bold hidden xs:inline">Falar</span>
        <span className="tracking-wider uppercase font-bold xs:hidden">Falar</span>
      </button>
    </div>
  );
};
