import { NetworkMetrics } from '../../types';

export class FuzzyEngine {
  public calculateRiskScore(metrics: NetworkMetrics): number {
    let riskScore = 0;
    if (metrics.connectionRate > 100) riskScore += 20;
    else if (metrics.connectionRate > 50) riskScore += 10;

    if (metrics.authFailures > 10) riskScore += 50;
    else if (metrics.authFailures > 5) riskScore += 25;

    if (metrics.newMacCount > 5) riskScore += 30;

    return Math.min(riskScore, 100);
  }
}