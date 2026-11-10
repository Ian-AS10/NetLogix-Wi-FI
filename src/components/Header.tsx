/**
 * @file Header.tsx
 * Cabeçalho do painel NOC NetLogix Wi-Fi IDS/IPS com badges de estado em tempo real.
 */

import React from 'react';
import { ShieldCheck, Activity, RefreshCw } from 'lucide-react';
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

          {/* Windows Defender Firewall Elevation Status */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[11px] ${
              status?.hasAdminPrivileges
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50'
                : 'bg-zinc-900/80 text-zinc-300 border-zinc-700'
            }`}
            title={
              status?.hasAdminPrivileges
                ? 'PowerShell com elevação de Administrador: comandos New-NetFirewallRule ativos no SO'
                : 'Modo Híbrido Resiliente: execução segura sem erro fatal caso não haja UAC de Administrador'
            }
          >
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
            <span>{status?.hasAdminPrivileges ? 'FIREWALL FÍSICO (ADM)' : 'FIREWALL HÍBRIDO'}</span>
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
