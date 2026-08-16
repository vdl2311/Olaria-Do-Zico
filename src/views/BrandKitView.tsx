import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Layers, 
  Tag, 
  Package, 
  Instagram, 
  MessageSquare, 
  Shirt, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Printer, 
  QrCode, 
  Flame, 
  Feather, 
  Compass, 
  FileText,
  Share2,
  BookOpen
} from 'lucide-react';
import { BrandLogo, BrandSymbol } from '../components/BrandLogo';
import { StorageService } from '../services/storage';

interface ColorCardProps {
  name: string;
  hex: string;
  role: string;
  usage: string[];
  isDark?: boolean;
  border?: boolean;
}

const ColorCard: React.FC<ColorCardProps> = ({ name, hex, role, usage, isDark, border }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#FAF6EF] rounded-2xl border border-[#E7D5BE] p-4 flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-1">
      <div>
        <div 
          className={`h-24 rounded-xl mb-3.5 flex items-end justify-between p-3 transition-shadow ${border ? 'border border-[#D4BEA2]' : ''}`}
          style={{ backgroundColor: hex }}
        >
          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-[#292724]'}`}>
            {hex}
          </span>
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-black/10 hover:bg-black/20 text-[#292724]'}`}
            title="Copiar código HEX"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <h4 className="font-brand-serif font-bold text-lg text-[#292724] leading-snug">{name}</h4>
        <p className="text-xs font-medium text-[#8A5A44] mb-2">{role}</p>
        <div className="space-y-1">
          {usage.map((u, i) => (
            <span key={i} className="inline-block text-[11px] bg-[#E7D5BE]/40 text-[#5C5852] px-2 py-0.5 rounded-md mr-1 mb-1 font-medium">
              {u}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[#E7D5BE]/60 flex items-center justify-between text-[11px] text-[#8A5A44]">
        <span>{copied ? 'Código copiado!' : 'Clique para copiar HEX'}</span>
        <span className="font-mono">{hex}</span>
      </div>
    </div>
  );
};

export const BrandKitView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'essencia' | 'logo' | 'cores' | 'tipografia' | 'etiquetas' | 'redes' | 'whatsapp' | 'uniformes' | 'manual'>('essencia');
  const [selectedProductForLabel, setSelectedProductForLabel] = useState<string>('all');
  const [copiedPhraseIndex, setCopiedPhraseIndex] = useState<number | null>(null);

  const products = StorageService.getProducts();

  const brandPhrases = [
    { title: 'Slogan Principal', text: 'Da terra para transformar ambientes.' },
    { title: 'Alternativa 1', text: 'Feito à mão. Feito para durar.' },
    { title: 'Alternativa 2', text: 'Terra, fogo e arte em cada peça.' },
    { title: 'Alternativa 3', text: 'Peças que dão vida aos espaços.' },
    { title: 'Alternativa 4', text: 'O feito à mão que transforma o ambiente.' }
  ];

  const handleCopyPhrase = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPhraseIndex(index);
    setTimeout(() => setCopiedPhraseIndex(null), 2000);
  };

  const downloadSvgLogo = (variant: string) => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120">
  <rect width="100%" height="100%" fill="${variant === 'dark' ? '#292724' : '#F7F1E7'}"/>
  <g transform="translate(20, 20)">
    <path d="M20 16 C20 12, 44 12, 44 16 C44 20, 40 24, 40 30 C40 38, 52 46, 50 54 C48 60, 40 62, 32 62 C24 62, 16 60, 14 54 C12 46, 24 38, 24 30 C24 24, 20 20, 20 16 Z" stroke="${variant === 'dark' ? '#F7F1E7' : '#B85C38'}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M32 22 C36 28, 38 34, 34 42 C32 48, 28 50, 32 56" stroke="${variant === 'dark' ? '#E7D5BE' : '#8A5A44'}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="35" r="2" fill="${variant === 'dark' ? '#F7F1E7' : '#B85C38'}"/>
  </g>
  <text x="95" y="55" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="${variant === 'dark' ? '#F7F1E7' : '#292724'}" letter-spacing="3">OLARIA</text>
  <text x="95" y="78" font-family="sans-serif" font-size="11" font-weight="500" fill="${variant === 'dark' ? '#E7D5BE' : '#8A5A44'}" letter-spacing="1">DA TERRA PARA TRANSFORMAR AMBIENTES</text>
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `olaria-logo-${variant}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintLabels = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Brand Header Banner */}
      <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
          <BrandSymbol size={340} variant="terracota" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B85C38]/10 text-[#B85C38] border border-[#B85C38]/20 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Brand Kit & Manual de Identidade</span>
          </div>

          <h2 className="font-brand-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#292724] tracking-tight leading-tight">
            Da terra para transformar ambientes.
          </h2>

          <p className="mt-3 text-sm sm:text-base text-[#8A5A44] leading-relaxed">
            Guia completo de aplicação visual, paleta de cores, tipografia, regras de logotipo, 
            embalagens, etiquetas com QR Code e materiais institucionais da Olaria.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E7D5BE]/40 border border-[#D4BEA2]/60 text-xs font-bold text-[#292724]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B85C38]"></span>
              <span>Terracota #B85C38</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E7D5BE]/40 border border-[#D4BEA2]/60 text-xs font-bold text-[#292724]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8A5A44]"></span>
              <span>Argila #8A5A44</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E7D5BE]/40 border border-[#D4BEA2]/60 text-xs font-bold text-[#292724]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#667052]"></span>
              <span>Verde Oliva #667052</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E7D5BE]/40 border border-[#D4BEA2]/60 text-xs font-bold text-[#292724]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F7F1E7] border border-[#8A5A44]"></span>
              <span>Creme #F7F1E7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E7D5BE] scrollbar-none">
        {[
          { id: 'essencia', label: '1. Essência & Conceito', icon: Feather },
          { id: 'logo', label: '2. Logotipo & Símbolo', icon: Layers },
          { id: 'cores', label: '3. Paleta de Cores', icon: Palette },
          { id: 'tipografia', label: '4. Tipografia', icon: Type },
          { id: 'etiquetas', label: '5. Etiquetas & Tags', icon: Tag },
          { id: 'redes', label: '6. Redes Sociais & Catálogo', icon: Instagram },
          { id: 'whatsapp', label: '7. WhatsApp Business', icon: MessageSquare },
          { id: 'uniformes', label: '8. Embalagens & Uniforme', icon: Package },
          { id: 'manual', label: '9. Tom de Voz & Regras', icon: BookOpen }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#B85C38] text-white shadow-sm'
                  : 'bg-[#FAF6EF] text-[#8A5A44] hover:text-[#292724] hover:bg-[#E7D5BE]/50 border border-[#E7D5BE]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Essência & Conceito */}
      {activeTab === 'essencia' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FAF6EF] rounded-2xl border border-[#E7D5BE] p-6 shadow-xs relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#8A5A44]/10 flex items-center justify-center text-[#8A5A44] mb-4 font-bold text-xl">
                1
              </div>
              <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-2">TERRA</h3>
              <p className="text-xs text-[#8A5A44] font-semibold uppercase tracking-wider mb-2">A Matéria-Prima</p>
              <p className="text-sm text-[#5C5852] leading-relaxed">
                A argila pura extraída do solo fértil. A base mineral, orgânica e palpável que dá substância e sustentação a cada peça cerâmica.
              </p>
            </div>

            <div className="bg-[#FAF6EF] rounded-2xl border border-[#E7D5BE] p-6 shadow-xs relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#B85C38]/10 flex items-center justify-center text-[#B85C38] mb-4 font-bold text-xl">
                2
              </div>
              <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-2">FOGO</h3>
              <p className="text-xs text-[#B85C38] font-semibold uppercase tracking-wider mb-2">O Processo Artesanal</p>
              <p className="text-sm text-[#5C5852] leading-relaxed">
                A queima lenta nos fornos a 950°C. O calor que endurece a terra, transforma a água e sela a resistência para gerações.
              </p>
            </div>

            <div className="bg-[#FAF6EF] rounded-2xl border border-[#E7D5BE] p-6 shadow-xs relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#667052]/10 flex items-center justify-center text-[#667052] mb-4 font-bold text-xl">
                3
              </div>
              <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-2">FORMA</h3>
              <p className="text-xs text-[#667052] font-semibold uppercase tracking-wider mb-2">O Resultado nos Ambientes</p>
              <p className="text-sm text-[#5C5852] leading-relaxed">
                Vasos, fontes, jardineiras e peças especiais que trazem vida, textura e sofisticação orgânica para casas, varandas e jardins.
              </p>
            </div>
          </div>

          {/* Personality Matrix */}
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-4">Personalidade da Marca</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#F7F1E7] border border-[#E7D5BE] text-center">
                <span className="font-brand-serif text-xl font-bold text-[#B85C38] block mb-1">Artesanal</span>
                <span className="text-xs text-[#5C5852]">Feito no torno, toque humano, marcas autênticas</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F1E7] border border-[#E7D5BE] text-center">
                <span className="font-brand-serif text-xl font-bold text-[#8A5A44] block mb-1">Contemporânea</span>
                <span className="text-xs text-[#5C5852]">Design limpo que dialoga com a arquitetura moderna</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F1E7] border border-[#E7D5BE] text-center">
                <span className="font-brand-serif text-xl font-bold text-[#667052] block mb-1">Acolhedora</span>
                <span className="text-xs text-[#5C5852]">Cores quentes da terra que transmitem afeto e aconchego</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F1E7] border border-[#E7D5BE] text-center">
                <span className="font-brand-serif text-xl font-bold text-[#292724] block mb-1">Confiável</span>
                <span className="text-xs text-[#5C5852]">Durabilidade comprovada, queima perfeita e alta resistência</span>
              </div>
            </div>
          </div>

          {/* Slogans & Phrases */}
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-2">Frases e Slogans Oficiais</h3>
            <p className="text-xs text-[#8A5A44] mb-6">Utilize estas frases em catálogos, embalagens, posts e comunicações.</p>

            <div className="space-y-3">
              {brandPhrases.map((phrase, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-[#F7F1E7] border border-[#E7D5BE] hover:border-[#B85C38]/40 transition-colors">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A44] block mb-0.5">
                      {phrase.title}
                    </span>
                    <span className="font-brand-serif text-base sm:text-lg font-bold text-[#292724]">
                      "{phrase.text}"
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyPhrase(phrase.text, idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E7D5BE]/60 hover:bg-[#E7D5BE] text-[#292724] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    {copiedPhraseIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Logotipo & Símbolo */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-brand-serif text-2xl font-bold text-[#292724]">Versões Oficiais do Logotipo</h3>
                <p className="text-xs text-[#8A5A44]">Símbolo estilizado: vaso orgânico + chama do fogo + folha da natureza + espiral de argila.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadSvgLogo('light')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#B85C38] text-white text-xs font-bold hover:bg-[#9E4A2A] transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar SVG (Claro)</span>
                </button>
                <button
                  onClick={() => downloadSvgLogo('dark')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#292724] text-[#F7F1E7] text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar SVG (Escuro)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. Horizontal Principal */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE] flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A5A44] mb-4">1. Logo Principal Horizontal</div>
                <div className="py-8 flex items-center justify-center">
                  <BrandLogo variant="horizontal" theme="light" />
                </div>
                <div className="text-xs text-[#5C5852] mt-4 pt-3 border-t border-[#E7D5BE]">
                  Uso principal: cabeçalhos, faturas, documentos e site.
                </div>
              </div>

              {/* 2. Vertical */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE] flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A5A44] mb-4">2. Logo Vertical / Selo</div>
                <div className="py-6 flex items-center justify-center">
                  <BrandLogo variant="vertical" theme="light" />
                </div>
                <div className="text-xs text-[#5C5852] mt-4 pt-3 border-t border-[#E7D5BE]">
                  Uso: sacolas, etiquetas, verso de uniformes e catálogos.
                </div>
              </div>

              {/* 3. Símbolo Isolado */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE] flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A5A44] mb-4">3. Símbolo Isolado (Ícone)</div>
                <div className="py-6 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#E7D5BE]/50 flex items-center justify-center border border-[#D4BEA2]">
                    <BrandSymbol size={48} variant="terracota" />
                  </div>
                </div>
                <div className="text-xs text-[#5C5852] mt-4 pt-3 border-t border-[#E7D5BE]">
                  Uso: favicon, foto de perfil WhatsApp, Instagram, carimbo físico.
                </div>
              </div>

              {/* 4. Versão Escura (Sobre Grafite) */}
              <div className="p-6 rounded-2xl bg-[#292724] border border-black flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#E7D5BE] mb-4">4. Versão Clara p/ Fundo Escuro</div>
                <div className="py-8 flex items-center justify-center">
                  <BrandLogo variant="horizontal" theme="dark" />
                </div>
                <div className="text-xs text-[#E7D5BE]/70 mt-4 pt-3 border-t border-white/10">
                  Uso: embalagens escuras, displays noturnos, eventos e redes.
                </div>
              </div>

              {/* 5. Versão Sobre Terracota */}
              <div className="p-6 rounded-2xl bg-[#B85C38] border border-[#9E4A2A] flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#F7F1E7] mb-4">5. Versão Sobre Terracota</div>
                <div className="py-8 flex items-center justify-center">
                  <BrandLogo variant="horizontal" theme="terracota" />
                </div>
                <div className="text-xs text-[#F7F1E7]/80 mt-4 pt-3 border-t border-white/10">
                  Uso: cartões de visita institucionais, fitas de embalagem e sacolas.
                </div>
              </div>

              {/* 6. Versão Monocromática Grafite */}
              <div className="p-6 rounded-2xl bg-[#FAF6EF] border border-[#E7D5BE] flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#5C5852] mb-4">6. Monocromático / Carimbo</div>
                <div className="py-8 flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <BrandSymbol size={32} variant="grafite" />
                    <div>
                      <span className="font-brand-serif text-2xl font-black tracking-wider text-[#292724] block">OLARIA</span>
                      <span className="font-brand-sans text-[10px] tracking-wider uppercase text-[#5C5852] font-semibold">Peças Artesanais</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-[#5C5852] mt-4 pt-3 border-t border-[#E7D5BE]">
                  Uso: carimbo a fogo na madeira/barro, notas térmicas e gravações.
                </div>
              </div>
            </div>
          </div>

          {/* Símbolo Guidelines */}
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-4">Construção e Proporções do Símbolo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#5C5852]">
              <div className="p-4 rounded-xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <h4 className="font-bold text-[#292724] mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Regras de Ouro
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-xs">
                  <li>Manter área de respiro mínima equivalente a 50% da altura do símbolo em volta.</li>
                  <li>O símbolo deve ser legível mesmo em 16x16px (favicon e badges).</li>
                  <li>Nunca distorcer horizontalmente ou verticalmente as proporções.</li>
                  <li>Evitar aplicar sobre fundos com fotos poluídas sem máscara protetora.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <h4 className="font-bold text-[#292724] mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B85C38]"></span>
                  Elementos Integrados
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-xs">
                  <li><strong>Contorno:</strong> O vaso bojudo cerâmico artesanal.</li>
                  <li><strong>Chama central:</strong> O fogo que transforma o barro no forno.</li>
                  <li><strong>Curva superior:</strong> A folha que remete à terra e natureza.</li>
                  <li><strong>Ponto central:</strong> O centro do torno e o coração da olaria.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Paleta de Cores */}
      {activeTab === 'cores' && (
        <div className="space-y-6">
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="font-brand-serif text-2xl font-bold text-[#292724]">Paleta Oficial de Cores</h3>
              <p className="text-xs text-[#8A5A44]">Valores HEX e RGB calibrados para contraste WCAG AA e fidelidade artesanal.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ColorCard
                name="Terracota"
                hex="#B85C38"
                role="Cor Principal"
                isDark={true}
                usage={['Logotipo', 'Botões Principais', 'Destaques', 'Embalagens', 'Redes']}
              />
              <ColorCard
                name="Argila"
                hex="#8A5A44"
                role="Cor Secundária"
                isDark={true}
                usage={['Navegação', 'Textos Secundários', 'Fundos Escuros', 'Bordas Fortes']}
              />
              <ColorCard
                name="Areia"
                hex="#E7D5BE"
                role="Cor de Apoio"
                border={true}
                usage={['Bordas de Cards', 'Fundos de Badges', 'Papel Kraft', 'Embalagens']}
              />
              <ColorCard
                name="Creme"
                hex="#F7F1E7"
                role="Fundo Principal da Interface"
                border={true}
                usage={['Fundo do Sistema', 'Catálogos', 'Apresentações', 'T-shirts']}
              />
              <ColorCard
                name="Verde Oliva"
                hex="#667052"
                role="Cor Complementar (Jardim & Natureza)"
                isDark={true}
                usage={['Vasos & Jardins', 'Tags de Plantas', 'Status de Estoque', 'Destaques']}
              />
              <ColorCard
                name="Grafite"
                hex="#292724"
                role="Cor de Texto e Contraste"
                isDark={true}
                usage={['Títulos', 'Textos de Interface', 'Contraste Máximo', 'Carimbos']}
              />
            </div>
          </div>

          {/* Combinações Recomendadas */}
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-4">Combinações Recomendadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Combinação 1 */}
              <div className="p-5 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-4 h-4 rounded-full bg-[#B85C38]"></span>
                  <span className="w-4 h-4 rounded-full bg-[#F7F1E7] border border-[#D4BEA2]"></span>
                  <span className="w-4 h-4 rounded-full bg-[#E7D5BE]"></span>
                </div>
                <h4 className="font-brand-serif font-bold text-lg text-[#292724]">Combinação Principal</h4>
                <p className="text-xs text-[#8A5A44] font-semibold mb-2">Terracota + Creme + Areia</p>
                <p className="text-xs text-[#5C5852]">Ideal para a interface do sistema, botões primários, cabeçalhos e telas de vendas.</p>
              </div>

              {/* Combinação 2 */}
              <div className="p-5 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-4 h-4 rounded-full bg-[#B85C38]"></span>
                  <span className="w-4 h-4 rounded-full bg-[#667052]"></span>
                  <span className="w-4 h-4 rounded-full bg-[#F7F1E7] border border-[#D4BEA2]"></span>
                </div>
                <h4 className="font-brand-serif font-bold text-lg text-[#292724]">Combinação Secundária</h4>
                <p className="text-xs text-[#667052] font-semibold mb-2">Terracota + Verde Oliva + Creme</p>
                <p className="text-xs text-[#5C5852]">Ideal para materiais de paisagismo, linhas de jardinagem, vasos decorados e áreas externas.</p>
              </div>

              {/* Combinação 3 */}
              <div className="p-5 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-4 h-4 rounded-full bg-[#8A5A44]"></span>
                  <span className="w-4 h-4 rounded-full bg-[#F7F1E7] border border-[#D4BEA2]"></span>
                  <span className="w-4 h-4 rounded-full bg-[#B85C38]"></span>
                </div>
                <h4 className="font-brand-serif font-bold text-lg text-[#292724]">Combinação Premium</h4>
                <p className="text-xs text-[#8A5A44] font-semibold mb-2">Argila + Creme + Terracota</p>
                <p className="text-xs text-[#5C5852]">Ideal para projetos com arquitetos, peças sob encomenda especial e apresentações institucionais.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Tipografia */}
      {activeTab === 'tipografia' && (
        <div className="space-y-6">
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-2">Tipografia Oficial</h3>
            <p className="text-xs text-[#8A5A44] mb-6">O par tipográfico perfeito: a sofisticação da Playfair Display com a legibilidade da DM Sans.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Playfair Display */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B85C38] bg-[#B85C38]/10 px-2.5 py-1 rounded-md">
                    Destaques & Títulos
                  </span>
                  <span className="text-xs text-[#8A5A44]">Google Font</span>
                </div>
                <h4 className="font-brand-serif text-4xl font-bold text-[#292724] mb-1">Playfair Display</h4>
                <p className="text-xs text-[#8A5A44] mb-4">Serifada elegante, autoral e com forte presença visual.</p>

                <div className="space-y-4 pt-4 border-t border-[#E7D5BE]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A5A44]">TÍTULO PRINCIPAL (H1)</span>
                    <p className="font-brand-serif text-3xl font-black text-[#292724] leading-tight">
                      Da terra para transformar ambientes.
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A5A44]">SUBTÍTULO / SLOGAN (H2)</span>
                    <p className="font-brand-serif text-xl font-bold text-[#8A5A44] italic">
                      "Feito à mão no torno com queima lenta a 950°C."
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A5A44]">CARACTERES & GLIFOS</span>
                    <p className="font-brand-serif text-lg text-[#292724]">
                      Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj 0123456789 R$ % &
                    </p>
                  </div>
                </div>
              </div>

              {/* DM Sans */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8A5A44] bg-[#8A5A44]/10 px-2.5 py-1 rounded-md">
                    Interface & Corpo de Texto
                  </span>
                  <span className="text-xs text-[#8A5A44]">Google Font</span>
                </div>
                <h4 className="font-brand-sans text-4xl font-bold text-[#292724] mb-1">DM Sans</h4>
                <p className="text-xs text-[#8A5A44] mb-4">Sem serifa moderna, ultra legível em celulares e telas pequenas.</p>

                <div className="space-y-4 pt-4 border-t border-[#E7D5BE]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A5A44]">TEXTO DE INTERFACE (BODY 16PX)</span>
                    <p className="font-brand-sans text-base text-[#5C5852] leading-relaxed">
                      Peças de cerâmica artesanal produzidas com argila nobre e acabamentos hidrorrepelentes para áreas internas e externas.
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A5A44]">BOTÃO & AÇÕES (MEDIUM / BOLD)</span>
                    <div className="flex items-center gap-3 pt-1">
                      <button className="px-4 py-2 rounded-xl bg-[#B85C38] text-white font-brand-sans font-bold text-xs uppercase tracking-wide">
                        Registrar Venda
                      </button>
                      <button className="px-4 py-2 rounded-xl bg-[#E7D5BE] text-[#292724] font-brand-sans font-bold text-xs uppercase tracking-wide">
                        Consultar Estoque
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8A5A44]">NÚMEROS & TABULARES</span>
                    <p className="font-brand-sans text-lg font-bold text-[#292724]">
                      R$ 1.450,00 • 3.200 un • 950°C • (11) 98765-4321
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Etiquetas & Tags */}
      {activeTab === 'etiquetas' && (
        <div className="space-y-6">
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-brand-serif text-2xl font-bold text-[#292724]">Gerador de Etiquetas Oficiais (Tags)</h3>
                <p className="text-xs text-[#8A5A44]">Modelo de etiqueta com QR Code dinâmico, código da peça e selo de fabricação artesanal.</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedProductForLabel}
                  onChange={e => setSelectedProductForLabel(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F7F1E7] border border-[#E7D5BE] text-xs font-semibold text-[#292724] focus:outline-none focus:border-[#B85C38]"
                >
                  <option value="all">Exibir todos os produtos</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
                <button
                  onClick={handlePrintLabels}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B85C38] text-white text-xs font-bold hover:bg-[#9E4A2A] transition-colors cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Etiquetas</span>
                </button>
              </div>
            </div>

            {/* Labels Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(selectedProductForLabel === 'all' ? products : products.filter(p => p.id === selectedProductForLabel)).map(prod => (
                <div 
                  key={prod.id} 
                  className="bg-[#FAF6EF] border-2 border-[#D4BEA2] rounded-2xl p-5 shadow-xs relative flex flex-col justify-between min-h-[340px] hover:border-[#B85C38] transition-colors"
                  style={{
                    backgroundImage: 'radial-gradient(#E7D5BE 0.75px, transparent 0.75px)',
                    backgroundSize: '12px 12px'
                  }}
                >
                  {/* Top Punch Hole Mockup */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#E7D5BE] border border-[#D4BEA2] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FAF6EF]"></div>
                  </div>

                  <div>
                    {/* Header with Logo */}
                    <div className="text-center pt-3 pb-2 border-b border-[#E7D5BE]">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <BrandSymbol size={22} variant="terracota" />
                        <span className="font-brand-serif font-black text-base text-[#292724] tracking-wider">OLARIA</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-[#8A5A44] font-medium block">
                        Cerâmica Feita à Mão
                      </span>
                    </div>

                    {/* Product Name & Specs */}
                    <div className="my-4 text-center">
                      <h4 className="font-brand-serif font-bold text-base text-[#292724] leading-tight">
                        {prod.name}
                      </h4>
                      <div className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-[#E7D5BE]/60 text-[#8A5A44] font-mono text-xs font-bold">
                        CÓDIGO: {prod.code}
                      </div>
                      <p className="text-[11px] text-[#5C5852] mt-1.5">
                        Acabamento: <strong>{prod.finish || 'Terracota Natural'}</strong>
                      </p>
                      {prod.size && (
                        <p className="text-[11px] text-[#5C5852]">
                          Tamanho: <strong>{prod.size}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* QR Code & Footer */}
                  <div className="pt-3 border-t border-[#E7D5BE]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-16 h-16 bg-white p-1.5 rounded-xl border border-[#D4BEA2] flex items-center justify-center shrink-0">
                        {/* High quality stylized QR code mockup */}
                        <div className="w-full h-full bg-[#292724] rounded-sm p-1 flex flex-col justify-between">
                          <div className="flex justify-between">
                            <div className="w-3 h-3 bg-white rounded-xs"></div>
                            <div className="w-3 h-3 bg-white rounded-xs"></div>
                          </div>
                          <div className="flex justify-between">
                            <div className="w-3 h-3 bg-white rounded-xs"></div>
                            <div className="w-2 h-2 bg-[#B85C38] rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-[#8A5A44] block">Escaneie para catálogo</span>
                        <span className="font-brand-serif text-lg font-black text-[#B85C38] block">
                          R$ {prod.price.toFixed(2)}
                        </span>
                        <span className="text-[8px] text-[#5C5852] uppercase font-bold tracking-tight block">
                          Produzido Artesanalmente
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-center text-[8px] text-[#8A5A44]/80 italic">
                      Cuidados: Lavar com água e esponja macia. Peça 100% queima natural.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Redes Sociais & Catálogo */}
      {activeTab === 'redes' && (
        <div className="space-y-6">
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-2">Diretriz de Conteúdo para Redes Sociais</h3>
            <p className="text-xs text-[#8A5A44] mb-6">Mix balanceado de conteúdo para valorizar a arte e impulsionar as vendas.</p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
              <div className="p-4 rounded-2xl bg-[#B85C38] text-white text-center">
                <span className="text-2xl font-black font-brand-serif block mb-1">40%</span>
                <span className="text-xs font-bold block">Produtos</span>
                <span className="text-[10px] text-white/80">Vasos, fontes, acabamentos e preços</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#8A5A44] text-white text-center">
                <span className="text-2xl font-black font-brand-serif block mb-1">25%</span>
                <span className="text-xs font-bold block">Bastidores</span>
                <span className="text-[10px] text-white/80">Olaria, galpão, forno e carregamento</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#667052] text-white text-center">
                <span className="text-2xl font-black font-brand-serif block mb-1">15%</span>
                <span className="text-xs font-bold block">Processo</span>
                <span className="text-[10px] text-white/80">Torno, modelagem manual e queima</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#E7D5BE] text-[#292724] text-center">
                <span className="text-2xl font-black font-brand-serif block mb-1">10%</span>
                <span className="text-xs font-bold block">Inspiração</span>
                <span className="text-[10px] text-[#5C5852]">Varandas, paisagismo e arquitetura</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#292724] text-[#F7F1E7] text-center">
                <span className="text-2xl font-black font-brand-serif block mb-1">10%</span>
                <span className="text-xs font-bold block">Institucional</span>
                <span className="text-[10px] text-[#E7D5BE]">História, equipe e depoimentos</span>
              </div>
            </div>

            {/* Social Post Templates Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Instagram Feed 1:1 */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A5A44] mb-3 block">
                  Template Instagram Feed (1:1 Quadrado)
                </span>
                
                <div className="aspect-square rounded-2xl bg-[#FAF6EF] border-2 border-[#D4BEA2] p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BrandSymbol size={24} variant="terracota" />
                      <span className="font-brand-serif font-bold text-sm text-[#292724]">OLARIA</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#667052]/20 text-[#4F583D] font-bold">
                      COLEÇÃO BOTÂNICA
                    </span>
                  </div>

                  <div className="text-center py-4">
                    <div className="w-28 h-28 mx-auto rounded-full bg-[#E7D5BE]/60 border-2 border-[#D4BEA2] flex items-center justify-center mb-3">
                      <BrandSymbol size={64} variant="argila" />
                    </div>
                    <h4 className="font-brand-serif text-2xl font-black text-[#292724]">
                      Vaso Terracota Bojudo
                    </h4>
                    <p className="text-xs text-[#8A5A44] font-medium mt-1">
                      Modelado à mão • Queima lenta em forno a lenha
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E7D5BE]">
                    <span className="font-brand-serif text-lg font-black text-[#B85C38]">R$ 180,00</span>
                    <span className="text-[10px] text-[#8A5A44] font-semibold">Peça sob encomenda & pronta-entrega</span>
                  </div>
                </div>
              </div>

              {/* Instagram Stories 9:16 */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A5A44] mb-3 block">
                  Template Instagram Stories (9:16 Vertical)
                </span>

                <div className="max-w-[240px] mx-auto aspect-[9/16] rounded-2xl bg-[#292724] text-white p-5 flex flex-col justify-between shadow-md relative overflow-hidden border border-black">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BrandSymbol size={18} variant="creme" />
                      <span className="font-brand-serif font-bold text-xs text-[#F7F1E7]">OLARIA</span>
                    </div>
                    <span className="text-[9px] text-[#E7D5BE]">BASTIDORES</span>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] uppercase tracking-widest text-[#B85C38] font-bold block mb-1">
                      FORNO A 950°C
                    </span>
                    <h4 className="font-brand-serif text-xl font-bold text-white leading-tight">
                      "Da terra para transformar ambientes."
                    </h4>
                    <p className="text-[10px] text-[#E7D5BE]/80 mt-2">
                      Fornada fresca saindo hoje. Reserve sua peça pelo WhatsApp.
                    </p>
                  </div>

                  <div className="w-full py-2 rounded-xl bg-[#B85C38] text-white text-center text-xs font-bold">
                    Arrasta pra cima / Link na Bio
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: WhatsApp Business */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-2">Identidade WhatsApp Business</h3>
            <p className="text-xs text-[#8A5A44] mb-6">Configuração oficial do perfil corporativo e mensagens automáticas da Olaria.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* WhatsApp Profile Preview */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A5A44] mb-4">Perfil da Empresa</h4>
                <div className="bg-white rounded-2xl border border-[#D4BEA2] p-5 shadow-xs">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-[#E7D5BE] border-2 border-[#B85C38] flex items-center justify-center shrink-0">
                      <BrandSymbol size={36} variant="terracota" />
                    </div>
                    <div>
                      <h5 className="font-brand-serif text-lg font-bold text-[#292724]">Olaria — Peças Cerâmicas</h5>
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Conta Comercial Oficial
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-[#5C5852] pt-3 border-t border-stone-100">
                    <div>
                      <span className="font-bold text-[#292724] block">Descrição:</span>
                      <p className="text-[#8A5A44]">Peças de cerâmica feitas artesanalmente para transformar ambientes. Vasos, fontes, jardineiras e pedidos sob medida.</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#292724] block">Categorias do Catálogo:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {['🏺 Vasos', '🌱 Jardineiras', '💧 Fontes', '🌿 Cachepôs', '🧱 Peças Especiais', '🎨 Pedidos Sob Medida'].map((cat, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#FAF6EF] border border-[#E7D5BE] rounded-md text-[11px] text-[#292724] font-medium">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automated Messages */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A5A44] mb-4">Mensagens Padrão</h4>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white border border-[#D4BEA2]">
                    <span className="text-[10px] uppercase font-bold text-[#B85C38] block mb-1">MENSAGEM DE SAUDAÇÃO</span>
                    <p className="text-xs text-[#292724] italic">
                      "Olá! Seja bem-vindo à Olaria. Nossas peças são feitas de terra, fogo e cuidado para transformar seu espaço. Como podemos te ajudar hoje?"
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#D4BEA2]">
                    <span className="text-[10px] uppercase font-bold text-[#667052] block mb-1">ENVIO DE CATÁLOGO & PREÇOS</span>
                    <p className="text-xs text-[#292724] italic">
                      "Segue nosso catálogo com pronta-entrega e opções de acabamento sob medida. Todas as nossas peças recebem verniz hidrorrepelente."
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#D4BEA2]">
                    <span className="text-[10px] uppercase font-bold text-[#8A5A44] block mb-1">CONFIRMAÇÃO DE ENCOMENDA</span>
                    <p className="text-xs text-[#292724] italic">
                      "Seu pedido entrou no ciclo de modelagem e secagem. Assim que for para a queima a 950°C avisaremos você com a data de entrega agendada!"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Embalagens & Uniforme */}
      {activeTab === 'uniformes' && (
        <div className="space-y-6">
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-2">Embalagens, Fitas e Uniformes</h3>
            <p className="text-xs text-[#8A5A44] mb-6">Padronização dos materiais físicos de envio e vestimenta da equipe de oleiros.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Embalagem Kraft Mockup */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A5A44] mb-4">Caixa de Envio & Fita Kraft</h4>
                <div className="bg-[#E7D5BE] rounded-2xl border-2 border-[#D4BEA2] p-6 shadow-sm relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                  {/* Tape Across Box */}
                  <div className="w-full py-2 bg-[#B85C38] text-white flex items-center justify-around text-[10px] font-bold tracking-widest uppercase -mx-6 shadow-xs">
                    <span>OLARIA</span>
                    <span>•</span>
                    <span>DA TERRA PARA TRANSFORMAR AMBIENTES</span>
                    <span>•</span>
                    <span>CERÂMICA ARTESANAL</span>
                  </div>

                  <div className="my-6 text-center">
                    <div className="inline-block p-3 rounded-xl border-2 border-dashed border-[#8A5A44] text-[#8A5A44]">
                      <BrandSymbol size={42} variant="argila" />
                      <span className="font-brand-serif font-black text-sm block mt-1">CUIDADO — CERÂMICA</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#5C5852] font-semibold pt-2 border-t border-[#D4BEA2]">
                    <span>Papel Kraft 100% Reciclável</span>
                    <span>Carimbo a Base de Água</span>
                  </div>
                </div>
              </div>

              {/* Uniforme Mockup */}
              <div className="p-6 rounded-2xl bg-[#F7F1E7] border border-[#E7D5BE]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A5A44] mb-4">Uniformes da Equipe</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Camiseta Creme */}
                  <div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#D4BEA2] text-center">
                    <div className="w-20 h-24 mx-auto bg-[#F7F1E7] rounded-t-2xl border border-[#D4BEA2] p-2 flex flex-col items-center justify-between shadow-xs mb-2">
                      <div className="w-full flex justify-start pl-1">
                        <BrandSymbol size={14} variant="terracota" />
                      </div>
                      <span className="text-[8px] font-bold text-[#8A5A44]">OLARIA</span>
                    </div>
                    <span className="text-xs font-bold text-[#292724] block">Camiseta Creme</span>
                    <span className="text-[10px] text-[#8A5A44]">Atendimento e Balcão</span>
                  </div>

                  {/* Camiseta / Avental Terracota */}
                  <div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#D4BEA2] text-center">
                    <div className="w-20 h-24 mx-auto bg-[#B85C38] rounded-t-2xl border border-[#9E4A2A] p-2 flex flex-col items-center justify-between shadow-xs mb-2 text-white">
                      <div className="w-full flex justify-center">
                        <BrandSymbol size={16} variant="creme" />
                      </div>
                      <span className="text-[8px] font-bold text-[#F7F1E7]">OLEIRO</span>
                    </div>
                    <span className="text-xs font-bold text-[#292724] block">Avental Terracota</span>
                    <span className="text-[10px] text-[#8A5A44]">Produção no Torno e Forno</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Tom de Voz & Regras */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div className="bg-[#FAF6EF] rounded-3xl border border-[#E7D5BE] p-6 sm:p-8">
            <h3 className="font-brand-serif text-2xl font-bold text-[#292724] mb-2">Guia de Tom de Voz da Marca</h3>
            <p className="text-xs text-[#8A5A44] mb-6">Como nos comunicamos com clientes, arquitetos, parceiros e em toda a interface.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E7D5BE] text-[#8A5A44]">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">Situação</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-rose-800">Como Evitar (Corporativo / Caipira)</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-emerald-800">Como Escrever (Olaria Contemporânea)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7D5BE]/60 text-[#292724]">
                  <tr>
                    <td className="py-3.5 px-4 font-bold">Apresentação da Empresa</td>
                    <td className="py-3.5 px-4 text-rose-900 line-through">"Comercializamos produtos cerâmicos de alta qualidade e durabilidade."</td>
                    <td className="py-3.5 px-4 text-emerald-950 font-medium">"Peças feitas de terra, fogo e cuidado para transformar seu espaço."</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold">Processo de Fabricação</td>
                    <td className="py-3.5 px-4 text-rose-900 line-through">"Linha fabril automatizada com prensas industriais."</td>
                    <td className="py-3.5 px-4 text-emerald-950 font-medium">"Modelagem artesanal no torno com queima lenta nos fornos."</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold">Botão de Voz no Sistema</td>
                    <td className="py-3.5 px-4 text-rose-900 line-through">"Executar input de dados por reconhecimento de áudio."</td>
                    <td className="py-3.5 px-4 text-emerald-950 font-medium">"Falar • Estou ouvindo... • Entendi"</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold">Entrega e Prazo</td>
                    <td className="py-3.5 px-4 text-rose-900 line-through">"Seu pedido foi despachado via frete terceirizado."</td>
                    <td className="py-3.5 px-4 text-emerald-950 font-medium">"Suas peças saíram do forno e estão a caminho do seu endereço."</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
