/**
 * @file bga.test.ts
 * Testes unitários para o Algoritmo Genético Binário (BGA).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { bgaOptimizer } from '../src/core/optimization/bgaOptimizer.js';
import { SECURITY_RULES_CATALOG } from '../src/core/optimization/rulesCatalog.js';
import { OptimizationConstraints, BGAParameters } from '../src/domain/optimizer.js';

const defaultConstraints: OptimizationConstraints = {
  maxCpuBudget: 70,
  maxFalsePositiveRate: 0.12,
};

const defaultParams: BGAParameters = {
  populationSize: 30,
  generations: 25,
  crossoverRate: 0.85,
  mutationRate: 0.05,
  tournamentSize: 3,
  seed: 12345,
};

test('bga: solução gerada respeita as restrições orçamentárias de CPU e FP', () => {
  const solution = bgaOptimizer.optimize(
    SECURITY_RULES_CATALOG,
    defaultConstraints,
    defaultParams,
    80
  );

  assert.equal(solution.algorithm, 'BGA');
  assert.equal(solution.chromosome.length, SECURITY_RULES_CATALOG.length);
  assert.ok(
    solution.totalCpuCostPercent <= defaultConstraints.maxCpuBudget,
    `Custo de CPU ${solution.totalCpuCostPercent} deve ser <= ${defaultConstraints.maxCpuBudget}`
  );
  assert.ok(
    solution.aggregatedFalsePositive <= defaultConstraints.maxFalsePositiveRate,
    `FP ${solution.aggregatedFalsePositive} deve ser <= ${defaultConstraints.maxFalsePositiveRate}`
  );
  assert.ok(solution.isConstraintValid, `Solução BGA deve ser válida: ${solution.violations.join(', ')}`);
  assert.ok(solution.selectedRules.length > 0, 'BGA deve selecionar regras sob risco elevado');
});

test('bga: reprodutibilidade exata com mesma semente pseudoaleatória', () => {
  const sol1 = bgaOptimizer.optimize(
    SECURITY_RULES_CATALOG,
    defaultConstraints,
    { ...defaultParams, seed: 999 },
    75
  );

  const sol2 = bgaOptimizer.optimize(
    SECURITY_RULES_CATALOG,
    defaultConstraints,
    { ...defaultParams, seed: 999 },
    75
  );

  assert.deepEqual(sol1.chromosome, sol2.chromosome, 'Cromossomos devem ser idênticos para a mesma semente');
  assert.equal(sol1.fitnessScore, sol2.fitnessScore, 'Fitness deve ser idêntico');
  assert.deepEqual(sol1.selectedRuleIds, sol2.selectedRuleIds, 'Regras selecionadas devem ser idênticas');
});

test('bga: respeita incompatibilidades mútuas (ex: RL-09 vs RL-10)', () => {
  const solution = bgaOptimizer.optimize(
    SECURITY_RULES_CATALOG,
    defaultConstraints,
    defaultParams,
    90
  );

  const selectedIds = new Set(solution.selectedRuleIds);
  const hasRl09 = selectedIds.has('RL-09');
  const hasRl10 = selectedIds.has('RL-10');

  assert.ok(!(hasRl09 && hasRl10), 'Não deve ativar regras mutuamente incompatíveis (RL-09 e RL-10) simultaneamente');
});
