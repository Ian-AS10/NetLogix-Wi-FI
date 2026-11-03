/**
 * @file captureRoutes.ts
 * Rotas de controle da captura real passiva com TShark.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { idsEngine } from '../services/idsEngine.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

router.post('/start', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { networkInterface } = req.body;
    if (!networkInterface || typeof networkInterface !== 'string') {
      throw new ValidationError('O campo "networkInterface" é obrigatório e deve ser uma string.');
    }

    idsEngine.startRealCapture(networkInterface);

    res.json({
      success: true,
      message: `Captura TShark iniciada na interface ${networkInterface}.`,
      data: idsEngine.getStatus(),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/stop', (req: Request, res: Response, next: NextFunction) => {
  try {
    idsEngine.stopRealCapture();
    res.json({
      success: true,
      message: 'Captura TShark finalizada com sucesso.',
      data: idsEngine.getStatus(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
