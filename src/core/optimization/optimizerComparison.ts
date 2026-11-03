/**
 * @file optimizerComparison.ts
 * Execução comparativa estrita entre BGA e Baseline Guloso sob condições idênticas.
 */

import {
  BGAParameters,
  OptimizationComparison,
  OptimizationConstraints,
} from '../../domain/optimizer.js';
import { SECURITY_RULES_CATALOG } from './rulesCatalog.js';
import { bgaOptimizer } from './bgaOptimizer.js';
import { greedyOptimizer } from './greedyOptimizer.js';

export function runOptimizationComparison(
  riskScore = 50,
  customConstraints?: Partial<OptimizationConstraints>,
  customBgaParams?: Partial<BGAParameters>
): OptimizationComparison {
  const constraints: OptimizationConstraints = {
    maxCpuBudget: customConstraints?.maxCpuBudget ?? 80,
    maxFalsePositiveRate: customConstraints?.maxFalsePositiveRate ?? 0.15,
  };

  const bgaParams: BGAParameters = {
    populationSize: customBgaParams?.populationSize ?? 40,
    generations: customBgaParams?.generations ?? 35,
    crossoverRate: customBgaParams?.crossoverRate ?? 0.85,
    mutationRate: customBgaParams?.mutationRate ?? 0.05,
    tournamentSize: customBgaParams?.tournamentSize ?? 3,
    seed: customBgaParams?.seed ?? 42,
  };

  // Executa o Guloso
  const greedyResult = greedyOptimizer.optimize(
    SECURITY_RULES_CATALOG,
    constraints,
    riskScore
  );

  // Executa o BGA
  const bgaResult = bgaOptimizer.optimize(
    SECURITY_RULES_CATALOG,
    constraints,
    bgaParams,
    riskScore
  );

  // Determinação do Vencedor por Fitness
  let winner: 'BGA' | 'GREEDY' | 'TIE' = 'TIE';
  const deltaFitness = bgaResult.fitnessScore - greedyResult.fitnessScore;

  if (Math.abs(deltaFitness) < 0.2) {
    winner = 'TIE';
  } else if (bgaResult.fitnessScore > greedyResult.fitnessScore) {
    winner = 'BGA';
  } else {
    winner = 'GREEDY';
  }

  // Análise técnica imparcial
  let summary = '';
  if (winner === 'TIE') {
    summary = `Empate técnico: Ambos os algoritmos convergiram para soluções com qualidade equivalente de aptidão (BGA: ${bgaResult.fitnessScore.toFixed(1)}, Guloso: ${greedyResult.fitnessScore.toFixed(1)}). O Guloso foi ${Math.max(1, Math.round(bgaResult.executionTimeMs / Math.max(0.01, greedyResult.executionTimeMs)))}x mais rápido por ser determinístico.`;
  } else if (winner === 'BGA') {
    summary = `BGA superou o baseline com aptidão de ${bgaResult.fitnessScore.toFixed(1)} contra ${greedyResult.fitnessScore.toFixed(1)} (+${deltaFitness.toFixed(1)}). O BGA explorou combinações com pré-requisitos e menor taxa agregada de FP (${(bgaResult.aggregatedFalsePositive * 100).toFixed(1)}% vs ${(greedyResult.aggregatedFalsePositive * 100).toFixed(1)}%).`;
  } else {
    summary = `O Baseline Guloso superou o BGA com aptidão de ${greedyResult.fitnessScore.toFixed(1)} contra ${bgaResult.fitnessScore.toFixed(1)} em tempo de ${greedyResult.executionTimeMs.toFixed(1)}ms. Em instâncias com ${SECURITY_RULES_CATALOG.length} regras, a heurística de gradiente local evitou a estocasticidade do crossover genético.`;
  }

  return {
    timestamp: Date.now(),
    riskScore,
    constraints,
    bgaResult,
    greedyResult,
    winner,
    analysisSummary: summary,
  };
}
