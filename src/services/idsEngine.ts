/**
 * @file idsEngine.ts
 * Orquestrador central do IDS NetLogix Wi-Fi: coleta métricas, infere risco fuzzy e aciona otimizadores.
 */

import {
  CaptureStatus,
  EngineMode,
  MetricSnapshot,
  RawPacketData,
  SystemStatus,
  ThreatScenario,
} from '../domain/metrics.js';
import { OptimizationComparison } from '../domain/optimizer.js';
import { config } from '../config/appConfig.js';
import { fuzzyEngine } from '../core/fuzzy/fuzzyEngine.js';
import { runOptimizationComparison } from '../core/optimization/optimizerComparison.js';
import { tsharkCaptureService } from './tsharkCaptureService.js';
import { simulatedTrafficService } from './simulatedTrafficService.js';
import { logger } from '../utils/logger.js';
import { ConflictError, ValidationError } from '../utils/errors.js';

export class IDSEngine {
  private mode: EngineMode = 'idle';
  private samplingWindowSec = config.samplingWindowSec;
  private currentWindowPackets = 0;
  private currentWindowBytes = 0;
  private currentWindowAnomalies = 0;
  private currentWindowMacs = new Set<string>();
  private knownMacCache = new Set<string>();

  private latestMetrics: MetricSnapshot;
  private metricsHistory: MetricSnapshot[] = [];
  private latestComparison: OptimizationComparison;
  private currentRiskScore = 15;
  private currentRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  private windowTimer: NodeJS.Timeout | null = null;
  private startTime = Date.now();
  private lastAnalysisTimestamp = Date.now();

  constructor() {
    this.latestMetrics = {
      trafficRate: 0,
      anomalyRate: 0,
      newMacs: 0,
      timestamp: Date.now(),
      windowDurationSec: this.samplingWindowSec,
      totalPackets: 0,
      totalBytes: 0,
    };

    // Inicializa otimizador com baseline padrão
    this.latestComparison = runOptimizationComparison(this.currentRiskScore);

    // Conecta callbacks de pacotes
    tsharkCaptureService.setOnPacket((packet) => this.handlePacket(packet));
    simulatedTrafficService.setOnPacket((packet) => this.handlePacket(packet));

    // Inicia janela periódica de avaliação métrica
    this.startWindowTicker();

    logger.info('IDSEngine', `Motor IDS NetLogix iniciado (Janela de amostragem: ${this.samplingWindowSec}s).`);
  }

  public getStatus(): SystemStatus {
    const captureStatus: CaptureStatus =
      this.mode === 'real_capture'
        ? tsharkCaptureService.getStatus()
        : this.mode === 'simulated'
        ? 'active'
        : 'stopped';

    return {
      status: captureStatus,
      mode: this.mode,
      selectedInterface: tsharkCaptureService.getSelectedInterface() || config.defaultNetworkInterface,
      riskScore: this.currentRiskScore,
      riskLevel: this.currentRiskLevel,
      latestMetrics: this.latestMetrics,
      activeScenario: this.mode === 'simulated' ? simulatedTrafficService.getScenario() : undefined,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      tsharkAvailable: tsharkCaptureService.isTSharkInstalled(),
      recommendedRulesCount: this.latestComparison.bgaResult.selectedRules.length,
      lastAnalysisTimestamp: this.lastAnalysisTimestamp,
    };
  }

  public getMetricsHistory(): MetricSnapshot[] {
    return [...this.metricsHistory];
  }

  public getLatestComparison(): OptimizationComparison {
    return this.latestComparison;
  }

  /**
   * Inicia captura real TShark.
   */
  public startRealCapture(networkInterface: string): void {
    if (this.mode === 'simulated') {
      throw new ConflictError('A simulação de tráfego está ativa. Pare a simulação antes de iniciar a captura real.');
    }
    if (this.mode === 'real_capture') {
      throw new ConflictError('A captura real já está em andamento.');
    }

    tsharkCaptureService.startCapture(networkInterface);
    this.mode = 'real_capture';
    logger.security('IDSEngine', `Modo alterado para CAPTURA REAL na interface: ${networkInterface}`);
  }

  /**
   * Encerra a captura real.
   */
  public stopRealCapture(): void {
    if (this.mode === 'real_capture') {
      tsharkCaptureService.stopCapture();
      this.mode = 'idle';
      logger.info('IDSEngine', 'Captura real interrompida.');
    }
  }

  /**
   * Inicia tráfego simulado para testes e auditoria sem TShark.
   */
  public startSimulation(scenario: ThreatScenario = 'normal'): void {
    if (this.mode === 'real_capture') {
      throw new ConflictError('A captura real está ativa. Pare a captura antes de iniciar a simulação.');
    }

    simulatedTrafficService.start(scenario);
    this.mode = 'simulated';
    logger.security('IDSEngine', `Modo alterado para SIMULAÇÃO DE TRÁFEGO (Cenário: ${scenario.toUpperCase()})`);
  }

  /**
   * Encerra a simulação de tráfego.
   */
  public stopSimulation(): void {
    if (this.mode === 'simulated') {
      simulatedTrafficService.stop();
      this.mode = 'idle';
      logger.info('IDSEngine', 'Simulação de tráfego encerrada.');
    }
  }

