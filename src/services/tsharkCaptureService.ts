/**
 * @file tsharkCaptureService.ts
 * Gerenciamento multiplataforma (Windows, Linux e macOS) do processo de captura TShark via child_process.spawn nativo.
 */

import { spawn, ChildProcess, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { CaptureStatus, RawPacketData } from '../domain/metrics.js';
import { TSharkOutputParser } from './tsharkParser.js';
import { logger } from '../utils/logger.js';
import { ValidationError, ConflictError } from '../utils/errors.js';

export interface NetworkInterfaceInfo {
  name: string;
  label?: string;
  address?: string;
  isUp: boolean;
}

export class TSharkCaptureService {
  private process: ChildProcess | null = null;
  private parser: TSharkOutputParser;
  private status: CaptureStatus = 'stopped';
  private selectedInterface = '';
  private onPacketCallback: ((packet: RawPacketData) => void) | null = null;
  private resolvedBinaryPath: string | null = null;
  private customBinaryPath: string | null = null;

  constructor() {
    this.parser = new TSharkOutputParser();
  }

  /**
   * Permite definir manualmente o caminho do executável tshark (ex.: C:\Program Files\Wireshark\tshark.exe).
   */
  public setCustomBinaryPath(customPath: string): boolean {
    const cleaned = customPath.replace(/^["']|["']$/g, '').trim();
    if (!cleaned) {
      this.customBinaryPath = null;
      this.resolvedBinaryPath = null;
      return this.isTSharkInstalled(true);
    }
    this.customBinaryPath = cleaned;
    this.resolvedBinaryPath = null;
    return this.isTSharkInstalled(true);
  }

  /**
   * Registra o listener de pacotes capturados.
   */
  public setOnPacket(callback: (packet: RawPacketData) => void): void {
    this.onPacketCallback = callback;
  }

  public getStatus(): CaptureStatus {
    return this.status;
  }

  public getSelectedInterface(): string {
    return this.selectedInterface;
  }

  public getResolvedBinaryPath(): string | null {
    if (!this.resolvedBinaryPath) {
      this.resolveTSharkBinary();
    }
    return this.resolvedBinaryPath;
  }

  /**
   * Localiza o executável do TShark no Windows, Linux ou macOS.
   * No Windows, verifica caminho customizado, variável TSHARK_PATH, PATH do sistema (where.exe) e diretórios padrão do Wireshark.
   */
  private resolveTSharkBinary(): string | null {
    const candidates: string[] = [];

    // 0. Caminho customizado informado via interface ou configuração
    if (this.customBinaryPath) {
      if (
        this.customBinaryPath.toLowerCase().endsWith('tshark.exe') ||
        this.customBinaryPath.toLowerCase().endsWith('tshark')
      ) {
        candidates.push(this.customBinaryPath);
      } else {
        candidates.push(path.join(this.customBinaryPath, process.platform === 'win32' ? 'tshark.exe' : 'tshark'));
      }
    }

    // 1. Variável de ambiente explícita TSHARK_PATH (arquivo ou diretório)
    if (process.env.TSHARK_PATH) {
      const envPath = process.env.TSHARK_PATH.replace(/^["']|["']$/g, '').trim();
      if (envPath) {
        if (envPath.toLowerCase().endsWith('tshark.exe') || envPath.toLowerCase().endsWith('tshark')) {
          candidates.push(envPath);
        } else {
          candidates.push(path.join(envPath, process.platform === 'win32' ? 'tshark.exe' : 'tshark'));
        }
      }
    }

    const isWin = process.platform === 'win32';

    // 2. No Windows, consulta 'where.exe tshark' e diretórios padrão do instalador Wireshark
    if (isWin) {
      try {
        const whereCheck = spawnSync('where.exe', ['tshark'], {
          encoding: 'utf8',
          timeout: 3000,
          windowsHide: true,
        });
        if (whereCheck.status === 0 && whereCheck.stdout) {
          const firstMatch = whereCheck.stdout
            .split(/\r?\n/)
            .map((l) => l.trim())
            .find((l) => l.length > 0);
          if (firstMatch) candidates.push(firstMatch);
        }
      } catch {
        // Prossegue para verificação direta dos diretórios padrão
      }

      candidates.push('tshark.exe', 'tshark');

      const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
      const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
      const localAppData = process.env.LOCALAPPDATA || '';
      const systemDrive = process.env.SystemDrive || 'C:';

      const winKnownPaths = [
        path.join(programFiles, 'Wireshark', 'tshark.exe'),
        path.join(programFilesX86, 'Wireshark', 'tshark.exe'),
        'C:\\Program Files\\Wireshark\\tshark.exe',
        'C:\\Program Files (x86)\\Wireshark\\tshark.exe',
        `${systemDrive}\\Program Files\\Wireshark\\tshark.exe`,
        `${systemDrive}\\Wireshark\\tshark.exe`,
        'D:\\Program Files\\Wireshark\\tshark.exe',
        'D:\\Wireshark\\tshark.exe',
      ];
      if (localAppData) {
        winKnownPaths.push(path.join(localAppData, 'Programs', 'Wireshark', 'tshark.exe'));
      }

      for (const p of winKnownPaths) {
        if (!candidates.includes(p)) {
          candidates.push(p);
        }
      }
    } else {
      // 3. Linux e macOS
      candidates.push(
        'tshark',
        '/usr/bin/tshark',
        '/usr/local/bin/tshark',
        '/opt/homebrew/bin/tshark',
        '/Applications/Wireshark.app/Contents/MacOS/tshark'
      );
    }

    for (const candidate of candidates) {
      try {
        // Se for caminho absoluto, verifica existência no disco primeiro para evitar spawn desnecessário
        if (path.isAbsolute(candidate) && !fs.existsSync(candidate)) {
          continue;
        }
        const check = spawnSync(candidate, ['-v'], {
          encoding: 'utf8',
          timeout: 4000,
          windowsHide: true,
        });
        if (check.status === 0) {
          this.resolvedBinaryPath = candidate;
          return candidate;
        }
      } catch {
        // Tenta próximo candidato
      }
    }

    this.resolvedBinaryPath = null;
    return null;
  }

  /**
   * Verifica se o binário tshark está instalado no sistema operacional do host (Windows/Linux/macOS).
   */
  public isTSharkInstalled(forceRefresh = false): boolean {
    if (this.resolvedBinaryPath && !forceRefresh) {
      return true;
    }
    const resolved = this.resolveTSharkBinary();
    return resolved !== null;
  }

  /**
   * Lista interfaces de rede disponíveis no host combinando `tshark -D` (Npcap no Windows) com `os.networkInterfaces()`.
   */
  public getAvailableInterfaces(): NetworkInterfaceInfo[] {
    const osIfaces = os.networkInterfaces();
    const osMap = new Map<string, { name: string; address?: string; isUp: boolean }>();

    for (const [name, infos] of Object.entries(osIfaces)) {
      if (!infos) continue;
      const ipv4 = infos.find((i) => i.family === 'IPv4');
      osMap.set(name.toLowerCase(), {
        name,
        address: ipv4?.address,
        isUp: !infos[0]?.internal,
      });
    }

    const binary = this.getResolvedBinaryPath();
    if (binary) {
      try {
        const dump = spawnSync(binary, ['-D'], {
          encoding: 'utf8',
          timeout: 4000,
          windowsHide: true,
        });
        if (dump.status === 0 && dump.stdout) {
          const parsedInterfaces: NetworkInterfaceInfo[] = [];
          const lines = dump.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

          for (const line of lines) {
            // Formato típico tshark -D: "1. \Device\NPF_{GUID} (Wi-Fi)" ou "1. eth0"
            const match = line.match(/^(\d+)\.\s+([^\s(]+)(?:\s+\((.+)\))?$/);
            if (!match) continue;

            const deviceId = match[2].trim();
            const friendlyName = match[3]?.trim();

            // Ignora interfaces virtuais de captura USB/etw/randpkt/sshdump que não são de rede
            const lowerDev = deviceId.toLowerCase();
            if (
              lowerDev.includes('etw') ||
              lowerDev.includes('randpkt') ||
              lowerDev.includes('sshdump') ||
              lowerDev.includes('ciscodump') ||
              lowerDev.includes('udpdump') ||
              lowerDev.includes('wifidump')
            ) {
              continue;
            }

            const matchedOs =
              (friendlyName && osMap.get(friendlyName.toLowerCase())) ||
              osMap.get(deviceId.toLowerCase());

            const displayName = friendlyName || matchedOs?.name || deviceId;
            parsedInterfaces.push({
              // No Windows Npcap, tanto o friendlyName quanto o deviceId funcionam, mas se o friendlyName
              // estiver presente no osMap, exibimos de forma limpa e o resolvedor traduz para o Npcap ID ao capturar
              name: friendlyName || deviceId,
              label: displayName,
              address: matchedOs?.address,
              isUp: matchedOs ? matchedOs.isUp : !lowerDev.includes('loopback'),
            });
          }

          if (parsedInterfaces.length > 0) {
            return parsedInterfaces;
          }
        }
      } catch {
        // Fallback automático para os.networkInterfaces() abaixo
      }
    }

    const fallbackInterfaces: NetworkInterfaceInfo[] = [];
    for (const item of osMap.values()) {
      fallbackInterfaces.push({
        name: item.name,
        label: item.name,
        address: item.address,
        isUp: item.isUp,
      });
    }

    // Ordena interfaces ativas (não-loopback com IPv4) primeiro
    fallbackInterfaces.sort((a, b) => Number(b.isUp) - Number(a.isUp));
    return fallbackInterfaces;
  }

  /**
   * No Windows (Npcap), se o usuário selecionar o nome amigável da interface (ex.: "Ethernet" ou "Wi-Fi"),
   * mapeia para o identificador exato do `tshark -D` caso necessário.
   */
  private resolveCaptureInterfaceTarget(requestedInterface: string, binaryPath: string): string {
    if (process.platform !== 'win32') {
      return requestedInterface;
    }

    try {
      const dump = spawnSync(binaryPath, ['-D'], {
        encoding: 'utf8',
        timeout: 3500,
        windowsHide: true,
      });
      if (dump.status === 0 && dump.stdout) {
        const lines = dump.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const targetLower = requestedInterface.toLowerCase();

        for (const line of lines) {
          const match = line.match(/^(\d+)\.\s+([^\s(]+)(?:\s+\((.+)\))?$/);
          if (!match) continue;
          const indexNum = match[1];
          const deviceId = match[2].trim();
          const friendlyName = match[3]?.trim();

          if (
            deviceId.toLowerCase() === targetLower ||
            (friendlyName && friendlyName.toLowerCase() === targetLower) ||
            indexNum === requestedInterface
          ) {
            // O identificador NPF (\Device\NPF_{...}) é aceito de forma universal pelo TShark no Windows
            return deviceId;
          }
        }
      }
    } catch {
      // Mantém o nome original caso tshark -D falhe
    }

    return requestedInterface;
  }

  /**
   * Inicia a captura TShark em modo passivo sobre a interface especificada.
   */
  public startCapture(networkInterface: string): void {
    if (this.status === 'active' || this.status === 'starting') {
      throw new ConflictError('A captura de tráfego já está em execução.');
    }

    // Validação contra caracteres de controle e metacaracteres de shell,
    // permitindo nomes de interfaces Windows ("Wi-Fi", "Ethernet 2", "Conexão Local", "\Device\NPF_{GUID}") e Linux ("wlan0")
    const sanitizedInterface = networkInterface.trim();
    if (
      !sanitizedInterface ||
      sanitizedInterface.length > 120 ||
      /[;&|$`<>!\r\n\0]/.test(sanitizedInterface)
    ) {
      throw new ValidationError(
        `Nome de interface de rede inválido: "${sanitizedInterface}".`
      );
    }

    if (!this.isTSharkInstalled(true) || !this.resolvedBinaryPath) {
      this.status = 'error';
      const hint =
        process.platform === 'win32'
          ? 'Verifique se o Wireshark (com TShark e Npcap) está instalado em C:\\Program Files\\Wireshark\\tshark.exe ou defina TSHARK_PATH no .env.'
          : 'Instale via: sudo apt-get install -y tshark (ou use o Modo Simulado).';
      const msg = `Binário "tshark" não encontrado no sistema operacional. ${hint}`;
      logger.error('TSharkCapture', msg);
      throw new ValidationError(msg);
    }

    const binaryPath = this.resolvedBinaryPath;
    const resolvedInterfaceTarget = this.resolveCaptureInterfaceTarget(sanitizedInterface, binaryPath);

    this.status = 'starting';
    this.selectedInterface = sanitizedInterface;
    this.parser.clear();

    logger.info(
      'TSharkCapture',
      `Iniciando captura passiva na interface "${sanitizedInterface}" (${resolvedInterfaceTarget}) usando [${binaryPath}]...`
    );

    // Argumentos do TShark em array estruturado, sem concatenação de shell
    const args = [
      '-i', resolvedInterfaceTarget,
      '-l',                         // Flush de saída linha a linha imediatamente
      '-n',                         // Não resolver nomes DNS para evitar latência
      '-T', 'fields',
      '-e', 'frame.time_epoch',
      '-e', 'frame.len',
      '-e', 'ip.src',
      '-e', 'ip.dst',
      '-e', 'tcp.flags.reset',
      '-e', 'tcp.flags.syn',
      '-e', 'wlan.fc.type_subtype',
      '-e', 'wlan.sa',
      '-e', 'eth.src',
    ];

    try {
      this.process = spawn(binaryPath, args, {
        shell: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.status = 'active';
      logger.info('TSharkCapture', `Processo TShark iniciado com sucesso (PID: ${this.process.pid}).`);

      this.process.stdout?.on('data', (chunk: Buffer) => {
        const packets = this.parser.pushChunk(chunk);
        if (this.onPacketCallback && packets.length > 0) {
          for (const packet of packets) {
            this.onPacketCallback(packet);
          }
        }
      });

      this.process.stderr?.on('data', (errChunk: Buffer) => {
        const text = errChunk.toString('utf8').trim();
        if (!text) return;
        // Filtra mensagens informativas normais de inicialização do TShark
        if (text.includes('Capturing on') || text.includes('Packets captured')) {
          logger.info('TSharkProcess', text);
        } else {
          logger.warn('TSharkProcess', `Aviso TShark: ${text}`);
        }
      });

      this.process.on('error', (err: Error) => {
        this.status = 'error';
        logger.error('TSharkCapture', `Falha ao iniciar processo TShark: ${err.message}`);
        this.cleanupProcess();
      });

      this.process.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
        logger.info('TSharkCapture', `Processo TShark encerrado (Código: ${code}, Sinal: ${signal}).`);
        this.status = 'stopped';
        this.cleanupProcess();
      });
    } catch (err: unknown) {
      this.status = 'error';
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('TSharkCapture', `Exceção na inicialização da captura: ${msg}`);
      this.cleanupProcess();
      throw new ValidationError(`Falha ao iniciar TShark: ${msg}`);
    }
  }

  /**
   * Encerra a captura de forma graciosa em Windows, Linux e macOS sem deixar processos órfãos.
   */
  public stopCapture(): void {
    if (!this.process || this.status === 'stopped') {
      this.status = 'stopped';
      return;
    }

    const pid = this.process.pid;
    logger.info('TSharkCapture', `Solicitando encerramento do processo TShark (PID: ${pid})...`);
    this.status = 'stopped';

    try {
      if (process.platform === 'win32' && pid) {
        // No Windows, encerra a árvore do processo tshark.exe + dumpcap.exe de forma limpa
        spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
          windowsHide: true,
          stdio: 'ignore',
        });
      } else {
        this.process.kill('SIGTERM');

        const proc = this.process;
        setTimeout(() => {
          if (proc && !proc.killed) {
            logger.warn('TSharkCapture', 'TShark não finalizou em 2s; forçando SIGKILL.');
            try {
              proc.kill('SIGKILL');
            } catch {
              // Ignora erro se já finalizado
            }
          }
        }, 2000);
      }
    } catch (err: unknown) {
      logger.warn('TSharkCapture', `Aviso ao encerrar TShark: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.cleanupProcess();
    }
  }

  private cleanupProcess(): void {
    this.process = null;
    this.parser.clear();
  }
}

export const tsharkCaptureService = new TSharkCaptureService();
