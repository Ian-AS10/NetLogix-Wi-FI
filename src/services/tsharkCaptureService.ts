/**
 * @file tsharkCaptureService.ts
 * Gerenciamento do processo de captura TShark via child_process.spawn nativo.
 */

import { spawn, ChildProcess, spawnSync } from 'child_process';
import os from 'os';
import { CaptureStatus, RawPacketData } from '../domain/metrics.js';
import { TSharkOutputParser } from './tsharkParser.js';
import { logger } from '../utils/logger.js';
import { ValidationError, ConflictError } from '../utils/errors.js';

export class TSharkCaptureService {
  private process: ChildProcess | null = null;
  private parser: TSharkOutputParser;
  private status: CaptureStatus = 'stopped';
  private selectedInterface = '';
  private onPacketCallback: ((packet: RawPacketData) => void) | null = null;
  private isTsharkInstalledCache: boolean | null = null;

  constructor() {
    this.parser = new TSharkOutputParser();
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

  /**
   * Verifica se o binário tshark está instalado no sistema operacional do host.
   */
  public isTSharkInstalled(): boolean {
    if (this.isTsharkInstalledCache !== null) {
      return this.isTsharkInstalledCache;
    }
    try {
      const check = spawnSync('which', ['tshark'], { encoding: 'utf8' });
      this.isTsharkInstalledCache = check.status === 0;
    } catch {
      this.isTsharkInstalledCache = false;
    }
    return this.isTsharkInstalledCache;
  }

  /**
   * Lista interfaces de rede disponíveis no host com fallback seguro para os.networkInterfaces().
   */
  public getAvailableInterfaces(): Array<{ name: string; address?: string; isUp: boolean }> {
    const interfaces: Array<{ name: string; address?: string; isUp: boolean }> = [];
    const osIfaces = os.networkInterfaces();

    for (const [name, infos] of Object.entries(osIfaces)) {
      if (!infos) continue;
      const ipv4 = infos.find((i) => i.family === 'IPv4');
      interfaces.push({
        name,
        address: ipv4?.address,
        isUp: !infos[0]?.internal,
      });
    }

    return interfaces;
  }

  /**
   * Inicia a captura TShark em modo passivo sobre a interface especificada.
   */
  public startCapture(networkInterface: string): void {
    if (this.status === 'active' || this.status === 'starting') {
      throw new ConflictError('A captura de tráfego já está em execução.');
    }

    // Validação estrita contra Command Injection e caracteres maliciosos
    const sanitizedInterface = networkInterface.trim();
    if (!/^[a-zA-Z0-9_.-]{1,32}$/.test(sanitizedInterface)) {
      throw new ValidationError(
        `Nome de interface de rede inválido: "${sanitizedInterface}". Use apenas letras, números, ponto, hífen e sublinhado (máx. 32 caracteres).`
      );
    }

    if (!this.isTSharkInstalled()) {
      this.status = 'error';
      const msg = 'Binário "tshark" não encontrado no sistema operacional. Instale via: sudo apt-get install -y tshark (ou use o Modo Simulado).';
      logger.error('TSharkCapture', msg);
      throw new ValidationError(msg);
    }

    this.status = 'starting';
    this.selectedInterface = sanitizedInterface;
    this.parser.clear();

    logger.info('TSharkCapture', `Iniciando captura passiva na interface ${sanitizedInterface}...`);

    // Argumentos do TShark em array estruturado, sem concatenação de shell
    const args = [
      '-i', sanitizedInterface,
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
      this.process = spawn('tshark', args, {
        shell: false,
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
        // Filtra ruídos normais de inicialização do TShark (ex.: "Capturing on ...")
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
   * Encerra a captura de forma graciosa sem deixar processos órfãos.
   */
  public stopCapture(): void {
    if (!this.process || this.status === 'stopped') {
      this.status = 'stopped';
      return;
    }

    logger.info('TSharkCapture', `Solicitando encerramento do processo TShark (PID: ${this.process.pid})...`);
    this.status = 'stopped';

    try {
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
