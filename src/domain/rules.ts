/**
 * @file rules.ts
 * Contratos de regras de segurança e contramedidas de rede.
 */

export type ThreatCategory = 'FLOOD' | 'SCAN' | 'DEAUTH' | 'SPOOFING';

export interface SecurityRule {
  /**
   * Identificador único da regra (ex: 'RL-01').
   */
  id: string;

  /**
   * Nome descritivo da contramedida.
   */
  name: string;

  /**
   * Categoria de ameaça mitigada.
   */
  threatCategory: ThreatCategory;

  /**
   * Custo estimado de consumo de CPU no roteador/gateway (0 a 100%).
   * Nota: Valor referencial estimado para a PoC.
   */
  cpuCost: number;

  /**
   * Taxa estimada de falsos positivos em tráfego legítimo (0 a 1.0).
   * Exemplo: 0.05 = 5% de probabilidade de afetar fluxo legítimo.
   */
  fpRate: number;

  /**
   * Cobertura de eficácia estimada contra a categoria de ameaça (0 a 1.0).
   * Exemplo: 0.85 = mitiga 85% do vetor de ataque.
   */
  threatCoverage: number;

  /**
   * Regras que devem estar ativadas previamente como pré-requisito técnico.
   */
  prerequisites?: string[];

  /**
   * Regras que não podem coexistir simultaneamente por conflito operacional.
   */
  incompatibilities?: string[];

  /**
   * Descrição técnica do mecanismo de defesa.
   */
  description: string;

  /**
   * Diretiva técnica de aplicação no motor de proteção/firewall.
   */
  enforcementDirective?: string;
}
