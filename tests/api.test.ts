/**
 * @file api.test.ts
 * Testes de integração para as rotas da API Express.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { createApp } from '../src/app.js';
import { AddressInfo } from 'net';

let server: http.Server;
let baseUrl = '';

test.before(async () => {
  const app = createApp();
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

test('API: GET /api/status retorna status válido do sistema', async () => {
  const res = await fetch(`${baseUrl}/api/status`);
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.riskScore >= 0 && json.data.riskScore <= 100);
  assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(json.data.riskLevel));
  assert.ok(typeof json.data.uptimeSeconds === 'number');
});

test('API: GET /api/rules retorna catálogo de regras com aviso de estimativa', async () => {
  const res = await fetch(`${baseUrl}/api/rules`);
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.equal(json.data.length, 10);
  assert.ok(json.meta.disclaimer.includes('estimativas'));
});

test('API: POST /api/metrics/inject valida inputs e atualiza score', async () => {
  // Teste com dados válidos
  const validRes = await fetch(`${baseUrl}/api/metrics/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trafficRate: 2500,
      anomalyRate: 85,
      newMacs: 25,
    }),
  });

  assert.equal(validRes.status, 200);
  const validJson = await validRes.json();
  assert.equal(validJson.success, true);
  assert.ok(validJson.data.riskScore >= 75);

  // Teste com entrada inválida (string em campo numérico)
  const invalidRes = await fetch(`${baseUrl}/api/metrics/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trafficRate: 'invalid_string',
      anomalyRate: 85,
      newMacs: 25,
    }),
  });

  assert.equal(invalidRes.status, 400);
  const invalidJson = await invalidRes.json();
  assert.equal(invalidJson.success, false);
  assert.ok(invalidJson.error.message.includes('numéricos'));
});

test('API: GET /api/optimizer/comparison retorna otimização BGA', async () => {
  const res = await fetch(`${baseUrl}/api/optimizer/comparison`);
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.bgaResult);
  assert.equal(json.data.bgaResult.algorithm, 'BGA');
  assert.ok(json.data.analysisSummary.length > 10);
});

test('API: Endpoint inexistente retorna 404 sem stack trace', async () => {
  const res = await fetch(`${baseUrl}/api/rota_inexistente_123`);
  assert.equal(res.status, 404);
  const json = await res.json();
  assert.equal(json.success, false);
  assert.equal(json.error.statusCode, 404);
  assert.equal((json as Record<string, unknown>).stack, undefined);
});
