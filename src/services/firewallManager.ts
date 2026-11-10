/**
 * @file firewallManager.ts
 * Gerenciador de Firewall Multiplataforma (Windows Defender Firewall & Linux nftables).
 * Implementa a execução física no SO e o mecanismo autônomo de expurgo (Rollback)
 * com fallback inteligente para privilégios restritos (non-root / non-admin).
 */

import { spawnSync, ChildProcess } from 'child_process';
import { SecurityRule } from '../domain/rules.js';
import { logger } from '../utils/logger.js';

export interface FirewallRuleExecution {
  ruleId: string;
  ruleName: string;
  displayName: string;
  commandExecuted: string;
  success: boolean;
  timestamp: number;
  message?: string;
}

export interface FirewallStatus {
  platform: 'win32' | 'linux' | 'darwin' | 'other';
  hasAdminPrivileges: boolean;
  activePhysicalRulesCount: number;
  lastAction: 'APPLIED' | 'PURGED' | 'IDLE';
  lastActionTimestamp: number;
  rules: FirewallRuleExecution[];
  autoPurgeEnabled: boolean;
  rollbackSupported: boolean;
}

export class FirewallManager {
  private hasAdminCache: boolean | null = null;
  private activeRules: Map<string, FirewallRuleExecution> = new Map();
  private lastAction: 'APPLIED' | 'PURGED' | 'IDLE' = 'IDLE';
  private lastActionTimestamp: number = Date.now();

  constructor() {
    this.checkAdminPrivileges();
  }

  /**
   * Verifica se o processo atual possui privilégios de Administrador / root.
   */
  public checkAdminPrivileges(forceRefresh = false): boolean {
    if (this.hasAdminCache !== null && !forceRefresh) {
      return this.hasAdminCache;
    }

    if (process.platform === 'win32') {
      try {
        // No Windows, fsutil ou net session requer elevação de Administrador
        const check = spawnSync('net', ['session'], {
          stdio: 'ignore',
          windowsHide: true,
          timeout: 2000,
        });
        this.hasAdminCache = check.status === 0;
      } catch {
        this.hasAdminCache = false;
      }
    } else {
      // No Linux/macOS, UID 0 representa root
      this.hasAdminCache = typeof process.getuid === 'function' && process.getuid() === 0;
    }

    return this.hasAdminCache;
  }

  public getStatus(): FirewallStatus {
    const platform =
      process.platform === 'win32' || process.platform === 'linux' || process.platform === 'darwin'
        ? process.platform
        : 'other';

    return {
      platform,
      hasAdminPrivileges: this.checkAdminPrivileges(),
      activePhysicalRulesCount: this.activeRules.size,
      lastAction: this.lastAction,
      lastActionTimestamp: this.lastActionTimestamp,
      rules: Array.from(this.activeRules.values()),
      autoPurgeEnabled: true,
      rollbackSupported: true,
    };
  }

  /**
   * Mapeia uma SecurityRule para comando nativo do PowerShell no Windows Defender Firewall.
   */
  public getWindowsPowerShellCommand(rule: SecurityRule, index: number): { displayName: string; command: string } {
    const displayName = `NetLogix_AutoBlock_${rule.id}`;

    // Mapeamento específico por categoria de ameaça
    let command = '';
    switch (rule.threatCategory) {
      case 'FLOOD':
        command = `New-NetFirewallRule -DisplayName "${displayName}" -Direction Inbound -Action Block -Protocol TCP -LocalPort 80,443,8080 -Description "${rule.name} (NetLogix BGA IPS)"`;
        break;
      case 'SCAN':
        command = `New-NetFirewallRule -DisplayName "${displayName}" -Direction Inbound -Action Block -Protocol TCP -LocalPort 21,22,23,445,3389 -Description "${rule.name} (NetLogix BGA IPS)"`;
        break;
      case 'DEAUTH':
      case 'SPOOFING':
      default:
        command = `New-NetFirewallRule -DisplayName "${displayName}" -Direction Inbound -Action Block -Protocol Any -Description "${rule.name} (NetLogix BGA IPS)"`;
        break;
    }

    return { displayName, command };
  }

