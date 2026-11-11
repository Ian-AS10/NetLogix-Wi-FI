/**
 * @file optimizer.ts
 * Contratos de otimização combinatória: Algoritmo Genético Binário (BGA).
 */

import { SecurityRule } from './rules.js';

export interface OptimizationConstraints {
  /**
   * Limite orçamentário máximo de CPU acumulada (%)
   * Padrão: 40%
   */
  maxCpuBudget: number;

  /**
   * Limite máximo tolerável de taxa agregada de falso positivo (0 a 1.0)
   * Padrão: 0.15 (15%)
   */
  maxFalsePositiveRate: number;
}

export interface BGAParameters {
  populationSize: number;
  generations: number;
  crossoverRate: number;
  mutationRate: number;
  tournamentSize: number;
  seed?: number;
}

export interface OptimizationSolution {
  algorithm: 'BGA';
  chromosome: number[];
  selectedRuleIds: string[];
  selectedRules: SecurityRule[];
  fitnessScore: number;
  effectiveCoveragePercent: number; // 0 to 100%
  totalCpuCostPercent: number;       // 0 to 100%
  aggregatedFalsePositive: number;  // 0 to 1.0
  executionTimeMs: number;
  isConstraintValid: boolean;
  violations: string[];
}

export interface OptimizationComparison {
  timestamp: number;
  riskScore: number;
  constraints: OptimizationConstraints;
  bgaResult: OptimizationSolution;
  winner?: 'BGA';
  analysisSummary: string;
}
