/**
 * @file fuzzy.ts
 * Contratos do motor de inferência difuso Mamdani.
 */

export type TrapezoidPoints = [number, number, number, number];

export interface FuzzyMembershipSet {
  name: string;
  points: TrapezoidPoints;
}

export interface FuzzyRuleDefinition {
  id: string;
  trafficRate: string; // 'LOW' | 'MEDIUM' | 'HIGH'
  anomalyRate: string; // 'NORMAL' | 'SUSPICIOUS' | 'CRITICAL'
  newMacs: string;     // 'STABLE' | 'MODERATE' | 'ELEVATED'
  consequentRisk: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface FuzzyEvaluationResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  firingStrengths: Record<string, number>;
  activeRulesCount: number;
  inputs: {
    trafficRate: number;
    anomalyRate: number;
    newMacs: number;
  };
}