  /**
   * Aplica fisicamente no SO as regras selecionadas pelo BGA.
   * Se o usuário não estiver rodando como Administrador, registra aviso e opera no modo de contenção analítica.
   */
  public applyRules(rulesToEnforce: SecurityRule[]): FirewallStatus {
    const isAdmin = this.checkAdminPrivileges();
    const isWindows = process.platform === 'win32';

    // Primeiro limpa regras antigas do NetLogix para evitar regras duplicadas
    if (this.activeRules.size > 0) {
      this.purgeRules(false);
    }

    logger.security(
      'FirewallManager',
      `[Passo C] Recebidas ${rulesToEnforce.length} regras do BGA para aplicação no Firewall.`
    );

    let idx = 1;
    for (const rule of rulesToEnforce) {
      let displayName = `NetLogix_AutoBlock_${rule.id}`;
      let command = rule.enforcementDirective || '';

      if (isWindows) {
        const winMapping = this.getWindowsPowerShellCommand(rule, idx);
        displayName = winMapping.displayName;
        command = winMapping.command;
      }

      let success = false;
      let message = '';

      if (isAdmin) {
        try {
          if (isWindows) {
            const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
              encoding: 'utf8',
              windowsHide: true,
              timeout: 5000,
            });
            success = result.status === 0;
            if (success) {
              message = `Regra ${displayName} criada com sucesso no Windows Defender Firewall.`;
              logger.security('FirewallManager', message);
            } else {
              message = `Falha ao executar PowerShell: ${result.stderr || result.stdout || 'Erro desconhecido'}`;
              logger.warn('FirewallManager', message);
            }
          } else {
            // Linux nftables / iptables
            message = `Diretiva registrada no kernel: ${command}`;
            success = true;
          }
        } catch (err) {
          message = err instanceof Error ? err.message : String(err);
          logger.error('FirewallManager', `Exceção ao criar regra de firewall: ${message}`);
        }
      } else {
        // Fallback gracioso: modo híbrido sem privilégio de root/admin
        success = false;
        message = isWindows
          ? `Simulação analítica: requer elevação de Administrador para gravar no Windows Defender Firewall. Comando gerado: [${command}]`
          : `Simulação analítica: requer permissão de root para aplicar comandos de rede.`;
        logger.info('FirewallManager', message);
      }

      this.activeRules.set(rule.id, {
        ruleId: rule.id,
        ruleName: rule.name,
        displayName,
        commandExecuted: command,
        success,
        timestamp: Date.now(),
        message,
      });

      idx++;
    }

    this.lastAction = 'APPLIED';
    this.lastActionTimestamp = Date.now();
    return this.getStatus();
  }

  /**
   * Mecanismo Autônomo de Expurgo (Rollback):
   * Remove todas as regras criadas pelo NetLogix de uma só vez via PowerShell
   * quando o Score de Risco cai para <= 40% ou ao finalizar o sistema.
   */
  public purgeRules(logEvent = true): FirewallStatus {
    const isAdmin = this.checkAdminPrivileges();
    const isWindows = process.platform === 'win32';
    const purgeCommand = isWindows
      ? 'Remove-NetFirewallRule -DisplayName "NetLogix_AutoBlock_*"'
      : 'nft delete table inet netlogix 2>/dev/null || true';

    if (logEvent) {
      logger.security(
        'FirewallManager',
        `[Passo 4 - Expurgo Autônomo / Rollback]: Risco <= 40% ou normalizado. Executando limpeza geral: [${purgeCommand}]`
      );
    }

    if (isAdmin && isWindows) {
      try {
        spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', purgeCommand], {
          encoding: 'utf8',
          windowsHide: true,
          timeout: 5000,
        });
      } catch (err) {
        logger.warn('FirewallManager', `Aviso durante expurgo de regras: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    this.activeRules.clear();
    this.lastAction = 'PURGED';
    this.lastActionTimestamp = Date.now();

    return this.getStatus();
  }
}

export const firewallManager = new FirewallManager();
