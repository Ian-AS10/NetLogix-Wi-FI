/**
 * @file RuleCatalogCard.tsx
 * Catálogo e visualizador de regras de segurança de rede recomendadas pelo IDS.
 */

import React, { useState } from 'react';
import { ShieldCheck, Info, Check, Eye } from 'lucide-react';
import { SecurityRule, ThreatCategory } from '../domain/rules.js';

interface RuleCatalogCardProps {
  rules: SecurityRule[];
  selectedBgaRuleIds: string[];
  selectedGreedyRuleIds: string[];
}

export const RuleCatalogCard: React.FC<RuleCatalogCardProps> = ({
  rules,
  selectedBgaRuleIds,
  selectedGreedyRuleIds,
}) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedRuleModal, setSelectedRuleModal] = useState<SecurityRule | null>(null);

  const bgaSet = new Set(selectedBgaRuleIds);
  const greedySet = new Set(selectedGreedyRuleIds);

  const filteredRules = rules.filter((r) => {
    if (filter === 'ALL') return true;
    if (filter === 'SELECTED_BGA') return bgaSet.has(r.id);
    if (filter === 'SELECTED_GREEDY') return greedySet.has(r.id);
    return r.threatCategory === filter;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase font-mono">
              Catálogo de Regras de Defesa ({rules.length})
            </h2>
            <p className="text-[11px] text-zinc-400">
              Regras sugeridas para mitigação. Apenas recomendação — sem bloqueio real no firewall.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
          {['ALL', 'SELECTED_BGA', 'FLOOD', 'DEAUTH', 'SPOOFING', 'SCAN'].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={`px-2 py-1 rounded text-[11px] transition ${
                filter === category
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
              }`}
            >
              {category === 'SELECTED_BGA' ? 'RECOMENDADAS (BGA)' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
        {filteredRules.map((rule) => {
          const isBgaSelected = bgaSet.has(rule.id);
          const isGreedySelected = greedySet.has(rule.id);

          return (
            <div
              key={rule.id}
              className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition ${
                isBgaSelected
                  ? 'bg-purple-950/20 border-purple-500/50 shadow-sm'
                  : 'bg-zinc-950/50 border-zinc-800/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-200">{rule.id}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getCategoryColor(
                        rule.threatCategory
                      )}`}
                    >
                      {rule.threatCategory}
                    </span>
                  </div>

                  {/* Recommendation Tags */}
                  <div className="flex items-center gap-1">
                    {isBgaSelected && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-900/60 text-purple-300 border border-purple-600/50 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> BGA
                      </span>
                    )}
                    {isGreedySelected && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-900/60 text-blue-300 border border-blue-600/50 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> GULOSO
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-semibold text-zinc-100 text-xs mb-1">{rule.name}</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2">{rule.description}</p>
              </div>

              {/* Resource Bars */}
              <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-3 gap-2 font-mono text-[10px] text-zinc-400">
                <div>
                  <span>Custo CPU:</span>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full"
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
                  <span>Cobertura:</span>
                  <span className="block text-emerald-400 mt-1 font-semibold">
                    {(rule.threatCoverage * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advisory Disclaimer */}
      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-md p-2.5 text-[11px] text-zinc-400 flex items-center gap-2">
        <Info className="h-4 w-4 text-amber-400 shrink-0" />
        <span>
          Aviso da PoC: Custos de CPU e taxas de falso positivo são estimativas analíticas para
          avaliação de algoritmos e não constituem medições diretas de hardware.
        </span>
      </div>
    </div>
  );
};
