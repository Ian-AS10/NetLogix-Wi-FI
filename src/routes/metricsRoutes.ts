/**
 * @file metricsRoutes.ts
 * Rotas para injeção manual de métricas e histórico temporal.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { idsEngine } from '../services/idsEngine.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

router.get('/history', (req: Request, res: Response) => {
  const history = idsEngine.getMetricsHistory();
  res.json({
    success: true,
    data: history,
  });
});

router.post('/inject', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trafficRate, anomalyRate, newMacs } = req.body;

    if (trafficRate === undefined || anomalyRate === undefined || newMacs === undefined) {
      throw new ValidationError('Os campos trafficRate, anomalyRate e newMacs são obrigatórios.');
    }

    const tRate = Number(trafficRate);
    const aRate = Number(anomalyRate);
    const nMacs = Number(newMacs);

    if (isNaN(tRate) || isNaN(aRate) || isNaN(nMacs)) {
      throw new ValidationError('Todos os campos de métricas devem ser numéricos.');
    }

    const updatedStatus = idsEngine.injectManualMetrics(tRate, aRate, nMacs);

    res.json({
      success: true,
      message: 'Métricas injetadas e avaliadas com sucesso.',
      data: updatedStatus,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
