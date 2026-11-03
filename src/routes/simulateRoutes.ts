/**
 * @file simulateRoutes.ts
 * Rotas para controle do tráfego simulado e seleção de cenários de ataque.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { idsEngine } from '../services/idsEngine.js';
import { ThreatScenario } from '../domain/metrics.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();
const VALID_SCENARIOS: ThreatScenario[] = ['normal', 'syn_flood', 'deauth_burst', 'mac_spoofing'];

router.post('/start', (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = req.body?.scenario || 'normal';
    if (!VALID_SCENARIOS.includes(scenario)) {
      throw new ValidationError(`Cenário inválido: "${scenario}". Opções válidas: ${VALID_SCENARIOS.join(', ')}`);
    }

    idsEngine.startSimulation(scenario);

    res.json({
      success: true,
      message: `Simulação de tráfego iniciada no cenário ${scenario}.`,
      data: idsEngine.getStatus(),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/stop', (req: Request, res: Response, next: NextFunction) => {
  try {
    idsEngine.stopSimulation();
    res.json({
      success: true,
      message: 'Simulação de tráfego encerrada.',
      data: idsEngine.getStatus(),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/scenario', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenario } = req.body;
    if (!scenario || !VALID_SCENARIOS.includes(scenario)) {
      throw new ValidationError(`Cenário inválido. Opções válidas: ${VALID_SCENARIOS.join(', ')}`);
    }

    idsEngine.startSimulation(scenario);
    res.json({
      success: true,
      message: `Cenário de simulação alterado para ${scenario}.`,
      data: idsEngine.getStatus(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
