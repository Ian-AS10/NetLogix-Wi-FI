/**
 * @file ruleBase.ts
 * Conjuntos difusos e base de 27 regras de inferência Mamdani do NetLogix IDS.
 */

import { FuzzyMembershipSet, FuzzyRuleDefinition, TrapezoidPoints } from '../../domain/fuzzy.js';

// Universos de discurso e conjuntos difusos
export const TRAFFIC_RATE_SETS: Record<string, TrapezoidPoints> = {
  LOW: [0, 0, 100, 400],
  MEDIUM: [200, 600, 1000, 1600],
  HIGH: [1200, 2500, 5000, 5000],
};

export const ANOMALY_RATE_SETS: Record<string, TrapezoidPoints> = {
  NORMAL: [0, 0, 4, 15],
  SUSPICIOUS: [8, 25, 45, 80],
  CRITICAL: [50, 90, 200, 200],
};

export const NEW_MACS_SETS: Record<string, TrapezoidPoints> = {
  STABLE: [0, 0, 1, 3],
  MODERATE: [2, 5, 8, 14],
  ELEVATED: [10, 20, 50, 50],
};

export const RISK_OUTPUT_SETS: Record<string, TrapezoidPoints> = {
  VERY_LOW: [0, 0, 12, 22],
  LOW: [15, 25, 35, 45],
  MEDIUM: [35, 48, 55, 68],
  HIGH: [58, 70, 78, 88],
  CRITICAL: [78, 90, 100, 100],
};

/**
 * Matriz completa de 27 regras Mamdani (3 x 3 x 3).
 */
export const FUZZY_RULES: FuzzyRuleDefinition[] = [
  // Traffic: LOW
  { id: 'R01', trafficRate: 'LOW', anomalyRate: 'NORMAL', newMacs: 'STABLE', consequentRisk: 'VERY_LOW' },
  { id: 'R02', trafficRate: 'LOW', anomalyRate: 'NORMAL', newMacs: 'MODERATE', consequentRisk: 'LOW' },
  { id: 'R03', trafficRate: 'LOW', anomalyRate: 'NORMAL', newMacs: 'ELEVATED', consequentRisk: 'MEDIUM' },
  { id: 'R04', trafficRate: 'LOW', anomalyRate: 'SUSPICIOUS', newMacs: 'STABLE', consequentRisk: 'LOW' },
  { id: 'R05', trafficRate: 'LOW', anomalyRate: 'SUSPICIOUS', newMacs: 'MODERATE', consequentRisk: 'MEDIUM' },
  { id: 'R06', trafficRate: 'LOW', anomalyRate: 'SUSPICIOUS', newMacs: 'ELEVATED', consequentRisk: 'HIGH' },
  { id: 'R07', trafficRate: 'LOW', anomalyRate: 'CRITICAL', newMacs: 'STABLE', consequentRisk: 'MEDIUM' },
  { id: 'R08', trafficRate: 'LOW', anomalyRate: 'CRITICAL', newMacs: 'MODERATE', consequentRisk: 'HIGH' },
  { id: 'R09', trafficRate: 'LOW', anomalyRate: 'CRITICAL', newMacs: 'ELEVATED', consequentRisk: 'CRITICAL' },

  // Traffic: MEDIUM
  { id: 'R10', trafficRate: 'MEDIUM', anomalyRate: 'NORMAL', newMacs: 'STABLE', consequentRisk: 'LOW' },
  { id: 'R11', trafficRate: 'MEDIUM', anomalyRate: 'NORMAL', newMacs: 'MODERATE', consequentRisk: 'LOW' },
  { id: 'R12', trafficRate: 'MEDIUM', anomalyRate: 'NORMAL', newMacs: 'ELEVATED', consequentRisk: 'MEDIUM' },
  { id: 'R13', trafficRate: 'MEDIUM', anomalyRate: 'SUSPICIOUS', newMacs: 'STABLE', consequentRisk: 'MEDIUM' },
  { id: 'R14', trafficRate: 'MEDIUM', anomalyRate: 'SUSPICIOUS', newMacs: 'MODERATE', consequentRisk: 'HIGH' },
  { id: 'R15', trafficRate: 'MEDIUM', anomalyRate: 'SUSPICIOUS', newMacs: 'ELEVATED', consequentRisk: 'HIGH' },
  { id: 'R16', trafficRate: 'MEDIUM', anomalyRate: 'CRITICAL', newMacs: 'STABLE', consequentRisk: 'HIGH' },
  { id: 'R17', trafficRate: 'MEDIUM', anomalyRate: 'CRITICAL', newMacs: 'MODERATE', consequentRisk: 'CRITICAL' },
  { id: 'R18', trafficRate: 'MEDIUM', anomalyRate: 'CRITICAL', newMacs: 'ELEVATED', consequentRisk: 'CRITICAL' },

  // Traffic: HIGH
  { id: 'R19', trafficRate: 'HIGH', anomalyRate: 'NORMAL', newMacs: 'STABLE', consequentRisk: 'MEDIUM' },
  { id: 'R20', trafficRate: 'HIGH', anomalyRate: 'NORMAL', newMacs: 'MODERATE', consequentRisk: 'HIGH' },
  { id: 'R21', trafficRate: 'HIGH', anomalyRate: 'NORMAL', newMacs: 'ELEVATED', consequentRisk: 'HIGH' },
  { id: 'R22', trafficRate: 'HIGH', anomalyRate: 'SUSPICIOUS', newMacs: 'STABLE', consequentRisk: 'HIGH' },
  { id: 'R23', trafficRate: 'HIGH', anomalyRate: 'SUSPICIOUS', newMacs: 'MODERATE', consequentRisk: 'CRITICAL' },
  { id: 'R24', trafficRate: 'HIGH', anomalyRate: 'SUSPICIOUS', newMacs: 'ELEVATED', consequentRisk: 'CRITICAL' },
  { id: 'R25', trafficRate: 'HIGH', anomalyRate: 'CRITICAL', newMacs: 'STABLE', consequentRisk: 'CRITICAL' },
  { id: 'R26', trafficRate: 'HIGH', anomalyRate: 'CRITICAL', newMacs: 'MODERATE', consequentRisk: 'CRITICAL' },
  { id: 'R27', trafficRate: 'HIGH', anomalyRate: 'CRITICAL', newMacs: 'ELEVATED', consequentRisk: 'CRITICAL' },
];
