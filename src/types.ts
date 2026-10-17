export interface NetworkMetrics {
  connectionRate: number; // req/s
  authFailures: number;   // erros/min
  newMacCount: number;    // novos MACs/min
}

export interface SecurityRule {
  id: string;
  name: string;
  targetAttack: 'BRUTE_FORCE' | 'MAC_SPOOFING' | 'PORT_SCAN';
  cpuCost: number;          // % de uso de CPU
  falsePositiveRate: number;// Taxa de falso positivo (0.0 a 1.0)
  riskCoverage: number;     // Cobertura de risco (0 a 100)
}

export interface OptimizationConstraints {
  maxCpuLimit: number;          // Teto de CPU (% máximo)
  maxFalsePositiveRate: number; // Teto de FPR aceitável
}

export interface IOptimizationStrategy {
  name: string;
  optimize(rules: SecurityRule[], constraints: OptimizationConstraints): SecurityRule[];
}