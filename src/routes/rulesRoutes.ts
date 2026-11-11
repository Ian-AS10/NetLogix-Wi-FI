/**
 * @file rulesRoutes.ts
 * Rotas para consulta e ativação de regras de defesa ativa (IPS) no motor NetLogix.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { SECURITY_RULES_CATALOG } from '../core/optimization/rulesCatalog.js';
import { idsEngine } from '../services/idsEngine.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const status = idsEngine.getStatus();
  res.json({
    success: true,
    data: SECURITY_RULES_CATALOG,
    meta: {
      total: SECURITY_RULES_CATALOG.length,
      enforcedRuleIds: status.enforcedRuleIds ?? [],
      autoProtectEnabled: status.autoProtectEnabled ?? true,
      mitigatedPacketsTotal: status.mitigatedPacketsTotal ?? 0,
      disclaimer:
        'Regras em modo de proteção ativa IPS. Custos de CPU e taxas de falso positivo são estimativas heurísticas parametrizadas.',
    },
  });
});

/**
 * POST /api/rules/toggle
 * Ativa ou desativa individualmente uma regra de defesa no motor IPS.
 */
router.post('/toggle', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ruleId } = req.body || {};
    if (!ruleId || typeof ruleId !== 'string') {
      throw new ValidationError('O parâmetro "ruleId" é obrigatório.');
    }
    const status = idsEngine.toggleRuleEnforcement(ruleId);
    const isNowActive = status.enforcedRuleIds?.includes(ruleId);
    res.json({
      success: true,
      message: isNowActive
        ? `Proteção ativa habilitada para a regra ${ruleId}.`
        : `Regra ${ruleId} desativada manualmente.`,
      data: status,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rules/apply
 * Aplica imediatamente um lote de regras (ex.: seleção ótima do BGA).
 */
router.post('/apply', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ruleIds, source } = req.body || {};
    if (!Array.isArray(ruleIds)) {
      throw new ValidationError('O parâmetro "ruleIds" deve ser uma lista de IDs de regras.');
    }
    const label = typeof source === 'string' && source.trim() ? source.trim() : 'Manual';
    const status = idsEngine.applyRuleSet(ruleIds, label);
    res.json({
      success: true,
      message: `Política de proteção [${label}] aplicada com ${status.enforcedRuleIds?.length ?? 0} regras ativas.`,
      data: status,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rules/auto-protect
 * Habilita ou pausa a sincronização automática das regras BGA com o motor de proteção.
 */
router.post('/auto-protect', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled } = req.body || {};
    if (typeof enabled !== 'boolean') {
      throw new ValidationError('O parâmetro "enabled" deve ser booleano.');
    }
    const status = idsEngine.setAutoProtect(enabled);
    res.json({
      success: true,
      message: enabled
        ? 'Proteção Automática BGA (IPS) ativada.'
        : 'Proteção Automática pausada. Controle manual de regras habilitado.',
      data: status,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rules/purge
 * Executa o expurgo autônomo (Rollback) imediato de todas as regras no Firewall.
 */
router.post('/purge', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = idsEngine.purgeRules();
    res.json({
      success: true,
      message: 'Expurgo Autônomo (Rollback) concluído: todas as regras do Firewall foram removidas.',
      data: status,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
