/**
 * @file optimizerComparison.ts
 * Execução da otimização de defesas ativas via Algoritmo Genético Binário (BGA).
 */

import {
  BGAParameters,
  OptimizationComparison,
  OptimizationConstraints,
} from '../../domain/optimizer.js';
import { config } from '../../config/appConfig.js';
import { SECURITY_RULES_CATALOG } from './rulesCatalog.js';
import { bgaOptimizer } from './bgaOptimizer.js';

export function runOptimizationComparison(
  riskScore = 50,
  customConstraints?: Partial<OptimizationConstraints>,
  customBgaParams?: Partial<BGAParameters>
): OptimizationComparison {
  const constraints: OptimizationConstraints = {
    maxCpuBudget: customConstraints?.maxCpuBudget ?? config.maxCpuBudget,
    maxFalsePositiveRate: customConstraints?.maxFalsePositiveRate ?? config.maxFalsePositiveRate,
  };

  const bgaParams: BGAParameters = {
    populationSize: customBgaParams?.populationSize ?? 40,
    generations: customBgaParams?.generations ?? 35,
    crossoverRate: customBgaParams?.crossoverRate ?? 0.85,
    mutationRate: customBgaParams?.mutationRate ?? 0.05,
    tournamentSize: customBgaParams?.tournamentSize ?? 3,
    seed: customBgaParams?.seed ?? 42,
  };

  // Executa o BGA (Algoritmo Genético Binário)
  const bgaResult = bgaOptimizer.optimize(
    SECURITY_RULES_CATALOG,
    constraints,
    bgaParams,
    riskScore
  );

  let summary = '';
  if (bgaResult.selectedRuleIds.length === 0) {
    summary = `Tráfego em regime nominal (Risco ${riskScore.toFixed(1)}% <= ${config.riskThreshold}%). O Algoritmo Genético convergiu para estado de repouso (0 regras ativas), preservando 100% da CPU e evitando falsos positivos.`;
  } else {
    summary = `O BGA convergiu com sucesso em ${bgaResult.executionTimeMs.toFixed(1)}ms (${bgaParams.generations} gerações, pop ${bgaParams.populationSize}). Solução ótima com aptidão ${bgaResult.fitnessScore.toFixed(1)}, cobertura de ${bgaResult.effectiveCoveragePercent.toFixed(1)}% e custo de CPU de ${bgaResult.totalCpuCostPercent.toFixed(1)}% (<= ${constraints.maxCpuBudget}%).`;
  }

  return {
    timestamp: Date.now(),
    riskScore,
    constraints,
    bgaResult,
    winner: 'BGA',
    analysisSummary: summary,
  };
}
