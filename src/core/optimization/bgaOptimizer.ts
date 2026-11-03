/**
 * @file bgaOptimizer.ts
 * Algoritmo Genético Binário (BGA) para otimização de seleção de regras de defesa.
 */

import { SecurityRule } from '../../domain/rules.js';
import {
  BGAParameters,
  OptimizationConstraints,
  OptimizationSolution,
} from '../../domain/optimizer.js';
import { evaluateSolution, FitnessEvaluation } from './fitness.js';
import { PRNG } from '../../utils/prng.js';

interface Individual {
  chromosome: number[];
  evaluation: FitnessEvaluation;
}

export class BGAOptimizer {
  private prng: PRNG;

  constructor(seed = 42) {
    this.prng = new PRNG(seed);
  }

  /**
   * Executa a otimização BGA sobre o catálogo de regras.
   */
  public optimize(
    catalog: SecurityRule[],
    constraints: OptimizationConstraints,
    params: BGAParameters,
    riskScore = 50
  ): OptimizationSolution {
    const startTime = performance.now();
    this.prng.reset(params.seed ?? 42);

    const chromosomeLength = catalog.length;
    const normalizedRisk = Math.max(0.1, riskScore / 100);

    // 1. Inicialização da População
    let population: Individual[] = [];
    for (let i = 0; i < params.populationSize; i++) {
      const chromosome: number[] = [];
      for (let j = 0; j < chromosomeLength; j++) {
        // Inicialização balanceada (probabilidade ~ 0.3 de ativação inicial para evitar sobrecarga)
        chromosome.push(this.prng.chance(0.3) ? 1 : 0);
      }
      this.repairChromosome(chromosome, catalog, constraints);
      const evaluation = evaluateSolution(chromosome, catalog, constraints, normalizedRisk);
      population.push({ chromosome, evaluation });
    }

    // Ordena do melhor para o pior
    population.sort((a, b) => b.evaluation.fitness - a.evaluation.fitness);

    // 2. Loop de Gerações
    const generations = params.generations;
    const tournamentSize = params.tournamentSize;
    const crossoverRate = params.crossoverRate;
    const mutationRate = params.mutationRate;

    for (let gen = 0; gen < generations; gen++) {
      const nextGen: Individual[] = [];

      // Elitismo: preserva os 2 melhores indivíduos
      nextGen.push({
        chromosome: [...population[0].chromosome],
        evaluation: population[0].evaluation,
      });
      if (population.length > 1) {
        nextGen.push({
          chromosome: [...population[1].chromosome],
          evaluation: population[1].evaluation,
        });
      }

      // Reprodução
      while (nextGen.length < params.populationSize) {
        const parent1 = this.tournamentSelect(population, tournamentSize);
        const parent2 = this.tournamentSelect(population, tournamentSize);

        let child1Chromosome = [...parent1.chromosome];
        let child2Chromosome = [...parent2.chromosome];

        // Crossover
        if (this.prng.chance(crossoverRate)) {
          const cutPoint = this.prng.nextInt(1, chromosomeLength - 1);
          child1Chromosome = [
            ...parent1.chromosome.slice(0, cutPoint),
            ...parent2.chromosome.slice(cutPoint),
          ];
          child2Chromosome = [
            ...parent2.chromosome.slice(0, cutPoint),
            ...parent1.chromosome.slice(cutPoint),
          ];
        }

        // Mutação Bit-Flip
        this.mutate(child1Chromosome, mutationRate);
        this.mutate(child2Chromosome, mutationRate);

        // Reparação Inteligente
        this.repairChromosome(child1Chromosome, catalog, constraints);
        this.repairChromosome(child2Chromosome, catalog, constraints);

        const eval1 = evaluateSolution(child1Chromosome, catalog, constraints, normalizedRisk);
        nextGen.push({ chromosome: child1Chromosome, evaluation: eval1 });

        if (nextGen.length < params.populationSize) {
          const eval2 = evaluateSolution(child2Chromosome, catalog, constraints, normalizedRisk);
          nextGen.push({ chromosome: child2Chromosome, evaluation: eval2 });
        }
      }

      population = nextGen;
      population.sort((a, b) => b.evaluation.fitness - a.evaluation.fitness);
    }

    const bestIndividual = population[0];
    const endTime = performance.now();
    const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

    const selectedRuleIds: string[] = [];
    const selectedRules: SecurityRule[] = [];
    for (let i = 0; i < chromosomeLength; i++) {
      if (bestIndividual.chromosome[i] === 1 && catalog[i]) {
        selectedRuleIds.push(catalog[i].id);
        selectedRules.push(catalog[i]);
      }
    }

    return {
      algorithm: 'BGA',
      chromosome: bestIndividual.chromosome,
      selectedRuleIds,
      selectedRules,
      fitnessScore: bestIndividual.evaluation.fitness,
      effectiveCoveragePercent: bestIndividual.evaluation.effectiveCoveragePercent,
      totalCpuCostPercent: bestIndividual.evaluation.totalCpuCostPercent,
      aggregatedFalsePositive: bestIndividual.evaluation.aggregatedFalsePositive,
      executionTimeMs,
      isConstraintValid: bestIndividual.evaluation.isConstraintValid,
      violations: bestIndividual.evaluation.violations,
    };
  }

