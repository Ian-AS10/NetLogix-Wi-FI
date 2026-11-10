/**
 * @file interfacesRoutes.ts
 * Rota para consulta segura de interfaces de rede disponíveis no host (Windows, Linux e macOS).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { tsharkCaptureService } from '../services/tsharkCaptureService.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const tsharkInstalled = tsharkCaptureService.isTSharkInstalled();
  const interfaces = tsharkCaptureService.getAvailableInterfaces();
  const tsharkPath = tsharkCaptureService.getResolvedBinaryPath();
  const isWin = process.platform === 'win32';

  res.json({
    success: true,
    data: {
      interfaces,
      tsharkInstalled,
      tsharkPath,
      platform: process.platform,
      safeCommand: 'tshark -D',
      installHint: isWin
        ? 'winget install WiresharkFoundation.Wireshark (ou C:\\Program Files\\Wireshark\\tshark.exe)'
        : 'sudo apt-get install -y tshark',
    },
  });
});

router.post('/tshark-path', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customPath } = req.body || {};
    if (typeof customPath !== 'string') {
      throw new ValidationError('O parâmetro "customPath" deve ser uma string.');
    }

    const found = tsharkCaptureService.setCustomBinaryPath(customPath);
    const resolvedPath = tsharkCaptureService.getResolvedBinaryPath();
    const interfaces = tsharkCaptureService.getAvailableInterfaces();

    if (!found) {
      throw new ValidationError(
        `Não foi possível localizar ou executar o TShark em "${customPath}". Informe o caminho completo para tshark.exe (ex.: C:\\Program Files\\Wireshark\\tshark.exe).`
      );
    }

    res.json({
      success: true,
      message: `TShark detectado com sucesso em: ${resolvedPath}`,
      data: {
        tsharkInstalled: true,
        tsharkPath: resolvedPath,
        interfaces,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
