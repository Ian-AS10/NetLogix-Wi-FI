/**
 * @file server.ts
 * Ponto de entrada do servidor Full-Stack NetLogix Wi-Fi IDS.
 * Integra Express com Vite em modo dev e distribui arquivos estáticos em produção.
 */

import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { fileURLToPath } from 'url';
import { createApp } from './src/app.js';
import { config } from './src/config/appConfig.js';
import { idsEngine } from './src/services/idsEngine.js';
import { logger } from './src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Modo de Desenvolvimento: Carrega Vite em modo middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: null, // Evita file watcher intensivo no container
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    logger.info('Server', 'Vite dev middleware montado com sucesso.');
  } else {
    // Modo de Produção: Serve o bundle compilado em dist/
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      logger.info('Server', `Servindo arquivos estáticos de produção a partir de: ${distPath}`);
    } else {
      logger.warn('Server', 'Diretório dist/ não encontrado. Execute npm run build antes de rodar em produção.');
    }
  }

  server.listen(config.port, config.host, () => {
    logger.info(
      'Server',
      `NetLogix Wi-Fi IDS escutando em http://${config.host}:${config.port} (Janela: ${config.samplingWindowSec}s)`
    );
  });

  // Graceful Shutdown
  const handleShutdown = (signal: string) => {
    logger.info('Server', `Recebido sinal ${signal}. Iniciando encerramento gracioso...`);
    idsEngine.shutdown();

    server.close(() => {
      logger.info('Server', 'Servidor HTTP encerrado com sucesso.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Server', 'Timeout de encerramento excedido. Forçando saída.');
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('Falha crítica ao iniciar servidor:', err);
  process.exit(1);
});
