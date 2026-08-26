import React, { useState } from 'react';
import olariaLogoUrl from '../assets/images/favicon.png';

export const OLARIA_LOGO_SRC = olariaLogoUrl;

interface BrandSymbolProps {
  className?: string;
  size?: number;
  color?: string;
  variant?: 'terracota' | 'creme' | 'argila' | 'grafite' | 'oliva' | 'monochrome';
  useImage?: boolean;
}

/**
 * Ceramic medallion symbol combining:
 * - Real Favicon Badge Image (with terracotta rim, beige ceramic interior, rising flame/steam, olive green leaf)
 * - High fidelity Ceramic vector badge fallback
 */
export const BrandSymbol: React.FC<BrandSymbolProps> = ({ 
  className = 'w-10 h-10', 
  size, 
  color,
  variant = 'terracota',
  useImage = true
}) => {
  const [imageError, setImageError] = useState(false);

  const style = size ? { width: size, height: size } : undefined;

  // Render high-res favicon image badge if requested and available
  if (useImage && !imageError) {
    return (
      <img
        src={olariaLogoUrl || '/favicon.png'}
        alt="Símbolo Olaria"
        style={style}
        className={`object-contain shrink-0 select-none drop-shadow-md ${className}`}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
    );
  }

  let strokeColor = '#B85C38';
  let accentColor = '#8A5A44';
  let leafColor = '#4F583D';

  if (color) {
    strokeColor = color;
    accentColor = color;
    leafColor = color;
  } else if (variant === 'creme') {
    strokeColor = '#F7F1E7';
    accentColor = '#E7D5BE';
    leafColor = '#D4BEA2';
  } else if (variant === 'argila') {
    strokeColor = '#8A5A44';
    accentColor = '#B85C38';
    leafColor = '#667052';
  } else if (variant === 'grafite') {
    strokeColor = '#292724';
    accentColor = '#5C5852';
    leafColor = '#292724';
  } else if (variant === 'oliva') {
    strokeColor = '#667052';
    accentColor = '#4F583D';
    leafColor = '#4F583D';
  } else if (variant === 'monochrome') {
    strokeColor = 'currentColor';
    accentColor = 'currentColor';
    leafColor = 'currentColor';
  }

  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Símbolo Olaria"
    >
      {/* Outer Ceramic Medal Ring */}
      <circle cx="50" cy="50" r="46" stroke={strokeColor} strokeWidth="6" fill="#FAF6EF" />
      <circle cx="50" cy="50" r="41" stroke="#E7D5BE" strokeWidth="1.5" />

      {/* Stylized Pottery Vessel Outline */}
      <path 
        d="M34 38 C30 46, 38 60, 48 76 C52 76, 60 68, 64 56 C68 48, 60 40, 56 38" 
        stroke={strokeColor} 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Rising Smoke / Steam / Flame Curves */}
      <path 
        d="M50 18 C52 24, 46 28, 50 34 C54 30, 48 24, 50 18 Z" 
        fill={strokeColor} 
      />
      <path 
        d="M58 30 C64 34, 66 42, 60 48" 
        stroke={accentColor} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />

      {/* Ceramic Leaf Element */}
      <path 
        d="M48 76 C58 72, 72 60, 74 52 C72 66, 62 76, 38 78 C42 77, 46 76, 48 76 Z" 
        fill={leafColor} 
      />
    </svg>
  );
};

interface BrandLogoProps {
  variant?: 'horizontal' | 'vertical' | 'symbol' | 'compact' | 'hero';
  theme?: 'light' | 'dark' | 'terracota' | 'argila';
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  theme = 'light',
  className = '',
  showTagline = true,
  size = 'md'
}) => {
  const isDark = theme === 'dark' || theme === 'argila' || theme === 'terracota';
  const textColor = isDark ? 'text-[#F7F1E7]' : 'text-[#292724]';
  const taglineColor = isDark ? 'text-[#E7D5BE]/80' : 'text-[#8A5A44]';

  if (variant === 'symbol') {
    return <BrandSymbol className={className || 'w-12 h-12'} />;
  }

  // Large Hero badge
  if (variant === 'hero') {
    return (
      <div className={`flex flex-col items-center text-center gap-3.5 ${className}`}>
        <img
          src={olariaLogoUrl}
          alt="Logotipo Olaria do Zico"
          className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain drop-shadow-xl select-none"
          referrerPolicy="no-referrer"
        />
        <div>
          <span className={`font-brand-serif text-3xl sm:text-4xl font-black tracking-wider block ${textColor}`}>
            OLARIA DO ZICO
          </span>
          {showTagline && (
            <span className={`font-brand-sans text-sm sm:text-base tracking-widest uppercase font-bold mt-1 block ${taglineColor}`}>
              Da terra para transformar ambientes
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <img
          src={olariaLogoUrl}
          alt="Logotipo Olaria do Zico"
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-lg select-none"
          referrerPolicy="no-referrer"
        />
        <div>
          <span className={`font-brand-serif text-2xl sm:text-3xl font-black tracking-wider block ${textColor}`}>
            OLARIA DO ZICO
          </span>
          {showTagline && (
            <span className={`font-brand-sans text-xs sm:text-sm tracking-wider uppercase font-semibold mt-0.5 block ${taglineColor}`}>
              Da terra para transformar ambientes
            </span>
          )}
        </div>
      </div>
    );
  }

  // Compact version for top header
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={olariaLogoUrl}
          alt="Olaria"
          className="w-11 h-11 sm:w-13 sm:h-13 object-contain shrink-0 drop-shadow-md select-none"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0">
          <span className={`font-brand-serif text-lg sm:text-xl font-black tracking-wide leading-tight block truncate ${textColor}`}>
            OLARIA DO ZICO
          </span>
          {showTagline && (
            <span className={`font-brand-sans text-xs font-medium tracking-tight block truncate ${taglineColor}`}>
              Da terra para transformar ambientes
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal Full Logo (Grandes dimensões)
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <img
        src={olariaLogoUrl}
        alt="Logotipo Olaria"
        className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 drop-shadow-lg select-none"
        referrerPolicy="no-referrer"
      />
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-brand-serif text-2xl sm:text-3xl font-black tracking-wider leading-none ${textColor}`}>
            OLARIA DO ZICO
          </span>
          <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#667052]/20 text-[#4F583D] dark:text-[#A4B38A] border border-[#667052]/30 uppercase tracking-wider font-brand-sans">
            Artesanal
          </span>
        </div>
        {showTagline && (
          <span className={`font-brand-sans text-xs sm:text-sm font-semibold tracking-wide block mt-1.5 ${taglineColor}`}>
            Da terra para transformar ambientes
          </span>
        )}
      </div>
    </div>
  );
};
