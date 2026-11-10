/**
 * @file idsEngine.ts
 * Orquestrador central do IDS/IPS NetLogix Wi-Fi: coleta métricas, infere risco fuzzy,
 * executa os otimizadores (BGA vs Guloso) e aplica regras de proteção ativa.
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
import { SECURITY_RULES_CATALOG } from '../core/optimization/rulesCatalog.js';
import { firewallManager } from './firewallManager.js';
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
  private currentRiskScore = 28;
  private currentRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  private windowTimer: NodeJS.Timeout | null = null;
  private startTime = Date.now();
  private lastAnalysisTimestamp = Date.now();

  // Estado de Proteção Ativa (IPS)
  private enforcedRuleIds = new Set<string>();
  private autoProtectEnabled = true;
  private mitigatedPacketsTotal = 0;

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

    // Inicializa comparador BGA vs Guloso com os limites do sistema (40% de CPU)
    this.latestComparison = runOptimizationComparison(this.currentRiskScore, {
      maxCpuBudget: config.maxCpuBudget,
    });

    // Se o score inicial estiver acima do limiar de 40%, ativa regras. Se <= 40%, inicia seguro (expurgado).
    if (this.currentRiskScore > config.riskThreshold) {
      for (const id of this.latestComparison.bgaResult.selectedRuleIds) {
        this.enforcedRuleIds.add(id);
      }
      const rulesToEnforce = SECURITY_RULES_CATALOG.filter((r) => this.enforcedRuleIds.has(r.id));
      firewallManager.applyRules(rulesToEnforce);
    } else {
      // Estado seguro inicial (Risco <= 40% -> nenhuma regra física ativa)
      firewallManager.purgeRules(false);
    }

    // Conecta callbacks de pacotes
    tsharkCaptureService.setOnPacket((packet) => this.handlePacket(packet));
    simulatedTrafficService.setOnPacket((packet) => this.handlePacket(packet));

    // Inicia janela periódica de avaliação métrica
    this.startWindowTicker();

    logger.info(
      'IDSEngine',
      `Motor IDS/IPS NetLogix iniciado [Limiar: ${config.riskThreshold}%, CPU Max: ${config.maxCpuBudget}%]. Estado Inicial: ${
        this.enforcedRuleIds.size > 0
          ? `Proteção Ativa (${this.enforcedRuleIds.size} regras)`
          : 'Tráfego Seguro (Sem regras ativas no firewall)'
      }.`
    );
  }

  public getStatus(): SystemStatus {
    const captureStatus: CaptureStatus =
      this.mode === 'real_capture'
        ? tsharkCaptureService.getStatus()
        : this.mode === 'simulated'
        ? 'active'
        : 'stopped';

    const fwStatus = firewallManager.getStatus();

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
      recommendedRulesCount: this.enforcedRuleIds.size,
      enforcedRuleIds: Array.from(this.enforcedRuleIds),
      autoProtectEnabled: this.autoProtectEnabled,
      mitigatedPacketsTotal: this.mitigatedPacketsTotal,
      lastAnalysisTimestamp: this.lastAnalysisTimestamp,
      hasAdminPrivileges: fwStatus.hasAdminPrivileges,
      physicalFirewallActive: fwStatus.activePhysicalRulesCount > 0,
      lastFirewallAction: fwStatus.lastAction,
    };
  }

  public getMetricsHistory(): MetricSnapshot[] {
    return [...this.metricsHistory];
  }

  public getLatestComparison(): OptimizationComparison {
    return this.latestComparison;
  }

  /**
   * Ativa ou desativa manualmente uma regra de defesa específica na camada de proteção.
   */
  public toggleRuleEnforcement(ruleId: string): SystemStatus {
    const rule = SECURITY_RULES_CATALOG.find((r) => r.id === ruleId);
    if (!rule) {
      throw new ValidationError(`Regra de defesa "${ruleId}" não encontrada no catálogo.`);
    }

    if (this.enforcedRuleIds.has(ruleId)) {
      this.enforcedRuleIds.delete(ruleId);
      logger.warn('ActiveDefense', `Regra ${rule.id} (${rule.name}) desativada manualmente pelo operador.`);
    } else {
      // Verifica e ativa pré-requisitos automaticamente
      if (rule.prerequisites) {
        for (const prereqId of rule.prerequisites) {
          if (!this.enforcedRuleIds.has(prereqId)) {
            this.enforcedRuleIds.add(prereqId);
            logger.info('ActiveDefense', `Pré-requisito ${prereqId} ativado automaticamente para suportar ${rule.id}.`);
          }
        }
      }
      // Remove incompatibilidades se estiverem ativas
      if (rule.incompatibilities) {
        for (const incompId of rule.incompatibilities) {
          if (this.enforcedRuleIds.has(incompId)) {
            this.enforcedRuleIds.delete(incompId);
            logger.warn('ActiveDefense', `Regra incompatível ${incompId} desativada para aplicar ${rule.id}.`);
          }
        }
      }

      this.enforcedRuleIds.add(ruleId);
      logger.security(
        'ActiveDefense',
        `Proteção ativada: ${rule.id} (${rule.name}) -> [${rule.enforcementDirective || 'netfilter active'}]`
      );
    }

    const rulesToEnforce = SECURITY_RULES_CATALOG.filter((r) => this.enforcedRuleIds.has(r.id));
    firewallManager.applyRules(rulesToEnforce);

    return this.getStatus();
  }

  /**
   * Aplica imediatamente um conjunto completo de regras (ex.: seleção do BGA ou do Guloso).
   */
  public applyRuleSet(ruleIds: string[], sourceLabel = 'BGA'): SystemStatus {
    this.enforcedRuleIds.clear();
    for (const id of ruleIds) {
      const exists = SECURITY_RULES_CATALOG.some((r) => r.id === id);
      if (exists) {
        this.enforcedRuleIds.add(id);
      }
    }

    const rulesToEnforce = SECURITY_RULES_CATALOG.filter((r) => this.enforcedRuleIds.has(r.id));
    if (rulesToEnforce.length > 0) {
      firewallManager.applyRules(rulesToEnforce);
    } else {
      firewallManager.purgeRules();
    }

    logger.security(
      'ActiveDefense',
      `[Passo C] Política de proteção [${sourceLabel}] aplicada no firewall: ${
        this.enforcedRuleIds.size > 0 ? Array.from(this.enforcedRuleIds).join(', ') : 'Nenhuma regra (Expurgado)'
      }`
    );
    return this.getStatus();
  }

  /**
   * Executa manualmente o Expurgo Autônomo (Rollback) removendo todas as regras do firewall.
   */
  public purgeRules(): SystemStatus {
    this.enforcedRuleIds.clear();
    firewallManager.purgeRules();
    logger.security(
      'IDSEngine',
      '[Expurgo Autônomo / Rollback]: Limpeza manual acionada. Todas as regras do Windows Defender Firewall foram removidas.'
    );
    return this.getStatus();
  }

  /**
   * Alterna o modo de aplicação automática de defesas (IPS Automático).
   */
  public setAutoProtect(enabled: boolean): SystemStatus {
    this.autoProtectEnabled = enabled;
    logger.security(
      'ActiveDefense',
      `Proteção Automática BGA (IPS) ${enabled ? 'ATIVADA' : 'PAUSADA (Controle Manual)'}.`
    );
    if (enabled && this.latestComparison.bgaResult.selectedRuleIds.length > 0) {
      this.applyRuleSet(this.latestComparison.bgaResult.selectedRuleIds, 'Auto-BGA');
    }
    return this.getStatus();
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
   * Injeção de métricas para validação automatizada da API.
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
      { maxCpuBudget: maxCpu ?? config.maxCpuBudget, maxFalsePositiveRate: maxFp },
      { seed }
    );
    this.lastAnalysisTimestamp = Date.now();

    if (this.autoProtectEnabled) {
      if (this.currentRiskScore > config.riskThreshold && this.latestComparison.bgaResult.selectedRuleIds.length > 0) {
        this.applyRuleSet(this.latestComparison.bgaResult.selectedRuleIds, 'Auto-BGA');
      } else if (this.currentRiskScore <= config.riskThreshold) {
        this.enforcedRuleIds.clear();
        firewallManager.purgeRules();
      }
    }

    logger.info(
      'IDSEngine',
      `Otimizador reavaliado: Vencedor [${this.latestComparison.winner}], Fitness BGA: ${this.latestComparison.bgaResult.fitnessScore}, Guloso: ${this.latestComparison.greedyResult.fitnessScore}`
    );
    return this.latestComparison;
  }

  private handlePacket(packet: RawPacketData): void {
    this.currentWindowPackets++;
    this.currentWindowBytes += packet.frameLen;

    const isDeauth = packet.wlanTypeSubtype === 10 || packet.wlanTypeSubtype === 12;
    const isSyn = Boolean(packet.tcpFlagsSyn);
    const isReset = Boolean(packet.tcpFlagsReset);

    if (isReset || isDeauth) {
      this.currentWindowAnomalies++;
    }

    // Contabiliza pacotes maliciosos bloqueados/mitigados pelas regras ativas
    if (this.enforcedRuleIds.size > 0) {
      const hasDeauthProtection = this.enforcedRuleIds.has('RL-03') || this.enforcedRuleIds.has('RL-04');
      const hasFloodProtection =
        this.enforcedRuleIds.has('RL-01') || this.enforcedRuleIds.has('RL-02') || this.enforcedRuleIds.has('RL-09');
      const hasScanProtection =
        this.enforcedRuleIds.has('RL-07') || this.enforcedRuleIds.has('RL-08') || this.enforcedRuleIds.has('RL-10');

      if ((isDeauth && hasDeauthProtection) || (isSyn && hasFloodProtection) || (isReset && hasScanProtection)) {
        this.mitigatedPacketsTotal++;
      }
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
    this.windowTimer.unref();
  }

  private onWindowTick(): void {
    const duration = this.samplingWindowSec;
    const trafficRate = Math.round((this.currentWindowPackets / duration) * 10) / 10;
    const anomalyRate = Math.round((this.currentWindowAnomalies / duration) * 10) / 10;

    let newMacsCount = 0;
    for (const mac of this.currentWindowMacs) {
      if (!this.knownMacCache.has(mac)) {
        newMacsCount++;
        this.knownMacCache.add(mac);
      }
    }

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

    // 1. Inferência Fuzzy de Risco (Passo A)
    const fuzzyResult = fuzzyEngine.evaluate({
      trafficRate: snapshot.trafficRate,
      anomalyRate: snapshot.anomalyRate,
      newMacs: snapshot.newMacs,
    });

    const previousScore = this.currentRiskScore;
    this.currentRiskScore = fuzzyResult.riskScore;
    this.currentRiskLevel = fuzzyResult.riskLevel;

    // 2. Passo A, B e 4: Avaliação do Limiar de Risco (40%) e Expurgo Autônomo
    const threshold = config.riskThreshold; // 40%
    const isSafe = this.currentRiskScore <= threshold;

    if (this.autoProtectEnabled) {
      if (isSafe) {
        // [Passo A & Passo 4]: Risco <= 40% -> Tráfego Seguro, NENHUMA REGRA APLICADA, EXPURGO AUTÔNOMO (Rollback)
        if (this.enforcedRuleIds.size > 0) {
          logger.security(
            'IDSEngine',
            `[4. Expurgo Autônomo / Rollback]: Score caiu para ${this.currentRiskScore}% (<= ${threshold}%). Restaurando tráfego normal e removendo regras no Firewall via PowerShell.`
          );
          this.enforcedRuleIds.clear();
          firewallManager.purgeRules();
        }
      } else {
        // [Passo B & Passo C]: Risco > 40% -> Aciona BGAOptimizer com limite de 40% de CPU
        if (Math.abs(previousScore - this.currentRiskScore) >= 3 || Date.now() - this.lastAnalysisTimestamp > 30000) {
          this.latestComparison = runOptimizationComparison(this.currentRiskScore, {
            maxCpuBudget: config.maxCpuBudget, // 40%
          });
          this.lastAnalysisTimestamp = Date.now();

          const bgaRuleIds = this.latestComparison.bgaResult.selectedRuleIds;
          this.enforcedRuleIds.clear();
          for (const id of bgaRuleIds) {
            this.enforcedRuleIds.add(id);
          }

          const rulesToEnforce = SECURITY_RULES_CATALOG.filter((r) => this.enforcedRuleIds.has(r.id));
          firewallManager.applyRules(rulesToEnforce);

          logger.security(
            'IDSEngine',
            `[Passo B & C]: Risco em ${this.currentRiskScore}% (> ${threshold}%). BGA selecionou ${bgaRuleIds.length} regras (CPU: ${this.latestComparison.bgaResult.totalCpuCostPercent}% <= ${config.maxCpuBudget}%). Executando no Firewall: ${bgaRuleIds.join(', ')}`
          );
        }
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
    firewallManager.purgeRules(false);
    logger.info('IDSEngine', 'Motor IDS finalizado e regras de firewall expurgadas com segurança.');
  }
}

export const idsEngine = new IDSEngine();
