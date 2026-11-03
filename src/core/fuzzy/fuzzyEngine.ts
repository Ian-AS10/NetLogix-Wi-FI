/**
 * @file fuzzyEngine.ts
 * Motor de inferência difuso Mamdani puro para avaliação de risco de rede.
 */

import { FuzzyEvaluationResult } from '../../domain/fuzzy.js';
import { trapezoidalMembership } from './membership.js';
import {
  TRAFFIC_RATE_SETS,
  ANOMALY_RATE_SETS,
  NEW_MACS_SETS,
  RISK_OUTPUT_SETS,
  FUZZY_RULES,
} from './ruleBase.js';

export interface FuzzyInputs {
  trafficRate: number; // pps
  anomalyRate: number; // eps
  newMacs: number;     // contagem
}

export class FuzzyInferenceEngine {
  /**
   * Avalia as métricas de rede e retorna o score de risco entre 0 e 100.
   */
  public evaluate(rawInputs: FuzzyInputs): FuzzyEvaluationResult {
    // 1. Validação e Clamping de Entradas
    const trafficRate = Math.max(0, isNaN(rawInputs.trafficRate) ? 0 : rawInputs.trafficRate);
    const anomalyRate = Math.max(0, isNaN(rawInputs.anomalyRate) ? 0 : rawInputs.anomalyRate);
    const newMacs = Math.max(0, isNaN(rawInputs.newMacs) ? 0 : rawInputs.newMacs);

    // 2. Fuzzificação das Entradas
    const trafficMemberships: Record<string, number> = {
      LOW: trapezoidalMembership(trafficRate, TRAFFIC_RATE_SETS.LOW),
      MEDIUM: trapezoidalMembership(trafficRate, TRAFFIC_RATE_SETS.MEDIUM),
      HIGH: trapezoidalMembership(trafficRate, TRAFFIC_RATE_SETS.HIGH),
    };

    const anomalyMemberships: Record<string, number> = {
      NORMAL: trapezoidalMembership(anomalyRate, ANOMALY_RATE_SETS.NORMAL),
      SUSPICIOUS: trapezoidalMembership(anomalyRate, ANOMALY_RATE_SETS.SUSPICIOUS),
      CRITICAL: trapezoidalMembership(anomalyRate, ANOMALY_RATE_SETS.CRITICAL),
    };

    const newMacsMemberships: Record<string, number> = {
      STABLE: trapezoidalMembership(newMacs, NEW_MACS_SETS.STABLE),
      MODERATE: trapezoidalMembership(newMacs, NEW_MACS_SETS.MODERATE),
      ELEVATED: trapezoidalMembership(newMacs, NEW_MACS_SETS.ELEVATED),
    };

    // 3. Avaliação das Regras de Inferência (T-norma MIN)
    const ruleFiringStrengths: Record<string, number> = {};
    const consequentStrengths: Record<string, number> = {
      VERY_LOW: 0,
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    let activeRulesCount = 0;

    for (const rule of FUZZY_RULES) {
      const muTraffic = trafficMemberships[rule.trafficRate] || 0;
      const muAnomaly = anomalyMemberships[rule.anomalyRate] || 0;
      const muMacs = newMacsMemberships[rule.newMacs] || 0;

      // Mamdani AND = min(A, B, C)
      const firingStrength = Math.min(muTraffic, muAnomaly, muMacs);
      ruleFiringStrengths[rule.id] = firingStrength;

      if (firingStrength > 0.001) {
        activeRulesCount++;
        // S-norma MAX de agregação para o mesmo consequente
        consequentStrengths[rule.consequentRisk] = Math.max(
          consequentStrengths[rule.consequentRisk],
          firingStrength
        );
      }
    }

    // 4. Defuzzificação via Centro de Gravidade (Centróide) discretizado em [0, 100]
    let numerator = 0;
    let denominator = 0;
    const step = 1.0;

    for (let y = 0; y <= 100; y += step) {
      // Pertinência agregada no ponto y: max over consequents (min(alpha_c, mu_c(y)))
      let aggregatedMu = 0;

      for (const [consequentName, alpha] of Object.entries(consequentStrengths)) {
        if (alpha <= 0) continue;
        const setPoints = RISK_OUTPUT_SETS[consequentName];
        if (!setPoints) continue;
        const setMu = trapezoidalMembership(y, setPoints);
        const clippedMu = Math.min(alpha, setMu);
        aggregatedMu = Math.max(aggregatedMu, clippedMu);
      }

      numerator += y * aggregatedMu;
      denominator += aggregatedMu;
    }

    let calculatedScore = denominator > 0.0001 ? numerator / denominator : 5.0;
    // Garante limites [0, 100] e arredondamento a 1 casa decimal
    calculatedScore = Math.min(100, Math.max(0, Math.round(calculatedScore * 10) / 10));

    // 5. Classificação da Faixa de Severidade
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (calculatedScore < 35) {
      riskLevel = 'LOW';
    } else if (calculatedScore < 65) {
      riskLevel = 'MEDIUM';
    } else if (calculatedScore < 85) {
      riskLevel = 'HIGH';
    } else {
      riskLevel = 'CRITICAL';
    }

    return {
      riskScore: calculatedScore,
      riskLevel,
      firingStrengths: ruleFiringStrengths,
      activeRulesCount,
      inputs: {
        trafficRate,
        anomalyRate,
        newMacs,
      },
    };
  }
}

export const fuzzyEngine = new FuzzyInferenceEngine();
