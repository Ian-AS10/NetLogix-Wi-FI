/**
 * @file interfacesRoutes.ts
 * Rota para consulta segura de interfaces de rede disponíveis no host.
 */

import { Router, Request, Response } from 'express';
import { tsharkCaptureService } from '../services/tsharkCaptureService.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const interfaces = tsharkCaptureService.getAvailableInterfaces();
  const tsharkInstalled = tsharkCaptureService.isTSharkInstalled();

  res.json({
    success: true,
    data: {
      interfaces,
      tsharkInstalled,
      safeCommand: 'tshark -D',
      installHint: 'sudo apt-get install -y tshark',
    },
  });
});

export default router;
