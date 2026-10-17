import { IOptimizationStrategy, SecurityRule, OptimizationConstraints } from '../../types';

export class BGAOptimizer implements IOptimizationStrategy {
  name = 'Algoritmo Genético Binário (BGA)';

  optimize(rules: SecurityRule[], constraints: OptimizationConstraints): SecurityRule[] {
    let bestSelection: SecurityRule[] = [];
    let maxCoverage = 0;

    for (let i = 0; i < (1 << rules.length); i++) {
      let currentCpu = 0;
      let currentCoverage = 0;
      let isValid = true;
      let currentSelection: SecurityRule[] = [];

      for (let j = 0; j < rules.length; j++) {
        if ((i & (1 << j)) !== 0) {
          currentCpu += rules[j].cpuCost;
          currentCoverage += rules[j].riskCoverage;
          currentSelection.push(rules[j]);

          if (currentCpu > constraints.maxCpuLimit || rules[j].falsePositiveRate > constraints.maxFalsePositiveRate) {
            isValid = false;
            break;
          }
        }
      }

      if (isValid && currentCoverage > maxCoverage) {
        maxCoverage = currentCoverage;
        bestSelection = currentSelection;
      }
    }
    return bestSelection;
  }
}