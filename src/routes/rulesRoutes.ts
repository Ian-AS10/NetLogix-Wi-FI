/**
 * @file rulesRoutes.ts
 * Rota para consulta do catálogo de regras de defesa de segurança.
 */

import { Router, Request, Response } from 'express';
import { SECURITY_RULES_CATALOG } from '../core/optimization/rulesCatalog.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: SECURITY_RULES_CATALOG,
    meta: {
      total: SECURITY_RULES_CATALOG.length,
      disclaimer: 'Valores da PoC são estimativas heurísticas parametrizadas para simulação analítica.',
    },
  });
});

export default router;