  /**
   * Injeção manual de métricas para testes unitários de laboratório.
   */
  public injectManualMetrics(trafficRate: number, anomalyRate: number, newMacs: number): SystemStatus {
    if (trafficRate < 0 || anomalyRate < 0 || newMacs < 0) {
      throw new ValidationError('Métricas manuais devem ser números positivos ou zero.');
    }

    logger.security('IDSEngine', `Injeção manual de métricas: ${trafficRate} pps, ${anomalyRate} eps, ${newMacs} novos MACs`);

    const snapshot: MetricSnapshot = {
      trafficRate,
      anomalyRate,
      newMacs,
      timestamp: Date.now(),
      windowDurationSec: this.samplingWindowSec,
      totalPackets: Math.round(trafficRate * this.samplingWindowSec),
      totalBytes: Math.round(trafficRate * this.samplingWindowSec * 512),
    };

    this.processWindowMetrics(snapshot);
    return this.getStatus();
  }

  /**
   * Reexecuta o comparador de otimização sob demanda com parâmetros customizados.
   */
  public reevaluateOptimizer(maxCpu?: number, maxFp?: number, seed?: number): OptimizationComparison {
    this.latestComparison = runOptimizationComparison(
      this.currentRiskScore,
      { maxCpuBudget: maxCpu, maxFalsePositiveRate: maxFp },
      { seed }
    );
    this.lastAnalysisTimestamp = Date.now();
    logger.info(
      'IDSEngine',
      `Otimizador reavaliado: Vencedor [${this.latestComparison.winner}], Fitness BGA: ${this.latestComparison.bgaResult.fitnessScore}, Guloso: ${this.latestComparison.greedyResult.fitnessScore}`
    );
    return this.latestComparison;
  }

  private handlePacket(packet: RawPacketData): void {
    this.currentWindowPackets++;
    this.currentWindowBytes += packet.frameLen;

    // Detecta anomalias conforme ADR-007
    // 1. TCP Reset flag
    // 2. 802.11 Deauth (subtype 12) ou Disassoc (subtype 10)
    const isDeauth = packet.wlanTypeSubtype === 10 || packet.wlanTypeSubtype === 12;
    if (packet.tcpFlagsReset || isDeauth) {
      this.currentWindowAnomalies++;
    }

    const mac = packet.wlanSa || packet.ethSrc;
    if (mac) {
      this.currentWindowMacs.add(mac.toLowerCase());
    }
  }

  private startWindowTicker(): void {
    this.windowTimer = setInterval(() => {
      this.onWindowTick();
    }, this.samplingWindowSec * 1000);
  }

  private onWindowTick(): void {
    const duration = this.samplingWindowSec;
    const trafficRate = Math.round((this.currentWindowPackets / duration) * 10) / 10;
    const anomalyRate = Math.round((this.currentWindowAnomalies / duration) * 10) / 10;

    // Contabiliza novos MACs observados
    let newMacsCount = 0;
    for (const mac of this.currentWindowMacs) {
      if (!this.knownMacCache.has(mac)) {
        newMacsCount++;
        this.knownMacCache.add(mac);
      }
    }

    // Limita o cache de MACs para evitar vazamento de memória (LRU básico)
    if (this.knownMacCache.size > 1000) {
      this.knownMacCache.clear();
    }

    const snapshot: MetricSnapshot = {
      trafficRate,
      anomalyRate,
      newMacs: newMacsCount,
      timestamp: Date.now(),
      windowDurationSec: duration,
      totalPackets: this.currentWindowPackets,
      totalBytes: this.currentWindowBytes,
    };

    // Zera contadores da janela
    this.currentWindowPackets = 0;
    this.currentWindowBytes = 0;
    this.currentWindowAnomalies = 0;
    this.currentWindowMacs.clear();

    this.processWindowMetrics(snapshot);
  }

  private processWindowMetrics(snapshot: MetricSnapshot): void {
    this.latestMetrics = snapshot;
    this.metricsHistory.push(snapshot);
    if (this.metricsHistory.length > config.historyBufferSize) {
      this.metricsHistory.shift();
    }

    // 1. Inferência Fuzzy de Risco
    const fuzzyResult = fuzzyEngine.evaluate({
      trafficRate: snapshot.trafficRate,
      anomalyRate: snapshot.anomalyRate,
      newMacs: snapshot.newMacs,
    });

    const previousScore = this.currentRiskScore;
    this.currentRiskScore = fuzzyResult.riskScore;
    this.currentRiskLevel = fuzzyResult.riskLevel;

    // 2. Se o score de risco variou significativamente (+- 3 pontos), reotimiza as regras
    if (Math.abs(previousScore - this.currentRiskScore) >= 3 || Date.now() - this.lastAnalysisTimestamp > 30000) {
      this.latestComparison = runOptimizationComparison(this.currentRiskScore);
      this.lastAnalysisTimestamp = Date.now();

      if (this.currentRiskLevel === 'HIGH' || this.currentRiskLevel === 'CRITICAL') {
        logger.security(
          'IDSEngine',
          `Alerta de Risco Elevado: Score ${this.currentRiskScore}/100 [${this.currentRiskLevel}]. Regras BGA recomendadas: ${this.latestComparison.bgaResult.selectedRuleIds.join(', ')}`
        );
      }
    }
  }

  public shutdown(): void {
    if (this.windowTimer) {
      clearInterval(this.windowTimer);
      this.windowTimer = null;
    }
    tsharkCaptureService.stopCapture();
    simulatedTrafficService.stop();
    logger.info('IDSEngine', 'Motor IDS finalizado.');
  }
}

export const idsEngine = new IDSEngine();
