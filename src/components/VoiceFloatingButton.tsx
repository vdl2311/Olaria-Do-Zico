import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceFloatingButtonProps {
  onClick: () => void;
}

export const VoiceFloatingButton: React.FC<VoiceFloatingButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-16 lg:bottom-8 right-3 sm:right-6 lg:right-8 z-30">
      <button
        onClick={onClick}
        className="group relative flex items-center space-x-2 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-3 sm:py-3.5 rounded-full shadow-xl hover:shadow-amber-900/50 transition-all transform hover:scale-105 active:scale-95 border-2 border-amber-400/50"
      >
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100 shrink-0" />
        <span className="tracking-wide hidden xs:inline">REGISTRAR POR VOZ</span>
        <span className="tracking-wide xs:hidden">VOZ</span>
      </button>
    </div>
  );
};

