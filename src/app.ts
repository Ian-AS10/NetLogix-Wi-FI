/**
 * @file app.ts
 * Configuração da aplicação Express.js, middlewares e registro de rotas.
 */

import express, { Express, Request, Response } from 'express';
import statusRoutes from './routes/statusRoutes.js';
import captureRoutes from './routes/captureRoutes.js';
import simulateRoutes from './routes/simulateRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';
import optimizerRoutes from './routes/optimizerRoutes.js';
import rulesRoutes from './routes/rulesRoutes.js';
import interfacesRoutes from './routes/interfacesRoutes.js';
import logsRoutes from './routes/logsRoutes.js';
import { errorHandler } from './utils/errors.js';

export function createApp(): Express {
  const app = express();

  // Limite razoável de payload para evitar DoS
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  // Headers de segurança básicos para API local
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Registro de rotas da API
  app.use('/api/status', statusRoutes);
  app.use('/api/capture', captureRoutes);
  app.use('/api/simulate', simulateRoutes);
  app.use('/api/metrics', metricsRoutes);
  app.use('/api/optimizer', optimizerRoutes);
  app.use('/api/rules', rulesRoutes);
  app.use('/api/interfaces', interfacesRoutes);
  app.use('/api/logs', logsRoutes);

  // Rota 404 específica para chamadas de API não mapeadas
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Endpoint ${req.method} ${req.path} não encontrado.`,
        statusCode: 404,
      },
    });
  });

  // Middleware centralizado de tratamento de erros
  app.use(errorHandler);

  return app;
}
