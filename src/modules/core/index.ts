import { EventEmitter } from 'events';
import { IOptimizationStrategy, SecurityRule, OptimizationConstraints, NetworkMetrics } from '../../types';
import { FuzzyEngine } from '../fuzzy';
import { SECURITY_RULES } from '../security';

export class DefenseManager extends EventEmitter {
  private strategy: IOptimizationStrategy;
  private fuzzy: FuzzyEngine;
  private activeRules: SecurityRule[] = [];
  private currentRisk: number = 0;
  private latestMetrics: NetworkMetrics = { connectionRate: 0, authFailures: 0, newMacCount: 0 };

  constructor(strategy: IOptimizationStrategy) {
    super();
    this.strategy = strategy;
    this.fuzzy = new FuzzyEngine();
  }

  public evaluateNetwork(metrics: NetworkMetrics, constraints: OptimizationConstraints) {
    this.latestMetrics = metrics;
    this.currentRisk = this.fuzzy.calculateRiskScore(metrics);
    
    if (this.currentRisk > 40) {
      this.activeRules = this.strategy.optimize(SECURITY_RULES, constraints);
    } else {
      this.activeRules = []; 
    }
  }

  public getStatus() {
    return {
      riskScore: this.currentRisk,
      activeRules: this.activeRules,
      strategyInUse: this.strategy.name,
      metrics: this.latestMetrics
    };
  }
}