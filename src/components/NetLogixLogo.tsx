/**
 * @file NetLogixLogo.tsx
 * Versão final unificada da logo do NetLogix Wi-Fi IDS.
 * Sintetiza o equilíbrio exato entre profundidade metálica 3D chanfrada (facetas de titânio e ametista)
 * e clareza geométrica limpa com espaço negativo (3 anéis de radar espaçados + hélice binária BGA).
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Layers, Cpu, Radio, ShieldCheck, Download } from 'lucide-react';

interface NetLogixLogoProps {
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore?: number;
  isActiveCapture?: boolean;
}

export const NetLogixLogo: React.FC<NetLogixLogoProps> = ({
  riskLevel = 'LOW',
  riskScore = 8.5,
  isActiveCapture = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Paleta reativa acoplada ao estado real do motor Fuzzy Mamdani
  const getThemeColors = () => {
    switch (riskLevel) {
      case 'CRITICAL':
        return {
          waveMain: '#f43f5e',      // Rose 500
          waveLight: '#fda4af',     // Rose 300
          waveDark: '#881337',      // Rose 900
          prismLight: '#c084fc',    // Purple 400
          prismMid: '#9333ea',      // Purple 600
          prismDark: '#3b0764',     // Purple 950
          border: 'border-rose-500/50 hover:border-rose-400',
          glow: 'shadow-rose-500/20',
          label: 'CRÍTICO',
        };
      case 'HIGH':
        return {
          waveMain: '#f59e0b',      // Amber 500
          waveLight: '#fcd34d',     // Amber 300
          waveDark: '#78350f',      // Amber 900
          prismLight: '#c084fc',
          prismMid: '#9333ea',
          prismDark: '#3b0764',
          border: 'border-amber-500/50 hover:border-amber-400',
          glow: 'shadow-amber-500/20',
          label: 'ELEVADO',
        };
      case 'MEDIUM':
        return {
          waveMain: '#eab308',      // Yellow 500
          waveLight: '#fde047',     // Yellow 300
          waveDark: '#713f12',      // Yellow 900
          prismLight: '#c084fc',
          prismMid: '#9333ea',
          prismDark: '#3b0764',
          border: 'border-yellow-500/50 hover:border-yellow-400',
          glow: 'shadow-yellow-500/20',
          label: 'MODERADO',
        };
      default:
        return {
          waveMain: '#10b981',      // Emerald 500
          waveLight: '#6ee7b7',     // Emerald 300
          waveDark: '#064e3b',      // Emerald 900
          prismLight: '#d8b4fe',    // Purple 300
          prismMid: '#9333ea',      // Purple 600
          prismDark: '#2e1065',     // Purple 950
          border: 'border-emerald-500/40 hover:border-emerald-400',
          glow: 'shadow-emerald-500/15',
          label: 'NOMINAL',
        };
    }
  };

  const c = getThemeColors();

  /**
   * Emblema Final Unificado:
   * - Volume 3D chanfrado (facetas iluminadas vs facetas em sombra de titânio e ametista)
   * - Apenas 3 anéis de radar espaçados com respiro visual limpo
   * - Hélice dupla BGA esculpida com esferas 3D luminosas e núcleo orbital limpo
   */
  const renderUnifiedInsignia = (sizeClass: string, uid = 'hdr') => (
    <svg
      id={`netlogix-${uid}-svg`}
      viewBox="0 0 160 160"
      className={`${sizeClass} select-none overflow-visible`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Insígnia Oficial NetLogix Wi-Fi IDS"
    >
      <defs>
        {/* Brilho ambiental suave de fundo */}
        <radialGradient id={`ambient-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.prismMid} stopOpacity="0.28" />
          <stop offset="55%" stopColor={c.waveMain} stopOpacity="0.12" />
          <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
        </radialGradient>

        {/* Gradientes metálicos 3D para as facetas de Titânio Escuro */}
        <linearGradient id={`titanium-lit-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#71717a" />
          <stop offset="50%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <linearGradient id={`titanium-dark-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>

        {/* Gradientes metálicos 3D para as facetas de Ametista (Prismas Fuzzy) */}
        <linearGradient id={`amethyst-lit-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.prismLight} />
          <stop offset="45%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6b21a8" />
        </linearGradient>
        <linearGradient id={`amethyst-dark-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b21a8" />
          <stop offset="100%" stopColor={c.prismDark} />
        </linearGradient>

        {/* Gradientes metálicos 3D para facetas Esmeralda (Acento de Radar) */}
        <linearGradient id={`emerald-lit-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.waveLight} />
          <stop offset="50%" stopColor={c.waveMain} />
          <stop offset="100%" stopColor={c.waveDark} />
        </linearGradient>

        {/* Esferas 3D para os nós do DNA Binário */}
        <radialGradient id={`node-emerald-${uid}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor={c.waveLight} />
          <stop offset="80%" stopColor={c.waveMain} />
          <stop offset="100%" stopColor={c.waveDark} />
        </radialGradient>
        <radialGradient id={`node-purple-${uid}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor={c.prismLight} />
          <stop offset="80%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#3b0764" />
        </radialGradient>

        {/* Sombra projetada suave para separar as camadas 3D */}
        <filter id={`drop-${uid}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.75" />
        </filter>
      </defs>

      {/* Halo atmosférico */}
      <circle cx="80" cy="80" r="74" fill={`url(#ambient-${uid})`} />

      {/* =====================================================================
          CAMADA 1: 3 ANÉIS DE INTERFERÊNCIA DE RADAR ESPAÇADOS (Sem poluição)
         ===================================================================== */}
      <g
        className={isActiveCapture ? 'origin-center animate-spin' : ''}
        style={{ animationDuration: '24s' }}
      >
        {/* Anel Externo Segmentado */}
        <circle
          cx="80"
          cy="80"
          r="66"
          stroke={c.waveMain}
          strokeWidth="2"
          strokeDasharray="36 16"
          strokeLinecap="round"
          strokeOpacity="0.65"
        />
        {/* Anel Intermediário de Ondas */}
        <circle
          cx="80"
          cy="80"
          r="56"
          stroke={c.waveLight}
          strokeWidth="1.6"
          strokeDasharray="22 12 6 12"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
        {/* Anel Interno de Varredura */}
        <circle
          cx="80"
          cy="80"
          r="46"
          stroke={c.waveMain}
          strokeWidth="2.2"
          strokeDasharray="48 20"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
      </g>

      {/* =====================================================================
          CAMADA 2: ESTRELA PRISMÁTICA 3D CHANFRADA (Volume + Espaço Negativo)
         ===================================================================== */}
      <g filter={`url(#drop-${uid})`}>
        {/* 4 Pontas Diagonais Secundárias em Titânio Escovado + Ametista */}
        {/* Noroeste */}
        <polygon points="80,80 30,30 62,46" fill={`url(#amethyst-lit-${uid})`} />
        <polygon points="80,80 30,30 46,62" fill={`url(#titanium-dark-${uid})`} />
        {/* Sudeste */}
        <polygon points="80,80 130,130 114,98" fill={`url(#amethyst-lit-${uid})`} />
        <polygon points="80,80 130,130 98,114" fill={`url(#titanium-dark-${uid})`} />
        {/* Sudoeste (Eixo de apoio da hélice) */}
        <polygon points="80,80 32,128 48,96" fill={`url(#titanium-lit-${uid})`} />
        <polygon points="80,80 32,128 64,112" fill={`url(#titanium-dark-${uid})`} />
        {/* Nordeste (Eixo de apoio da hélice) */}
        <polygon points="80,80 128,32 96,48" fill={`url(#titanium-lit-${uid})`} />
        <polygon points="80,80 128,32 112,64" fill={`url(#titanium-dark-${uid})`} />

        {/* Moldura de 4 Chevron Internos Esmeralda/Titânio */}
        <polygon points="80,26 102,48 95,55 80,40 65,55 58,48" fill={`url(#emerald-lit-${uid})`} />
        <polygon points="80,134 102,112 95,105 80,120 65,105 58,112" fill={`url(#emerald-lit-${uid})`} />

        {/* 4 Pontas Cardeais Principais (Norte, Sul, Leste, Oeste) com Bisel 3D */}
        {/* Ponta Norte */}
        <polygon points="80,10 80,80 62,56" fill={`url(#titanium-lit-${uid})`} />
        <polygon points="80,10 80,80 98,56" fill={`url(#amethyst-dark-${uid})`} />
        {/* Ponta Sul */}
        <polygon points="80,150 80,80 98,104" fill={`url(#amethyst-lit-${uid})`} />
        <polygon points="80,150 80,80 62,104" fill={`url(#titanium-dark-${uid})`} />
        {/* Ponta Oeste */}
        <polygon points="10,80 80,80 56,62" fill={`url(#amethyst-lit-${uid})`} />
        <polygon points="10,80 80,80 56,98" fill={`url(#titanium-dark-${uid})`} />
        {/* Ponta Leste */}
        <polygon points="150,80 80,80 104,62" fill={`url(#titanium-lit-${uid})`} />
        <polygon points="150,80 80,80 104,98" fill={`url(#amethyst-lit-${uid})`} />

        {/* Arestas Especulares de Precisão (Highlight de Crista 3D) */}
        <line x1="80" y1="10" x2="80" y2="150" stroke="#e4e4e7" strokeWidth="0.9" strokeOpacity="0.45" />
        <line x1="10" y1="80" x2="150" y2="80" stroke="#e4e4e7" strokeWidth="0.9" strokeOpacity="0.45" />
      </g>

      {/* =====================================================================
          CAMADA 3: NÚCLEO ORBITAL + HÉLICE BINÁRIA BGA ESCULPIDA
         ===================================================================== */}
      <g filter={`url(#drop-${uid})`}>
        {/* Anel de Blindagem do Núcleo */}
        <circle
          cx="80"
          cy="80"
          r="26"
          fill="#09090b"
          stroke={`url(#amethyst-lit-${uid})`}
          strokeWidth="3.5"
        />
        <circle
          cx="80"
          cy="80"
          r="19"
          fill="#09090b"
          stroke={c.waveMain}
          strokeWidth="1.8"
          strokeDasharray="28 8"
        />

        {/* Pontes de Base Nitrogenada / Bits do Cromossomo BGA */}
        <line x1="42" y1="108" x2="52" y2="118" stroke={c.waveLight} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="55" y1="95" x2="65" y2="105" stroke={c.prismLight} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="74" y1="74" x2="86" y2="86" stroke={c.waveLight} strokeWidth="2.4" strokeLinecap="round" />
        <line x1="95" y1="55" x2="105" y2="65" stroke={c.prismLight} strokeWidth="2.2" strokeLinecap="round" />
        <line x1="108" y1="42" x2="118" y2="52" stroke={c.waveLight} strokeWidth="2.2" strokeLinecap="round" />

        {/* Fita 1 da Dupla Hélice (Titânio + Esmeralda) */}
        <path
          d="M 34 126 C 42 98, 62 104, 80 80 C 98 56, 102 38, 126 34"
          stroke={`url(#emerald-lit-${uid})`}
          strokeWidth="4.2"
          strokeLinecap="round"
        />

        {/* Fita 2 da Dupla Hélice (Ametista 3D) */}
        <path
          d="M 34 126 C 62 118, 56 98, 80 80 C 104 62, 118 62, 126 34"
          stroke={`url(#amethyst-lit-${uid})`}
          strokeWidth="4.2"
          strokeLinecap="round"
        />

        {/* 8 Esferas 3D Luminosas dos Nós Genéticos (Equilíbrio visual sem poluição) */}
        <circle cx="42" cy="108" r="4.2" fill={`url(#node-emerald-${uid})`} />
        <circle cx="52" cy="118" r="3.8" fill={`url(#node-purple-${uid})`} />

        <circle cx="55" cy="95" r="4.2" fill={`url(#node-purple-${uid})`} />
        <circle cx="65" cy="105" r="3.8" fill={`url(#node-emerald-${uid})`} />

        {/* Nó Central de Crossover */}
        <circle cx="80" cy="80" r="5.2" fill={`url(#node-emerald-${uid})`} />

        <circle cx="95" cy="65" r="3.8" fill={`url(#node-emerald-${uid})`} />
        <circle cx="105" cy="55" r="4.2" fill={`url(#node-purple-${uid})`} />

        <circle cx="108" cy="42" r="3.8" fill={`url(#node-purple-${uid})`} />
        <circle cx="118" cy="52" r="4.2" fill={`url(#node-emerald-${uid})`} />
      </g>
    </svg>
  );

  return (
    <>
      {/* Emblema Oficial Unificado no Cabeçalho */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        aria-label="Inspecionar logo oficial do NetLogix Wi-Fi IDS"
        title="Clique para inspecionar a logo oficial NetLogix"
        className={`group relative h-11 w-11 rounded-lg bg-zinc-950 border ${c.border} shadow-md ${c.glow} flex items-center justify-center overflow-hidden transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 shrink-0 p-1`}
      >
        {renderUnifiedInsignia('w-9 h-9', 'header')}
      </button>

      {/* Modal de Apresentação da Versão Final Unificada */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-modal-title"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-zinc-100 my-auto">
              {/* Cabeçalho do Modal */}
              <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <h2 id="brand-modal-title" className="text-base font-bold font-mono tracking-tight">
                      INSÍGNIA OFICIAL — NETLOGIX WI-FI IDS
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Síntese definitiva unindo o chanfro metálico 3D da arte renderizada com a geometria limpa e reativa do vetor SVG.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Fechar modal da logo"
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Vitrine Principal Unificada */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 mb-4">
                  <span>EMBLEMA 3D VETORIAL UNIFICADO</span>
                  <span className="font-semibold" style={{ color: c.waveMain }}>
                    ESTADO: {c.label} (SCORE {riskScore.toFixed(1)})
                  </span>
                </div>

                <div className="w-56 h-56 rounded-xl border border-zinc-800/80 bg-zinc-950 flex items-center justify-center p-4 shadow-inner">
                  {renderUnifiedInsignia('w-48 h-48', 'modal')}
                </div>

                <p className="text-xs text-zinc-400 text-center mt-4 max-w-md">
                  Facetas chanfradas em titânio escuro (#27272a) e ametista (#a855f7), 3 anéis de radar espaçados em esmeralda (#10b981) e hélice binária central com esferas 3D.
                </p>
              </div>

              {/* Simbologia Arquitetural das 3 Camadas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-emerald-400 mb-1">
                    <Radio className="h-3.5 w-3.5" />
                    <span>3 Anéis de Radar</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Espaçados com respiro visual para leitura limpa da varredura passiva 802.11.
                  </p>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-purple-400 mb-1">
                    <Cpu className="h-3.5 w-3.5" />
                    <span>Hélice BGA 3D</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Dupla hélice esculpida com 8 nós esféricos representando o cromossomo binário.
                  </p>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-zinc-200 mb-1">
                    <Layers className="h-3.5 w-3.5 text-sky-400" />
                    <span>Prismas Chanfrados</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Estrela de 8 pontas com luz e sombra metálica inspirada nas curvas Mamdani.
                  </p>
                </div>
              </div>

              {/* Rodapé de confirmação e Download em PNG Nativo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800 text-xs text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Exportação direta em PNG de alta resolução (2048×2048)
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const svgEl = document.getElementById('netlogix-modal-svg');
                      if (!svgEl) return;
                      const serializer = new XMLSerializer();
                      const svgStr = serializer.serializeToString(svgEl);
                      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
                      const url = URL.createObjectURL(svgBlob);
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 2048;
                        canvas.height = 2048;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.fillStyle = '#09090b';
                          ctx.fillRect(0, 0, 2048, 2048);
                          ctx.drawImage(img, 128, 128, 1792, 1792);
                          canvas.toBlob((pngBlob) => {
                            if (!pngBlob) return;
                            const pngUrl = URL.createObjectURL(pngBlob);
                            const a = document.createElement('a');
                            a.href = pngUrl;
                            a.download = 'NetLogix-Logo-Oficial-2048x2048.png';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(pngUrl);
                          }, 'image/png');
                        }
                        URL.revokeObjectURL(url);
                      };
                      img.src = url;
                    }}
                    className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Baixar PNG (2048×2048)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
