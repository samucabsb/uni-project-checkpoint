import { Router } from 'express';
import { authRouter }    from './auth.routes';
import { gamesRouter }   from './games.routes';
import { reviewsRouter } from './reviews.routes';
import { listsRouter }   from './lists.routes';
import { usersRouter }   from './users.routes';
import { feedRouter, adminRouter } from './feed.routes';
import { searchRouter }  from './search.routes';
import { diaryRouter }   from './diary.routes';

export const routes = Router();

routes.get('/health', (_req, res) =>
  res.json({ status: 'ok', versao: '1.10.4', timestamp: new Date().toISOString() }),
);

routes.use('/auth',                     authRouter);
routes.use(['/games',   '/jogos'],      gamesRouter);
routes.use(['/reviews', '/avaliacoes'], reviewsRouter);
routes.use(['/lists',   '/listas'],     listsRouter);
// /library removido — funcionalidade de biblioteca descontinuada
routes.use(['/users',   '/usuarios'],   usersRouter);
routes.use('/feed',                     feedRouter);
routes.use('/admin',                    adminRouter);
routes.use('/search',                   searchRouter);
routes.use(['/diary',   '/diario'],     diaryRouter);
