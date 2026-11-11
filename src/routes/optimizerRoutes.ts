/**
 * @file optimizerRoutes.ts
 * Rotas para consulta da otimização BGA e reexecução sob demanda.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { idsEngine } from '../services/idsEngine.js';

const router = Router();

router.get('/comparison', (req: Request, res: Response) => {
  const comparison = idsEngine.getLatestComparison();
  res.json({
    success: true,
    data: comparison,
  });
});

router.post('/run', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { maxCpu, maxFp, seed } = req.body || {};

    const maxCpuNum = maxCpu !== undefined ? Number(maxCpu) : undefined;
    const maxFpNum = maxFp !== undefined ? Number(maxFp) : undefined;
    const seedNum = seed !== undefined ? Number(seed) : undefined;

    const comparison = idsEngine.reevaluateOptimizer(maxCpuNum, maxFpNum, seedNum);

    res.json({
      success: true,
      message: 'Otimização BGA (Algoritmo Genético) executada com sucesso.',
      data: comparison,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
