/**
 * @file greedyOptimizer.ts
 * Algoritmo Guloso Baseline (Deterministic Greedy Heuristic) para seleção de regras.
 */

import { SecurityRule } from '../../domain/rules.js';
import {
  OptimizationConstraints,
  OptimizationSolution,
} from '../../domain/optimizer.js';
import { evaluateSolution } from './fitness.js';

export class GreedyOptimizer {
  /**
   * Executa a seleção gulosa determinística baseada na máxima razão benefício/custo.
   */
  public optimize(
    catalog: SecurityRule[],
    constraints: OptimizationConstraints,
    riskScore = 50
  ): OptimizationSolution {
    const startTime = performance.now();
    const chromosomeLength = catalog.length;
    const chromosome: number[] = new Array(chromosomeLength).fill(0);
    const normalizedRisk = Math.max(0.1, riskScore / 100);

    // Avaliação base inicial (nenhuma regra selecionada)
    let currentEvaluation = evaluateSolution(chromosome, catalog, constraints, normalizedRisk);

    let progress = true;

    while (progress) {
      progress = false;
      let bestCandidateIndex = -1;
      let bestMarginalGain = 0;
      let bestCandidateEval = currentEvaluation;

      for (let i = 0; i < chromosomeLength; i++) {
        // Se a regra já está selecionada, pula
        if (chromosome[i] === 1) continue;

        const candidateRule = catalog[i];

        // Verifica incompatibilidade direta com as já selecionadas
        if (candidateRule.incompatibilities) {
          const hasIncomp = candidateRule.incompatibilities.some((incomp) => {
            const incompIdx = catalog.findIndex((r) => r.id === incomp);
            return incompIdx !== -1 && chromosome[incompIdx] === 1;
          });
          if (hasIncomp) continue;
        }

        // Se tiver pré-requisito não satisfeito, verifica se o pacote (regra + pré-requisito) cabe
        const testChromosome = [...chromosome];
        testChromosome[i] = 1;

        if (candidateRule.prerequisites) {
          for (const prereqId of candidateRule.prerequisites) {
            const prereqIdx = catalog.findIndex((r) => r.id === prereqId);
            if (prereqIdx !== -1) {
              testChromosome[prereqIdx] = 1;
            }
          }
        }

        const candidateEval = evaluateSolution(
          testChromosome,
          catalog,
          constraints,
          normalizedRisk
        );

        // A solução candidata deve respeitar estritamente o orçamento de CPU e FP
        if (!candidateEval.isConstraintValid) {
          continue;
        }

        const deltaFitness = candidateEval.fitness - currentEvaluation.fitness;
        const deltaCoverage = candidateEval.effectiveCoveragePercent - currentEvaluation.effectiveCoveragePercent;
        const marginalCost = Math.max(1, candidateRule.cpuCost);

        // Razão de ganho de aptidão pelo custo marginal
        const gainRatio = (deltaFitness + deltaCoverage * 0.5) / marginalCost;

        if (gainRatio > bestMarginalGain && deltaFitness > 0) {
          bestMarginalGain = gainRatio;
          bestCandidateIndex = i;
          bestCandidateEval = candidateEval;
        }
      }

      // Se encontrou uma regra que melhora a aptidão respeitando as restrições, adiciona
      if (bestCandidateIndex !== -1) {
        chromosome[bestCandidateIndex] = 1;
        const candidateRule = catalog[bestCandidateIndex];
        if (candidateRule.prerequisites) {
          for (const prereqId of candidateRule.prerequisites) {
            const prereqIdx = catalog.findIndex((r) => r.id === prereqId);
            if (prereqIdx !== -1) {
              chromosome[prereqIdx] = 1;
            }
          }
        }
        currentEvaluation = bestCandidateEval;
        progress = true;
      }
    }

    const endTime = performance.now();
    const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

    const selectedRuleIds: string[] = [];
    const selectedRules: SecurityRule[] = [];
    for (let i = 0; i < chromosomeLength; i++) {
      if (chromosome[i] === 1 && catalog[i]) {
        selectedRuleIds.push(catalog[i].id);
        selectedRules.push(catalog[i]);
      }
    }

    return {
      algorithm: 'GREEDY',
      chromosome,
      selectedRuleIds,
      selectedRules,
      fitnessScore: currentEvaluation.fitness,
      effectiveCoveragePercent: currentEvaluation.effectiveCoveragePercent,
      totalCpuCostPercent: currentEvaluation.totalCpuCostPercent,
      aggregatedFalsePositive: currentEvaluation.aggregatedFalsePositive,
      executionTimeMs,
      isConstraintValid: currentEvaluation.isConstraintValid,
      violations: currentEvaluation.violations,
    };
  }
}

export const greedyOptimizer = new GreedyOptimizer();
