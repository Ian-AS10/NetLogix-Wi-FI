/**
 * @file simulatedTrafficService.ts
 * Gerador de telemetria e tráfego de rede sintético para testes sem TShark.
 */

import { RawPacketData, ThreatScenario } from '../domain/metrics.js';
import { PRNG } from '../utils/prng.js';
import { logger } from '../utils/logger.js';

export class SimulatedTrafficService {
  private timer: NodeJS.Timeout | null = null;
  private scenario: ThreatScenario = 'normal';
  private prng: PRNG;
  private onPacketCallback: ((packet: RawPacketData) => void) | null = null;
  private isRunning = false;

  constructor() {
    this.prng = new PRNG(1337);
  }

  public setOnPacket(callback: (packet: RawPacketData) => void): void {
    this.onPacketCallback = callback;
  }

  public isSimulating(): boolean {
    return this.isRunning;
  }

  public getScenario(): ThreatScenario {
    return this.scenario;
  }

  public start(scenario: ThreatScenario = 'normal'): void {
    this.scenario = scenario;
    if (this.isRunning) {
      logger.info('SimulatedTraffic', `Cenário de simulação alterado para: ${scenario.toUpperCase()}`);
      return;
    }

    this.isRunning = true;
    logger.info('SimulatedTraffic', `Simulação de tráfego iniciada no cenário: ${scenario.toUpperCase()}`);

    // Emite rajadas de pacotes sintéticos a cada 1000ms
    this.timer = setInterval(() => {
      this.generateTick();
    }, 1000);
  }

  public setScenario(scenario: ThreatScenario): void {
    this.scenario = scenario;
    logger.info('SimulatedTraffic', `Alternado cenário de simulação para: ${scenario.toUpperCase()}`);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    logger.info('SimulatedTraffic', 'Simulação de tráfego finalizada.');
  }

  private generateTick(): void {
    if (!this.onPacketCallback) return;

    let targetPps = 100;
    let anomalyRatio = 0.01;
    let newMacsProb = 0.1;

    switch (this.scenario) {
      case 'normal':
        targetPps = this.prng.nextInt(90, 160);
        anomalyRatio = 0.01; // ~1 eps
        newMacsProb = 0.1;
        break;
      case 'syn_flood':
        targetPps = this.prng.nextInt(1800, 2600);
        anomalyRatio = 0.01; // ~20 eps
        newMacsProb = 0.15;
        break;
      case 'deauth_burst':
        targetPps = this.prng.nextInt(220, 380);
        anomalyRatio = 0.28; // ~80 eps de deauth
        newMacsProb = 0.2;
        break;
      case 'mac_spoofing':
        targetPps = this.prng.nextInt(320, 550);
        anomalyRatio = 0.08; // ~30 eps
        newMacsProb = 0.85; // Alta incidência de MACs trocados
        break;
    }

    // Geramos uma representação condensada de pacotes para o IDS Engine
    const packetCount = Math.max(1, Math.round(targetPps / 2));
    const now = Date.now();

    for (let i = 0; i < packetCount; i++) {
      const isAnomaly = this.prng.chance(anomalyRatio);
      const isNewMac = this.prng.chance(newMacsProb);

      let wlanSubtype: number | undefined;
      let tcpReset = false;

      if (isAnomaly) {
        if (this.scenario === 'deauth_burst') {
          wlanSubtype = 12; // 802.11 Deauth
        } else {
          tcpReset = true;  // TCP RST
        }
      }

      let mac = 'e4:5f:01:22:33:44';
      if (isNewMac) {
        mac = `02:${this.hexByte()}:${this.hexByte()}:${this.hexByte()}:${this.hexByte()}:${this.hexByte()}`;
      }

      const packet: RawPacketData = {
        timestamp: now,
        frameLen: this.prng.nextInt(64, 1518),
        ipSrc: `192.168.1.${this.prng.nextInt(10, 250)}`,
        ipDst: '192.168.1.1',
        tcpFlagsReset: tcpReset,
        tcpFlagsSyn: this.scenario === 'syn_flood' && this.prng.chance(0.85),
        wlanTypeSubtype: wlanSubtype,
        ethSrc: mac,
        wlanSa: mac,
      };

      this.onPacketCallback(packet);
    }
  }

  private hexByte(): string {
    return this.prng.nextInt(16, 255).toString(16).padStart(2, '0');
  }
}

export const simulatedTrafficService = new SimulatedTrafficService();
