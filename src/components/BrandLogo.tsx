import React from 'react';

interface BrandSymbolProps {
  className?: string;
  size?: number;
  color?: string; // Optional override
  variant?: 'terracota' | 'creme' | 'argila' | 'grafite' | 'oliva' | 'monochrome';
}

/**
 * Organic, minimalist ceramic vessel symbol combining:
 * - Vessel silhouette (Vaso)
 * - Flame curve (Fogo)
 * - Leaf / Nature curve (Terra / Folha)
 * - Clay coil curve (Argila)
 */
export const BrandSymbol: React.FC<BrandSymbolProps> = ({ 
  className = 'w-6 h-6', 
  size, 
  color,
  variant = 'terracota' 
}) => {
  let strokeColor = '#B85C38'; // Terracota default
  let accentColor = '#8A5A44'; // Argila

  if (color) {
    strokeColor = color;
    accentColor = color;
  } else if (variant === 'creme') {
    strokeColor = '#F7F1E7';
    accentColor = '#E7D5BE';
  } else if (variant === 'argila') {
    strokeColor = '#8A5A44';
    accentColor = '#B85C38';
  } else if (variant === 'grafite') {
    strokeColor = '#292724';
    accentColor = '#5C5852';
  } else if (variant === 'oliva') {
    strokeColor = '#667052';
    accentColor = '#4F583D';
  } else if (variant === 'monochrome') {
    strokeColor = 'currentColor';
    accentColor = 'currentColor';
  }

  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Símbolo Olaria"
    >
      {/* Outer Ceramic Vessel Organic Contour */}
      <path 
        d="M32 24 C32 20, 68 20, 68 24 C68 30, 62 36, 62 44 C62 56, 78 68, 76 82 C74 90, 60 92, 50 92 C40 92, 26 90, 24 82 C22 68, 38 56, 38 44 C38 36, 32 30, 32 24 Z" 
        stroke={strokeColor} 
        strokeWidth="4.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Internal Organic Curve (Flame + Clay Coil + Sprout) */}
      <path 
        d="M50 32 C55 42, 58 52, 52 64 C48 72, 42 76, 50 84 C56 74, 60 60, 52 46" 
        stroke={accentColor} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />

      {/* Vessel Rim Minimalist Lip */}
      <path 
        d="M30 22 C36 19, 64 19, 70 22" 
        stroke={strokeColor} 
        strokeWidth="4.5" 
        strokeLinecap="round" 
      />

      {/* Subtle organic dot / center of the kiln */}
      <circle cx="50" cy="52" r="3" fill={strokeColor} />
    </svg>
  );
};

interface BrandLogoProps {
  variant?: 'horizontal' | 'vertical' | 'symbol' | 'compact';
  theme?: 'light' | 'dark' | 'terracota' | 'argila';
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  const symbolVariant = isDark ? 'creme' : 'terracota';

  if (variant === 'symbol') {
    return <BrandSymbol variant={symbolVariant} className={className || 'w-8 h-8'} />;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        <div className="w-14 h-14 rounded-full bg-[#E7D5BE]/40 flex items-center justify-center p-2.5 border border-[#E7D5BE]">
          <BrandSymbol variant={symbolVariant} className="w-9 h-9" />
        </div>
        <div>
          <span className={`font-brand-serif text-2xl md:text-3xl font-bold tracking-wider block ${textColor}`}>
            OLARIA
          </span>
          {showTagline && (
            <span className={`font-brand-sans text-xs tracking-widest uppercase font-medium mt-0.5 block ${taglineColor}`}>
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
        <div className="w-9 h-9 rounded-xl bg-[#E7D5BE]/50 flex items-center justify-center p-1.5 border border-[#D4BEA2]/60 shrink-0">
          <BrandSymbol variant={symbolVariant} className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className={`font-brand-serif text-lg font-bold tracking-wide leading-tight block truncate ${textColor}`}>
            OLARIA
          </span>
          {showTagline && (
            <span className={`font-brand-sans text-[11px] tracking-tight block truncate ${taglineColor}`}>
              Da terra para transformar ambientes
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal Full Logo
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <div className="w-11 h-11 rounded-2xl bg-[#E7D5BE]/60 flex items-center justify-center p-2 border border-[#D4BEA2] shadow-xs shrink-0">
        <BrandSymbol variant={symbolVariant} className="w-7 h-7" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-brand-serif text-2xl font-black tracking-wider leading-none ${textColor}`}>
            OLARIA
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#667052]/15 text-[#4F583D] border border-[#667052]/30 uppercase tracking-wider font-brand-sans">
            Artesanal
          </span>
        </div>
        {showTagline && (
          <span className={`font-brand-sans text-xs tracking-wide block mt-1 ${taglineColor}`}>
            Da terra para transformar ambientes
          </span>
        )}
      </div>
    </div>
  );
};
