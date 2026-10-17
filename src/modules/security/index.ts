import { SecurityRule } from '../../types';

export const SECURITY_RULES: SecurityRule[] = [
  { id: 'R1', name: 'Bloqueio Automático após 5 Falhas', targetAttack: 'BRUTE_FORCE', cpuCost: 5, falsePositiveRate: 0.01, riskCoverage: 40 },
  { id: 'R2', name: 'Filtro de Frequência MAC', targetAttack: 'MAC_SPOOFING', cpuCost: 15, falsePositiveRate: 0.05, riskCoverage: 60 },
  { id: 'R3', name: 'Drop de Port Scan Intrusivo', targetAttack: 'PORT_SCAN', cpuCost: 8, falsePositiveRate: 0.02, riskCoverage: 30 },
  { id: 'R4', name: 'Análise Profunda de Pacotes (DPI)', targetAttack: 'BRUTE_FORCE', cpuCost: 45, falsePositiveRate: 0.1, riskCoverage: 95 }
];