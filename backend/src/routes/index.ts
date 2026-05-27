/**
 * Índice de rotas — registra todos os roteadores
 * Cada domínio tem seu próprio arquivo de rotas
 */

import { Router } from 'express';
import { authRouter }    from './auth.routes';
import { gamesRouter }   from './games.routes';
import { reviewsRouter } from './reviews.routes';
import { listsRouter }   from './lists.routes';
import { libraryRouter } from './library.routes';
import { usersRouter }   from './users.routes';
import { feedRouter, adminRouter } from './feed.routes';

export const routes = Router();

// Health check
routes.get('/health', (_req, res) =>
  res.json({ status: 'ok', versao: '1.4.0', timestamp: new Date().toISOString() }),
);

// Rotas com aliases em PT/EN para compatibilidade
routes.use('/auth',                              authRouter);
routes.use(['/games',    '/jogos'],              gamesRouter);
routes.use(['/reviews',  '/avaliacoes'],         reviewsRouter);
routes.use(['/lists',    '/listas'],             listsRouter);
routes.use(['/library',  '/biblioteca'],         libraryRouter);
routes.use(['/users',    '/usuarios'],           usersRouter);
routes.use('/feed',                              feedRouter);
routes.use('/admin',                             adminRouter);
