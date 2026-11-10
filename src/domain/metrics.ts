/**
 * @file metrics.ts
 * Contratos de telemetria e métricas do IDS NetLogix Wi-Fi.
 */

export interface RawPacketData {
  timestamp: number;
  frameNumber?: number;
  frameLen: number;
  ipSrc?: string;
  ipDst?: string;
  tcpFlagsReset?: boolean;
  tcpFlagsSyn?: boolean;
  wlanTypeSubtype?: number;
  wlanSa?: string;
  ethSrc?: string;
}

export interface MetricSnapshot {
  /**
   * Taxa de tráfego na janela atual (pacotes por segundo).
   * Unidade: pps.
   */
  trafficRate: number;

  /**
   * Taxa de eventos anômalos (TCP Resets + 802.11 Deauth/Disassoc).
   * Unidade: eps (eventos por segundo).
   */
  anomalyRate: number;

  /**
   * Quantidade de novos endereços MAC observados na janela.
   * Unidade: contagem de dispositivos.
   */
  newMacs: number;

  /**
   * Timestamp de fechamento da janela de amostragem (epoch ms).
   */
  timestamp: number;

  /**
   * Duração da janela amostral em segundos.
   */
  windowDurationSec: number;

  /**
   * Total de pacotes acumulados na janela.
   */
  totalPackets: number;

  /**
   * Total de bytes transferidos na janela.
   */
  totalBytes: number;
}

export type ThreatScenario = 'normal' | 'syn_flood' | 'deauth_burst' | 'mac_spoofing';

export type CaptureStatus = 'stopped' | 'starting' | 'active' | 'error';
export type EngineMode = 'idle' | 'simulated' | 'real_capture';

export interface SystemStatus {
  status: CaptureStatus;
  mode: EngineMode;
  selectedInterface: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latestMetrics: MetricSnapshot;
  activeScenario?: ThreatScenario;
  uptimeSeconds: number;
  tsharkAvailable: boolean;
  recommendedRulesCount: number;
  enforcedRuleIds?: string[];
  autoProtectEnabled?: boolean;
  mitigatedPacketsTotal?: number;
  lastAnalysisTimestamp: number;
  hasAdminPrivileges?: boolean;
  physicalFirewallActive?: boolean;
  lastFirewallAction?: 'APPLIED' | 'PURGED' | 'IDLE';
}
