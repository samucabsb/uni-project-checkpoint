import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Handler global de erros — deve ser o último middleware registrado
export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Erros de validação do Zod → retorna mensagens legíveis
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Dados inválidos.',
      errors: error.flatten().fieldErrors,
    });
  }

  // Log em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERRO]', error);
  }

  return res.status(500).json({ message: 'Erro interno do servidor.' });
}
