/**
 * @file logsRoutes.ts
 * Rota para consulta do terminal de logs do sistema.
 */

import { Router, Request, Response } from 'express';
import { logger, LogLevel } from '../utils/logger.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const level = req.query.level ? (String(req.query.level).toUpperCase() as LogLevel) : undefined;

  const logs = logger.getRecentLogs(limit, level);

  res.json({
    success: true,
    data: logs,
  });
});

router.post('/clear', (req: Request, res: Response) => {
  logger.clear();
  res.json({
    success: true,
    message: 'Buffer de logs limpo com sucesso.',
  });
});

export default router;