  private tournamentSelect(population: Individual[], k: number): Individual {
    let best = population[this.prng.nextInt(0, population.length - 1)];
    for (let i = 1; i < k; i++) {
      const candidate = population[this.prng.nextInt(0, population.length - 1)];
      if (candidate.evaluation.fitness > best.evaluation.fitness) {
        best = candidate;
      }
    }
    return best;
  }

  private mutate(chromosome: number[], rate: number): void {
    for (let i = 0; i < chromosome.length; i++) {
      if (this.prng.chance(rate)) {
        chromosome[i] = chromosome[i] === 1 ? 0 : 1;
      }
    }
  }

  /**
   * Reparação de cromossomo para manter soluções dentro do espaço viável.
   */
  private repairChromosome(
    chromosome: number[],
    catalog: SecurityRule[],
    constraints: OptimizationConstraints
  ): void {
    // 1. Resolução de Pré-requisitos
    for (let i = 0; i < chromosome.length; i++) {
      if (chromosome[i] === 1 && catalog[i].prerequisites) {
        for (const prereqId of catalog[i].prerequisites!) {
          const prereqIdx = catalog.findIndex((r) => r.id === prereqId);
          if (prereqIdx !== -1) {
            chromosome[prereqIdx] = 1; // Ativa pré-requisito
          }
        }
      }
    }

    // 2. Resolução de Incompatibilidades (desativa a regra de maior custo)
    for (let i = 0; i < chromosome.length; i++) {
      if (chromosome[i] === 1 && catalog[i].incompatibilities) {
        for (const incompId of catalog[i].incompatibilities!) {
          const incompIdx = catalog.findIndex((r) => r.id === incompId);
          if (incompIdx !== -1 && chromosome[incompIdx] === 1) {
            if (catalog[i].cpuCost > catalog[incompIdx].cpuCost) {
              chromosome[i] = 0;
            } else {
              chromosome[incompIdx] = 0;
            }
          }
        }
      }
    }

    // 3. Poda gulosa de orçamento se ultrapassar CPU ou FP
    let currentCpu = 0;
    for (let i = 0; i < chromosome.length; i++) {
      if (chromosome[i] === 1) currentCpu += catalog[i].cpuCost;
    }

    if (currentCpu > constraints.maxCpuBudget) {
      // Ordena índices ativados por pior relação benefício/custo
      const activeIndices = chromosome
        .map((val, idx) => (val === 1 ? idx : -1))
        .filter((idx) => idx !== -1)
        .sort((a, b) => {
          const effA = catalog[a].threatCoverage / catalog[a].cpuCost;
          const effB = catalog[b].threatCoverage / catalog[b].cpuCost;
          return effA - effB; // menor eficiência primeiro
        });

      for (const idx of activeIndices) {
        if (currentCpu <= constraints.maxCpuBudget) break;
        chromosome[idx] = 0;
        currentCpu -= catalog[idx].cpuCost;
      }
    }
  }
}

export const bgaOptimizer = new BGAOptimizer();
