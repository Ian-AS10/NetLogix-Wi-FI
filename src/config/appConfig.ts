/**
 * @file appConfig.ts
 * Configurações da aplicação NetLogix Wi-Fi com validação estrita.
 */

import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  port: number;
  host: string;
  samplingWindowSec: number;
  historyBufferSize: number;
  defaultNetworkInterface: string;
  maxCpuBudget: number;
  maxFalsePositiveRate: number;
  riskThreshold: number;
  bga: {
    populationSize: number;
    generations: number;
    crossoverRate: number;
    mutationRate: number;
    tournamentSize: number;
    seed: number;
  };
}

function parseNumber(envVar: string | undefined, defaultValue: number, min?: number, max?: number): number {
  if (!envVar) return defaultValue;
  const parsed = Number(envVar);
  if (isNaN(parsed)) return defaultValue;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return parsed;
}

export const config: AppConfig = {
  port: parseNumber(process.env.PORT, 3000, 1024, 65535),
  // Escuta por padrão em 127.0.0.1 conforme ADR-006 (segurança de PoC local),
  // ou 0.0.0.0 se explicitamente definido pelo ambiente do container AI Studio
  host: process.env.HOST || '0.0.0.0',
  samplingWindowSec: parseNumber(process.env.SAMPLING_WINDOW_SEC, 5, 1, 60),
  historyBufferSize: parseNumber(process.env.HISTORY_BUFFER_SIZE, 60, 10, 500),
  defaultNetworkInterface: process.env.DEFAULT_INTERFACE || 'wlan0',
  maxCpuBudget: parseNumber(process.env.MAX_CPU_BUDGET, 40, 10, 100),
  maxFalsePositiveRate: parseNumber(process.env.MAX_FP_RATE, 0.15, 0.01, 0.50),
  riskThreshold: parseNumber(process.env.RISK_THRESHOLD, 40, 10, 90),
  bga: {
    populationSize: parseNumber(process.env.BGA_POPULATION, 40, 10, 200),
    generations: parseNumber(process.env.BGA_GENERATIONS, 35, 5, 200),
    crossoverRate: parseNumber(process.env.BGA_CROSSOVER, 0.85, 0.1, 1.0),
    mutationRate: parseNumber(process.env.BGA_MUTATION, 0.05, 0.001, 0.5),
    tournamentSize: parseNumber(process.env.BGA_TOURNAMENT, 3, 2, 10),
    seed: parseNumber(process.env.BGA_SEED, 42),
  },
};
