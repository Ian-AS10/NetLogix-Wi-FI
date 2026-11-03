/**
 * @file greedy.test.ts
 * Testes unitários para o Baseline Guloso determinístico.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { greedyOptimizer } from '../src/core/optimization/greedyOptimizer.js';
import { SECURITY_RULES_CATALOG } from '../src/core/optimization/rulesCatalog.js';
import { OptimizationConstraints } from '../src/domain/optimizer.js';

const constraints: OptimizationConstraints = {
  maxCpuBudget: 60,
  maxFalsePositiveRate: 0.10,
};

test('greedy: execução determinística sem estocasticidade', () => {
  const run1 = greedyOptimizer.optimize(SECURITY_RULES_CATALOG, constraints, 60);
  const run2 = greedyOptimizer.optimize(SECURITY_RULES_CATALOG, constraints, 60);

  assert.deepEqual(run1.chromosome, run2.chromosome);
  assert.equal(run1.fitnessScore, run2.fitnessScore);
  assert.deepEqual(run1.selectedRuleIds, run2.selectedRuleIds);
});

test('greedy: estrita conformidade com restrições e pré-requisitos', () => {
  const solution = greedyOptimizer.optimize(SECURITY_RULES_CATALOG, constraints, 85);

  assert.equal(solution.algorithm, 'GREEDY');
  assert.ok(solution.totalCpuCostPercent <= constraints.maxCpuBudget);
  assert.ok(solution.aggregatedFalsePositive <= constraints.maxFalsePositiveRate);
  assert.ok(solution.isConstraintValid);

  // Se RL-02 estiver selecionada, seu pré-requisito RL-01 deve estar presente
  if (solution.selectedRuleIds.includes('RL-02')) {
    assert.ok(solution.selectedRuleIds.includes('RL-01'), 'RL-02 requer RL-01 ativada');
  }

  // RL-09 e RL-10 são incompatíveis
  assert.ok(
    !(solution.selectedRuleIds.includes('RL-09') && solution.selectedRuleIds.includes('RL-10')),
    'Não pode ativar RL-09 e RL-10 simultaneamente'
  );
});
