import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { NetworkMetrics } from '../../types';

export class NetworkSniffer extends EventEmitter {
  private tsharkProcess: ChildProcess | null = null;
  private knownMacs: Set<string> = new Set();
  
  private packetCount: number = 0;
  private authFailures: number = 0;
  private newMacsThisWindow: number = 0;
  private intervalId: NodeJS.Timeout | null = null;

  public start(interfaceName?: string) {
    if (this.tsharkProcess) return;

    const args = ['-T', 'fields', '-e', 'eth.src', '-e', 'tcp.flags.reset', '-l'];
    if (interfaceName && interfaceName.trim() !== '') {
      args.unshift('-i', interfaceName);
    }

    try {
      this.tsharkProcess = spawn('tshark', args);

      this.tsharkProcess.stdout?.on('data', (data) => {
        this.processPacket(data.toString());
      });

      this.tsharkProcess.on('error', (err) => {
        this.emit('packetLog', `[ERRO] Falha no tshark: ${err.message}`);
        this.stop();
      });

      this.tsharkProcess.on('close', (code) => {
        this.emit('packetLog', `[TShark] Captura encerrada (Código ${code})`);
        this.stop();
      });

      this.intervalId = setInterval(() => {
        const metrics: NetworkMetrics = {
          connectionRate: Math.floor(this.packetCount / 3),
          authFailures: this.authFailures,
          newMacCount: this.newMacsThisWindow
        };

        this.emit('metrics', metrics);

        this.packetCount = 0;
        this.authFailures = 0;
        this.newMacsThisWindow = 0;
      }, 3000);

      this.emit('packetLog', `[SISTEMA] Captura TShark iniciada com sucesso.`);

    } catch (error) {
      this.emit('packetLog', `[ERRO] Falha ao invocar tshark.`);
    }
  }

  private processPacket(output: string) {
    const lines = output.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      
      this.packetCount++;
      const [mac, tcpReset] = line.trim().split('\t');
      
      if (mac && mac !== '') {
        if (!this.knownMacs.has(mac)) {
          this.knownMacs.add(mac);
          this.newMacsThisWindow++;
          this.emit('packetLog', `[TShark] 🚨 NOVO MAC DETECTADO na rede: ${mac}`);
        }
      }

      if (tcpReset === '1') {
        this.authFailures++;
        this.emit('packetLog', `[TShark] ⚠️ ALERTA: Conexão Recusada (TCP Reset) do MAC ${mac || 'Desconhecido'}`);
      } else if (this.packetCount % 50 === 0) {
        // Amostragem para não floodar o dashboard
        const time = new Date().toLocaleTimeString();
        this.emit('packetLog', `[TShark - ${time}] Pacote normal capturado do MAC ${mac || 'N/A'}`);
      }
    }
  }

  public stop() {
    if (this.tsharkProcess) {
      this.tsharkProcess.kill();
      this.tsharkProcess = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.emit('packetLog', `[SISTEMA] Captura real interrompida.`);
  }
}