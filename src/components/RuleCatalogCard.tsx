/**
 * @file RuleCatalogCard.tsx
 * Catálogo e motor de controle de regras de Defesa Ativa (IPS) do NetLogix Wi-Fi.
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Check, Zap, Terminal, Power, Lock } from 'lucide-react';
import { SecurityRule, ThreatCategory } from '../domain/rules.js';

interface RuleCatalogCardProps {
  rules: SecurityRule[];
  selectedBgaRuleIds: string[];
  enforcedRuleIds: string[];
  autoProtectEnabled: boolean;
  mitigatedPacketsTotal: number;
  onToggleRule: (ruleId: string) => void;
  onApplyRuleSet: (ruleIds: string[], source: string) => void;
  onToggleAutoProtect: (enabled: boolean) => void;
  isLoading?: boolean;
}

export const RuleCatalogCard: React.FC<RuleCatalogCardProps> = ({
  rules,
  selectedBgaRuleIds,
  enforcedRuleIds,
  autoProtectEnabled,
  mitigatedPacketsTotal,
  onToggleRule,
  onApplyRuleSet,
  onToggleAutoProtect,
  isLoading = false,
}) => {
  const [filter, setFilter] = useState<string>('ALL');

  const bgaSet = new Set(selectedBgaRuleIds);
  const enforcedSet = new Set(enforcedRuleIds);

  const filteredRules = rules.filter((r) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE_IPS') return enforcedSet.has(r.id);
    if (filter === 'SELECTED_BGA') return bgaSet.has(r.id);
    return r.threatCategory === filter;
  });

  const activeCpuLoad = rules
    .filter((r) => enforcedSet.has(r.id))
    .reduce((acc, r) => acc + r.cpuCost, 0);

  const getCategoryColor = (cat: ThreatCategory) => {
    switch (cat) {
      case 'FLOOD':
        return 'bg-blue-950/60 text-blue-300 border-blue-700/60';
      case 'SCAN':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/60';
      case 'DEAUTH':
        return 'bg-rose-950/60 text-rose-300 border-rose-700/60';
      case 'SPOOFING':
        return 'bg-purple-950/60 text-purple-300 border-purple-700/60';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      {/* Header & Active IPS Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase font-mono">
                Catálogo de Regras de Defesa Ativa ({rules.length})
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> IPS ENFORCEMENT ATIVO ({enforcedRuleIds.length}/{rules.length})
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-0.5">
              Prevenção e mitigação em tempo real — As regras selecionadas protegem ativamente a camada de enlace 802.11 e o firewall de borda.
            </p>
          </div>
        </div>

        {/* Quick Enforcement Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onToggleAutoProtect(!autoProtectEnabled)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-semibold flex items-center gap-1.5 border transition ${
              autoProtectEnabled
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Sincroniza e aplica automaticamente as regras otimizadas pelo BGA conforme o risco varia"
          >
            <Zap className={`h-3.5 w-3.5 ${autoProtectEnabled ? 'text-emerald-400' : 'text-zinc-500'}`} />
            Auto-Proteção BGA: {autoProtectEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            disabled={isLoading || selectedBgaRuleIds.length === 0}
            onClick={() => onApplyRuleSet(selectedBgaRuleIds, 'BGA Ótimo')}
            className="px-2.5 py-1.5 rounded text-[11px] font-semibold bg-purple-950/70 hover:bg-purple-900/70 text-purple-200 border border-purple-500/50 transition disabled:opacity-50"
          >
            Aplicar BGA ({selectedBgaRuleIds.length})
          </button>
        </div>
      </div>

      {/* Category & State Filter Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
          {[
            { id: 'ALL', label: 'TODAS' },
            { id: 'ACTIVE_IPS', label: `PROTEÇÃO ATIVA (${enforcedRuleIds.length})` },
            { id: 'SELECTED_BGA', label: `SELEÇÃO BGA (${selectedBgaRuleIds.length})` },
            { id: 'FLOOD', label: 'FLOOD' },
            { id: 'DEAUTH', label: 'DEAUTH' },
            { id: 'SPOOFING', label: 'SPOOFING' },
            { id: 'SCAN', label: 'SCAN' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`px-2.5 py-1 rounded text-[11px] transition ${
                filter === item.id
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-3">
          <span>
            Carga CPU IPS Ativa: <strong className="text-emerald-400">{activeCpuLoad}%</strong>
          </span>
          <span>
            Pacotes Mitigados: <strong className="text-emerald-400">{mitigatedPacketsTotal}</strong>
          </span>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[28rem] overflow-y-auto pr-1">
        {filteredRules.map((rule) => {
          const isEnforced = enforcedSet.has(rule.id);
          const isBgaSelected = bgaSet.has(rule.id);

          return (
            <div
              key={rule.id}
              className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between transition ${
                isEnforced
                  ? 'bg-emerald-950/20 border-emerald-500/60 shadow-sm'
                  : isBgaSelected
                  ? 'bg-purple-950/15 border-purple-500/40'
                  : 'bg-zinc-950/50 border-zinc-800/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-zinc-100">{rule.id}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getCategoryColor(
                        rule.threatCategory
                      )}`}
                    >
                      {rule.threatCategory}
                    </span>
                    {isEnforced && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-900/70 text-emerald-200 border border-emerald-500/60 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" /> PROTEGENDO
                      </span>
                    )}
                  </div>

                  {/* Optimizer & Enforcement Action */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isBgaSelected && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-900/60 text-purple-300 border border-purple-600/50 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> BGA
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => onToggleRule(rule.id)}
                      className={`ml-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 border transition ${
                        isEnforced
                          ? 'bg-emerald-600 hover:bg-rose-600 text-white border-emerald-500 hover:border-rose-500'
                          : 'bg-zinc-800 hover:bg-emerald-700 text-zinc-300 hover:text-white border-zinc-700'
                      }`}
                      title={isEnforced ? 'Clique para desativar esta proteção' : 'Clique para ativar proteção imediata'}
                    >
                      <Power className="h-2.5 w-2.5" />
                      {isEnforced ? 'Ativa' : 'Ativar'}
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-zinc-100 text-xs mb-1">{rule.name}</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2">{rule.description}</p>

                {/* Active Firewall / 802.11 Directive */}
                {rule.enforcementDirective && (
                  <div
                    className={`mb-2.5 px-2 py-1 rounded font-mono text-[10px] flex items-center gap-1.5 border ${
                      isEnforced
                        ? 'bg-zinc-950/90 border-emerald-800/60 text-emerald-300'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-500'
                    }`}
                  >
                    <Terminal className="h-3 w-3 shrink-0" />
                    <code className="truncate">{rule.enforcementDirective}</code>
                  </div>
                )}
              </div>

              {/* Resource Bars */}
              <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-3 gap-2 font-mono text-[10px] text-zinc-400">
                <div>
                  <span>Custo CPU:</span>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className={`${isEnforced ? 'bg-emerald-400' : 'bg-amber-400'} h-1.5 rounded-full`}
                      style={{ width: `${Math.min(100, rule.cpuCost * 2)}%` }}
                    />
                  </div>
                  <span className="text-zinc-200">{rule.cpuCost}%</span>
                </div>

                <div>
                  <span>Falso Positivo:</span>
                  <span className="block text-zinc-200 mt-1 font-semibold">
                    {(rule.fpRate * 100).toFixed(1)}%
                  </span>
                </div>

                <div>
                  <span>Mitigação:</span>
                  <span className="block text-emerald-400 mt-1 font-semibold">
                    {(rule.threatCoverage * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Defense Status Footer */}
      <div className="bg-emerald-950/25 border border-emerald-800/50 rounded-md p-2.5 text-[11px] text-emerald-200/90 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Motor de Proteção Ativa (IPS):</strong> {enforcedRuleIds.length} regras estão aplicadas e filtrando pacotes maliciosos em tempo real conforme as diretivas de contenção.
          </span>
        </div>
        <span className="font-mono text-[10px] text-emerald-400">
          Sincronia BGA: {autoProtectEnabled ? 'AUTOMÁTICA' : 'MANUAL'}
        </span>
      </div>
    </div>
  );
};
