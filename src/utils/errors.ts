/**
 * @file errors.ts
 * Tratamento centralizado de erros da API sem vazamento de stack traces.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = (err as AppError).statusCode || 500;
  const isOperational = (err as AppError).isOperational ?? false;

  logger.error('ErrorHandler', `Erro na rota ${req.method} ${req.path}: ${err.message}`, {
    statusCode,
    operational: isOperational,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message: isOperational ? err.message : 'Ocorreu um erro interno no servidor.',
      statusCode,
      timestamp: new Date().toISOString(),
    },
  });
}
