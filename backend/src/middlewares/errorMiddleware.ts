/**
 * Middleware global de erros — v1.6.1
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Prisma error codes without importing Prisma types (compatible across versions)
type PrismaError = { code?: string; message: string; name: string };

function isPrismaError(e: unknown): e is PrismaError {
  if (typeof e !== 'object' || e === null) return false;
  const name = (e as { name?: string }).name ?? '';
  return name.startsWith('PrismaClient');
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      message: err.errors.map(e => e.message).join(' '),
      errors:  err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  // Prisma known errors
  if (isPrismaError(err)) {
    const prismaErr = err as PrismaError;
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ message: 'Este registro já existe.' }); return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ message: 'Registro não encontrado.' }); return;
    }
    if (prismaErr.code === 'P2003') {
      res.status(400).json({ message: 'Referência inválida.' }); return;
    }
    if (prismaErr.name === 'PrismaClientValidationError') {
      res.status(400).json({ message: 'Dados inválidos para a operação solicitada.' }); return;
    }
    console.error('[Prisma Error]', prismaErr.code, prismaErr.message);
    res.status(400).json({ message: `Erro no banco de dados. Código: ${prismaErr.code ?? 'desconhecido'}` });
    return;
  }

  // Generic errors
  if (err instanceof Error) {
    console.error('[API Error]', err.message);
    res.status(500).json({ message: err.message || 'Erro interno do servidor.' });
    return;
  }

  console.error('[Unknown Error]', err);
  res.status(500).json({ message: 'Erro desconhecido.' });
}
