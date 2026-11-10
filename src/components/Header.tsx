/**
 * @file Header.tsx
 * Cabeçalho do painel NOC NetLogix Wi-Fi IDS/IPS com badges de estado em tempo real.
 */

import React from 'react';
import { ShieldCheck, Activity, RefreshCw, FileDown } from 'lucide-react';
import { SystemStatus } from '../domain/metrics.js';
import { NetLogixLogo } from './NetLogixLogo.js';

interface HeaderProps {
  status: SystemStatus | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ status, onRefresh, isLoading }) => {
  const getStatusBadge = () => {
    if (!status) return { label: 'Conectando...', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };

    if (status.mode === 'simulated') {
      return {
        label: `SIMULAÇÃO ATIVA (${status.activeScenario?.toUpperCase() || 'NORMAL'})`,
        color: 'bg-amber-950/70 text-amber-300 border-amber-600/50',
      };
    }
    if (status.mode === 'real_capture') {
      if (status.status === 'active') {
        return {
          label: `CAPTURA TSHARK ATIVA [${status.selectedInterface}]`,
          color: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50',
        };
      }
      if (status.status === 'starting') {
        return { label: 'INICIANDO TSHARK...', color: 'bg-sky-950/70 text-sky-300 border-sky-500/50' };
      }
      if (status.status === 'error') {
        return { label: 'ERRO NA CAPTURA', color: 'bg-rose-950/70 text-rose-300 border-rose-500/50' };
      }
    }
    return { label: 'MONITORAMENTO EM ESPERA', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
  };

  const badge = getStatusBadge();
  const isActiveCapture = status?.mode === 'simulated' || status?.status === 'active';
  const activeRulesCount = status?.enforcedRuleIds?.length ?? 0;

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Advisory */}
        <div className="flex items-center gap-3.5">
          <NetLogixLogo
            riskLevel={status?.riskLevel}
            riskScore={status?.riskScore}
            isActiveCapture={isActiveCapture}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight font-mono">
                NETLOGIX <span className="text-emerald-400">WI-FI IDS/IPS</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                v1.2 Active
              </span>
              <button
                type="button"
                onClick={() => {
                  const svgEl = document.getElementById('netlogix-header-svg');
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
                title="Baixar imagem PNG em alta resolução (2048×2048) da logo NetLogix"
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-500/50 flex items-center gap-1 transition cursor-pointer"
              >
                <FileDown className="h-3 w-3 text-purple-300" />
                Baixar Logo PNG
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Monitoramento de rede, inferência Fuzzy e proteção ativa automatizada (BGA vs Guloso)
            </p>
          </div>
        </div>

        {/* Status indicators and action */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Status Badge */}
          <div
            className={`px-2.5 py-1 rounded-md border font-mono font-medium flex items-center gap-1.5 shadow-sm ${badge.color}`}
          >
            <Activity className="h-3.5 w-3.5 animate-spin-slow" />
            <span>{badge.label}</span>
          </div>

          {/* Active Protection Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/50 border border-emerald-700/60 text-emerald-300 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              Proteção Ativa IPS ({activeRulesCount} regras | {status?.mitigatedPacketsTotal ?? 0} bloqueios)
            </span>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Atualizar dados agora"
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="font-mono">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};
