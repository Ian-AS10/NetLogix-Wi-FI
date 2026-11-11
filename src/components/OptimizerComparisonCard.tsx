/**
 * @file OptimizerComparisonCard.tsx
 * Painel de Otimização de Defesas com Algoritmo Genético Binário (BGA).
 */

import React, { useState } from 'react';
import { Dna, Sliders, Clock, Cpu, ShieldCheck } from 'lucide-react';
import { OptimizationComparison } from '../domain/optimizer.js';

interface OptimizerComparisonCardProps {
  comparison: OptimizationComparison | null;
  onRunOptimization: (maxCpu: number, maxFp: number, seed: number) => void;
  isOptimizing: boolean;
}

export const OptimizerComparisonCard: React.FC<OptimizerComparisonCardProps> = ({
  comparison,
  onRunOptimization,
  isOptimizing,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [maxCpu, setMaxCpu] = useState(comparison?.constraints.maxCpuBudget ?? 40);
  const [maxFp, setMaxFp] = useState((comparison?.constraints.maxFalsePositiveRate ?? 0.15) * 100);
  const [seed, setSeed] = useState(42);

  if (!comparison) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-zinc-400">
        Aguardando execução do motor de otimização BGA...
      </div>
    );
  }

  const { bgaResult } = comparison;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunOptimization(maxCpu, maxFp / 100, seed);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-5">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-purple-400" />
            <h2 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase font-mono">
              Otimização de Defesas: Algoritmo Genético (BGA)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className="px-3 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 border bg-purple-950/60 text-purple-300 border-purple-600/60">
            <Dna className="h-3.5 w-3.5 text-purple-400" />
            <span>BGA ATIVO (Pop: 40 | Gen: 35)</span>
          </div>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="px-2.5 py-1 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 transition"
          >
            <Sliders className="h-3.5 w-3.5 text-zinc-400" />
            <span>{showConfig ? 'Fechar' : 'Ajustar'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Drawer */}
      {showConfig && (
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-950/70 p-4 rounded-lg border border-zinc-800 text-xs space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 font-mono mb-1">Teto Máx. de CPU (%)</label>
              <input
                type="number"
                min={20}
                max={100}
                value={maxCpu}
                onChange={(e) => setMaxCpu(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-mono mb-1">Teto Máx. Falso Positivo (%)</label>
              <input
                type="number"
                min={1}
                max={50}
                step={0.5}
                value={maxFp}
                onChange={(e) => setMaxFp(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-mono mb-1">Semente RNG (Reproducibility)</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isOptimizing}
              className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium transition disabled:opacity-50"
            >
              {isOptimizing ? 'Reavaliando...' : 'Executar Otimização BGA'}
            </button>
          </div>
        </form>
      )}

      {/* BGA Solution Card */}
      <div className="p-4 rounded-xl border bg-purple-950/20 border-purple-600/40 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Dna className="h-4 w-4 text-purple-400" />
              <h3 className="font-bold text-sm font-mono text-zinc-100">Solução Ótima Selecionada pelo BGA</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">
              Taxa de Crossover: 85% | Mutação: 5%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono my-3">
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <div className="text-zinc-400 text-[10px] uppercase">Aptidão (Fitness)</div>
              <div className="text-xl font-extrabold text-purple-400 mt-1">
                {bgaResult.fitnessScore.toFixed(2)}
              </div>
            </div>
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <div className="text-zinc-400 text-[10px] uppercase">Cobertura Ameaças</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {bgaResult.effectiveCoveragePercent.toFixed(1)}%
              </div>
            </div>
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <div className="text-zinc-400 text-[10px] uppercase flex items-center gap-1">
                <Cpu className="h-3 w-3 text-sky-400" />
                <span>Custo Total CPU</span>
              </div>
              <div className="text-lg font-bold text-zinc-200 mt-1">
                {bgaResult.totalCpuCostPercent.toFixed(1)}%
                <span className="text-[10px] text-zinc-500 font-normal"> / {comparison.constraints.maxCpuBudget}%</span>
              </div>
            </div>
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <div className="text-zinc-400 text-[10px] uppercase">FP Agregado</div>
              <div className="text-lg font-bold text-zinc-200 mt-1">
                {(bgaResult.aggregatedFalsePositive * 100).toFixed(1)}%
                <span className="text-[10px] text-zinc-500 font-normal"> / {(comparison.constraints.maxFalsePositiveRate * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-purple-400" />
            <span>Tempo de Convergência: <strong className="text-zinc-200">{bgaResult.executionTimeMs} ms</strong></span>
          </span>
          <span className="text-purple-300 font-bold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>{bgaResult.selectedRuleIds.length} regras selecionadas</span>
          </span>
        </div>
      </div>
    </div>
  );
};
