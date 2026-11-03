/**
 * @file fuzzy.test.ts
 * Testes unitários para o motor de inferência difuso Mamdani.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { fuzzyEngine } from '../src/core/fuzzy/fuzzyEngine.js';
import { trapezoidalMembership, triangularMembership } from '../src/core/fuzzy/membership.js';

test('membership: função trapezoidal ombro esquerdo e direito', () => {
  // Ombro esquerdo [0, 0, 10, 20]
  assert.equal(trapezoidalMembership(0, [0, 0, 10, 20]), 1.0);
  assert.equal(trapezoidalMembership(-5, [0, 0, 10, 20]), 1.0);
  assert.equal(trapezoidalMembership(5, [0, 0, 10, 20]), 1.0);
  assert.equal(trapezoidalMembership(15, [0, 0, 10, 20]), 0.5);
  assert.equal(trapezoidalMembership(25, [0, 0, 10, 20]), 0.0);

  // Ombro direito [50, 80, 100, 100]
  assert.equal(trapezoidalMembership(100, [50, 80, 100, 100]), 1.0);
  assert.equal(trapezoidalMembership(120, [50, 80, 100, 100]), 1.0);
  assert.equal(trapezoidalMembership(40, [50, 80, 100, 100]), 0.0);
  assert.equal(trapezoidalMembership(65, [50, 80, 100, 100]), 0.5);

  // Triangular [10, 20, 30]
  assert.equal(triangularMembership(10, 10, 20, 30), 0.0);
  assert.equal(triangularMembership(20, 10, 20, 30), 1.0);
  assert.equal(triangularMembership(15, 10, 20, 30), 0.5);
});

test('fuzzy: tráfego calmo (baixo) resulta em score de risco BAIXO', () => {
  const result = fuzzyEngine.evaluate({
    trafficRate: 80,   // pps baixo
    anomalyRate: 1,    // eps normal
    newMacs: 0,        // estável
  });

  assert.ok(result.riskScore >= 0 && result.riskScore <= 35, `Score ${result.riskScore} deve ser <= 35`);
  assert.equal(result.riskLevel, 'LOW');
  assert.ok(result.activeRulesCount > 0, 'Deve ativar pelo menos uma regra fuzzy');
});

test('fuzzy: ataque massivo (alto tráfego, anomalias e novos MACs) resulta em score de risco CRÍTICO', () => {
  const result = fuzzyEngine.evaluate({
    trafficRate: 3500,  // pps alto
    anomalyRate: 120,   // eps crítico
    newMacs: 30,        // elevado
  });

  assert.ok(result.riskScore >= 80, `Score ${result.riskScore} deve ser >= 80`);
  assert.equal(result.riskLevel, 'CRITICAL');
});

test('fuzzy: condições intermediárias geram severidade MEDIUM ou HIGH', () => {
  const result = fuzzyEngine.evaluate({
    trafficRate: 800,  // médio
    anomalyRate: 25,   // suspeito
    newMacs: 4,        // moderado
  });

  assert.ok(result.riskScore >= 35 && result.riskScore <= 85);
  assert.ok(['MEDIUM', 'HIGH'].includes(result.riskLevel));
});

test('fuzzy: robustez com valores negativos, NaN e limites extremos', () => {
  // Trata NaN e valores negativos com clamping seguro
  const clampedResult = fuzzyEngine.evaluate({
    trafficRate: -50,
    anomalyRate: NaN,
    newMacs: -2,
  });

  assert.ok(!isNaN(clampedResult.riskScore));
  assert.ok(clampedResult.riskScore >= 0 && clampedResult.riskScore <= 100);

  // Valores astronomicamente altos sofrem clamping sem estourar o score
  const extremeResult = fuzzyEngine.evaluate({
    trafficRate: 999999,
    anomalyRate: 999999,
    newMacs: 999999,
  });

  assert.ok(extremeResult.riskScore <= 100);
  assert.equal(extremeResult.riskLevel, 'CRITICAL');
});
