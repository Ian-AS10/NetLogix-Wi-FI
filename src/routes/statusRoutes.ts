/**
 * @file statusRoutes.ts
 * Rota para consulta do status global do IDS.
 */

import { Router, Request, Response } from 'express';
import { idsEngine } from '../services/idsEngine.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const status = idsEngine.getStatus();
  res.json({
    success: true,
    data: status,
  });
});

export default router;
