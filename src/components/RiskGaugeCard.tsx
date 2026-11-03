/**
 * @file RiskGaugeCard.tsx
 * Card principal de Score de Risco calculado pelo motor difuso Mamdani.
 */

import React from 'react';
import { AlertCircle, Gauge, Wifi, Zap, Users } from 'lucide-react';
import { SystemStatus } from '../domain/metrics.js';

interface RiskGaugeCardProps {
  status: SystemStatus | null;
}

export const RiskGaugeCard: React.FC<RiskGaugeCardProps> = ({ status }) => {
  const score = status?.riskScore ?? 0;
  const level = status?.riskLevel ?? 'LOW';
  const metrics = status?.latestMetrics;

  const getLevelConfig = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          textColor: 'text-rose-400',
          bgColor: 'bg-rose-950/40',
          borderColor: 'border-rose-700/60',
          badgeText: 'CRÍTICO',
          description: 'Ameaça iminente ou ataque volumétrico/deauth em curso.',
          gaugeColor: '#f43f5e',
        };
      case 'HIGH':
        return {
          textColor: 'text-amber-400',
          bgColor: 'bg-amber-950/40',
          borderColor: 'border-amber-700/60',
          badgeText: 'ELEVADO',
          description: 'Comportamento fortemente suspeito de sondagem ou rajadas de tráfego.',
          gaugeColor: '#fbbf24',
        };
      case 'MEDIUM':
        return {
          textColor: 'text-yellow-400',
          bgColor: 'bg-yellow-950/40',
          borderColor: 'border-yellow-700/60',
          badgeText: 'MODERADO',
          description: 'Oscilações transitórias na rede acima do perfil normal.',
          gaugeColor: '#eab308',
        };
      default:
        return {
          textColor: 'text-emerald-400',
          bgColor: 'bg-emerald-950/40',
          borderColor: 'border-emerald-700/60',
          badgeText: 'BAIXO',
          description: 'Tráfego nominal com parâmetros basais estáveis.',
          gaugeColor: '#10b981',
        };
    }
  };

  const config = getLevelConfig();

  // SVG Gauge calculations (semi-circle gauge)
  const radius = 64;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase font-mono">
              Score de Risco Difuso
            </h2>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
          >
            {config.badgeText}
          </span>
        </div>

        {/* Gauge Visualizer */}
        <div className="flex flex-col items-center justify-center my-2">
          <div className="relative w-40 h-24 flex items-end justify-center">
            <svg className="w-40 h-24 overflow-visible" viewBox="0 0 160 90">
              {/* Background Arc */}
              <path
                d="M 16 85 A 64 64 0 0 1 144 85"
                fill="none"
                stroke="#27272a"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Animated Value Arc */}
              <path
                d="M 16 85 A 64 64 0 0 1 144 85"
                fill="none"
                stroke={config.gaugeColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${strokeDashoffset}`}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-zinc-100">
                {score.toFixed(1)}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono -mt-1">/ 100</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 text-center mt-2 max-w-xs">{config.description}</p>
        </div>
      </div>

      {/* Fuzzy Inputs Telemetry Grid */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-800/80">
        <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1">
            <Wifi className="h-3.5 w-3.5 text-sky-400" />
            <span className="truncate">Tráfego</span>
          </div>
          <div className="text-sm font-mono font-bold text-zinc-100">
            {metrics?.trafficRate.toFixed(1) ?? '0.0'}
            <span className="text-[10px] text-zinc-500 font-normal ml-1">pps</span>
          </div>
        </div>

        <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="truncate">Anomalias</span>
          </div>
          <div className="text-sm font-mono font-bold text-zinc-100">
            {metrics?.anomalyRate.toFixed(1) ?? '0.0'}
            <span className="text-[10px] text-zinc-500 font-normal ml-1">eps</span>
          </div>
        </div>

        <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1">
            <Users className="h-3.5 w-3.5 text-purple-400" />
            <span className="truncate">Novos MACs</span>
          </div>
          <div className="text-sm font-mono font-bold text-zinc-100">
            {metrics?.newMacs ?? 0}
            <span className="text-[10px] text-zinc-500 font-normal ml-1">disp</span>
          </div>
        </div>
      </div>
    </div>
  );
};
