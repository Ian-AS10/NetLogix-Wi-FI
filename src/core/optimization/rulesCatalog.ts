/**
 * @file rulesCatalog.ts
 * Catálogo tipado e documentado de contramedidas de segurança de rede para PoC.
 *
 * AVISO OPERACIONAL:
 * Os valores de custo de CPU, taxa de falso positivo e cobertura de ameaça são
 * estimativas heurísticas parametrizadas para a Prova de Conceito (PoC) NetLogix
 * e NÃO constituem garantias operacionais de roteadores de produção.
 */

import { SecurityRule } from '../../domain/rules.js';

export const SECURITY_RULES_CATALOG: SecurityRule[] = [
  {
    id: 'RL-01',
    name: 'TCP SYN-Proxy Rate Limiting',
    threatCategory: 'FLOOD',
    cpuCost: 15,
    fpRate: 0.02,
    threatCoverage: 0.75,
    description: 'Mitiga conexões incompletas SYN Flood mantendo cookies de handshake sem alocar buffers de socket prematuramente.',
  },
  {
    id: 'RL-02',
    name: 'Dynamic Conntrack Table Limiter',
    threatCategory: 'FLOOD',
    cpuCost: 22,
    fpRate: 0.05,
    threatCoverage: 0.85,
    prerequisites: ['RL-01'],
    description: 'Aplica teto de conexões simultâneas por IP de origem para preservar a tabela de estados do firewall.',
  },
  {
    id: 'RL-03',
    name: '802.11 Deauth Burst Suppression',
    threatCategory: 'DEAUTH',
    cpuCost: 12,
    fpRate: 0.03,
    threatCoverage: 0.80,
    description: 'Descarta rajadas de quadros de desautenticação e desassociação Wi-Fi não autenticados emitidos em curto intervalo.',
  },
  {
    id: 'RL-04',
    name: 'Strict PMF (Protected Management Frames) Verification',
    threatCategory: 'DEAUTH',
    cpuCost: 18,
    fpRate: 0.07,
    threatCoverage: 0.95,
    description: 'Valida criptografia e numeração sequencial de quadros de gerenciamento 802.11w para neutralizar ataques de desconexão.',
  },
  {
    id: 'RL-05',
    name: 'Dynamic ARP Inspection (DAI)',
    threatCategory: 'SPOOFING',
    cpuCost: 16,
    fpRate: 0.03,
    threatCoverage: 0.85,
    description: 'Intercepta e valida pacotes ARP confrontando contra a base de concessões DHCP confiáveis para barrar envenenamento de cache.',
  },
  {
    id: 'RL-06',
    name: 'Static DHCP MAC-to-IP Binding Filter',
    threatCategory: 'SPOOFING',
    cpuCost: 10,
    fpRate: 0.05,
    threatCoverage: 0.70,
    description: 'Bloqueia tráfego originado de endereços IP incompatíveis com o MAC cadastrado no roteador.',
  },
  {
    id: 'RL-07',
    name: 'Port Scan Heuristic Window Drop',
    threatCategory: 'SCAN',
    cpuCost: 14,
    fpRate: 0.04,
    threatCoverage: 0.78,
    description: 'Detecta sondagens sequenciais ou estocásticas de portas em tempo real e descarta temporariamente o IP escaneador.',
  },
  {
    id: 'RL-08',
    name: 'Adaptive TCP RST Storm Throttle',
    threatCategory: 'SCAN',
    cpuCost: 20,
    fpRate: 0.04,
    threatCoverage: 0.82,
    description: 'Limita a geração e trânsito de pacotes TCP Reset originados por sondagens a portas fechadas.',
  },
  {
    id: 'RL-09',
    name: 'Deep Flow Pattern Inspection (DFPI)',
    threatCategory: 'FLOOD',
    cpuCost: 38,
    fpRate: 0.08,
    threatCoverage: 0.92,
    incompatibilities: ['RL-10'],
    description: 'Analisa anomalias de entropia e payloads em camadas superiores; alto consumo computacional de CPU.',
  },
  {
    id: 'RL-10',
    name: 'Lightweight Stateless Flow Sampler',
    threatCategory: 'SCAN',
    cpuCost: 8,
    fpRate: 0.01,
    threatCoverage: 0.50,
    incompatibilities: ['RL-09'],
    description: 'Amostragem estatística rápida de cabeçalhos sem rastreamento de estado; baixo overhead para dispositivos legados.',
  },
];
