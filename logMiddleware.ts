/**
 * logMiddleware.ts
 * Middleware de log com timestamp para demonstrar concorrência assíncrona.
 *
 * ONDE COLOCAR: backend/src/middlewares/logMiddleware.ts
 *
 * COMO USAR NO server.ts:
 *   import { logMiddleware } from './middlewares/logMiddleware';
 *   app.use(logMiddleware);  // adicione ANTES de app.use('/api', routes)
 */

import { Request, Response, NextFunction } from 'express';

// Contador global de requisições simultâneas em andamento
let reqAtivas = 0;
let reqContador = 0;

export function logMiddleware(req: Request, res: Response, next: NextFunction) {
  reqContador++;
  reqAtivas++;

  const id        = reqContador;                          // ID único desta requisição
  const inicio    = Date.now();
  const timestamp = new Date().toISOString();             // ex: 2026-06-01T14:32:05.123Z

  console.log(
    `[INÍCIO] #${id} | ${timestamp} | ${req.method} ${req.path} | ativas: ${reqAtivas}`
  );

  // Intercepta o fim da resposta para logar quando terminou
  res.on('finish', () => {
    reqAtivas--;
    const duracao = Date.now() - inicio;
    const fimTimestamp = new Date().toISOString();

    console.log(
      `[FIM   ] #${id} | ${fimTimestamp} | ${req.method} ${req.path} | status: ${res.statusCode} | duração: ${duracao}ms | ativas: ${reqAtivas}`
    );
  });

  next();
}
