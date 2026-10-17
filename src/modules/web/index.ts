import express from 'express';
import path from 'path';
import { DefenseManager } from '../core';
import { NetworkSniffer } from '../security/sniffer';

export function startDashboard(manager: DefenseManager, port: number = 3000) {
  const app = express();
  
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  let mockInterval: NodeJS.Timeout | null = null;
  const sniffer = new NetworkSniffer();
  
  // Buffer circular para logs de pacotes
  const logsBuffer: string[] = [];
  function addLog(msg: string) {
      logsBuffer.push(msg);
      if (logsBuffer.length > 50) logsBuffer.shift(); // Mantém apenas os últimos 50 logs
  }

  sniffer.on('metrics', (metrics) => {
    manager.evaluateNetwork(metrics, { maxCpuLimit: 40, maxFalsePositiveRate: 0.15 });
  });
  
  sniffer.on('packetLog', (msg) => {
    addLog(msg);
  });

  app.get('/api/status', (req, res) => {
    res.json({
        ...manager.getStatus(),
        logs: logsBuffer
    });
  });

  app.post('/api/simulate', (req, res) => {
    const metrics = req.body;
    addLog(`[MOCK MANUAL] Injeção Recebida: ${metrics.connectionRate} req/s | ${metrics.authFailures} Falhas | ${metrics.newMacCount} MACs`);
    manager.evaluateNetwork(metrics, { maxCpuLimit: 40, maxFalsePositiveRate: 0.15 });
    res.json({ message: 'Tráfego simulado processado.', status: manager.getStatus() });
  });

  // Toggle do tráfego automático (Mock)
  app.post('/api/traffic/auto', (req, res) => {
    const { enabled } = req.body;
    if (enabled) {
      sniffer.stop(); 
      if (!mockInterval) {
        addLog(`[SISTEMA] Gerador Automático de Tráfego INICIADO.`);
        mockInterval = setInterval(() => {
          // Correção do Bug: Gerar picos aleatórios para fazer o gráfico subir!
          const isSpike = Math.random() > 0.8; // 20% de chance de gerar um ataque
          const mockMetrics = {
            connectionRate: isSpike ? Math.floor(Math.random() * 120 + 50) : Math.floor(Math.random() * 20),
            authFailures: isSpike ? Math.floor(Math.random() * 15 + 5) : 0,
            newMacCount: isSpike ? Math.floor(Math.random() * 8 + 2) : 0
          };
          
          if (isSpike) {
              addLog(`[MOCK] Pico de tráfego gerado! Conn: ${mockMetrics.connectionRate}/s, Falhas: ${mockMetrics.authFailures}, MACs: ${mockMetrics.newMacCount}`);
          }
          
          manager.evaluateNetwork(mockMetrics, { maxCpuLimit: 40, maxFalsePositiveRate: 0.15 });
        }, 3000);
      }
    } else if (!enabled && mockInterval) {
      clearInterval(mockInterval);
      mockInterval = null;
      addLog(`[SISTEMA] Gerador Automático de Tráfego DESLIGADO.`);
    }
    res.json({ success: true, enabled });
  });

  app.post('/api/traffic/real', (req, res) => {
    const { enabled, interfaceName } = req.body;
    if (enabled) {
      if (mockInterval) { clearInterval(mockInterval); mockInterval = null; }
      sniffer.start(interfaceName);
    } else {
      sniffer.stop();
    }
    res.json({ success: true, enabled });
  });

  app.listen(port, () => {
    console.log(`Painel Web rodando na porta ${port}`);
  });
}