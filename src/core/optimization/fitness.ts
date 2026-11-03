/**
 * @file fitness.ts
 * Avaliação multiobjetivo de aptidão (fitness) com cobertura não linear de ameaças e restrições.
 */

import { SecurityRule, ThreatCategory } from '../../domain/rules.js';
import { OptimizationConstraints } from '../../domain/optimizer.js';

export interface FitnessEvaluation {
  fitness: number;
  effectiveCoveragePercent: number;
  totalCpuCostPercent: number;
  aggregatedFalsePositive: number;
  isConstraintValid: boolean;
  violations: string[];
}

const ALL_THREAT_CATEGORIES: ThreatCategory[] = ['FLOOD', 'SCAN', 'DEAUTH', 'SPOOFING'];

/**
 * Avalia um indivíduo cromossômico (vetor binário) frente às regras e restrições.
 */
export function evaluateSolution(
  chromosome: number[],
  catalog: SecurityRule[],
  constraints: OptimizationConstraints,
  riskWeight = 1.0
): FitnessEvaluation {
  const selectedRules: SecurityRule[] = [];
  const selectedRuleIds = new Set<string>();

  for (let i = 0; i < chromosome.length; i++) {
    if (chromosome[i] === 1 && catalog[i]) {
      selectedRules.push(catalog[i]);
      selectedRuleIds.add(catalog[i].id);
    }
  }

  // 1. Custo Total de CPU
  let totalCpu = 0;
  for (const rule of selectedRules) {
    totalCpu += rule.cpuCost;
  }

  // 2. Falso Positivo Agregado: 1 - prod(1 - fpRate)
  let fpComplement = 1.0;
  for (const rule of selectedRules) {
    fpComplement *= (1.0 - rule.fpRate);
  }
  const aggregatedFP = Math.min(1.0, Math.max(0, 1.0 - fpComplement));

  // 3. Cobertura Efetiva de Ameaças com Retornos Decrescentes
  // Evita que adicionar múltiplas regras para o mesmo vetor infle artificialmente a cobertura
  let totalCategoryCoverage = 0;
  for (const cat of ALL_THREAT_CATEGORIES) {
    const rulesForCat = selectedRules.filter((r) => r.threatCategory === cat);
    if (rulesForCat.length === 0) {
      continue;
    }
    let catComplement = 1.0;
    for (const r of rulesForCat) {
      catComplement *= (1.0 - r.threatCoverage);
    }
    const catCoverage = 1.0 - catComplement;
    totalCategoryCoverage += catCoverage;
  }
  const effectiveCoveragePercent = Math.round((totalCategoryCoverage / ALL_THREAT_CATEGORIES.length) * 1000) / 10;

  // 4. Verificação de Restrições e Conflitos
  const violations: string[] = [];

  if (totalCpu > constraints.maxCpuBudget) {
    violations.push(`Orçamento de CPU excedido: ${totalCpu.toFixed(1)}% > ${constraints.maxCpuBudget}%`);
  }

  if (aggregatedFP > constraints.maxFalsePositiveRate) {
    violations.push(
      `Falso positivo agregado excedido: ${(aggregatedFP * 100).toFixed(1)}% > ${(constraints.maxFalsePositiveRate * 100).toFixed(1)}%`
    );
  }

  for (const rule of selectedRules) {
    // Pré-requisitos
    if (rule.prerequisites) {
      for (const prereqId of rule.prerequisites) {
        if (!selectedRuleIds.has(prereqId)) {
          violations.push(`Regra ${rule.id} requer pré-requisito ausente: ${prereqId}`);
        }
      }
    }
    // Incompatibilidades
    if (rule.incompatibilities) {
      for (const incomp of rule.incompatibilities) {
        if (selectedRuleIds.has(incomp)) {
          violations.push(`Conflito de incompatibilidade mútua entre ${rule.id} e ${incomp}`);
        }
      }
    }
  }

  const isConstraintValid = violations.length === 0;

  // 5. Cálculo do Fitness
  // Base positiva: cobertura de ameaças proporcional ao risco da rede
  const coverageScore = (effectiveCoveragePercent / 100) * 100 * Math.max(0.2, riskWeight);

  // Penalidades proporcionais a custos de recurso
  const cpuPenalty = (totalCpu / Math.max(1, constraints.maxCpuBudget)) * 20;
  const fpPenalty = (aggregatedFP / Math.max(0.01, constraints.maxFalsePositiveRate)) * 25;

  // Penalidade severa por violação de restrições rígidas
  let violationPenalty = 0;
  if (!isConstraintValid) {
    violationPenalty = 200 + violations.length * 50;
    if (totalCpu > constraints.maxCpuBudget) {
      violationPenalty += (totalCpu - constraints.maxCpuBudget) * 5;
    }
    if (aggregatedFP > constraints.maxFalsePositiveRate) {
      violationPenalty += (aggregatedFP - constraints.maxFalsePositiveRate) * 1000;
    }
  }

  const rawFitness = coverageScore - cpuPenalty - fpPenalty - violationPenalty;
  const roundedFitness = Math.round(rawFitness * 100) / 100;

  return {
    fitness: roundedFitness,
    effectiveCoveragePercent,
    totalCpuCostPercent: totalCpu,
    aggregatedFalsePositive: Math.round(aggregatedFP * 10000) / 10000,
    isConstraintValid,
    violations,
  };
}
