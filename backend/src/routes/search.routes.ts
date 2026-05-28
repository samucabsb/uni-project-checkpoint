/**
 * Busca global unificada — v1.6
 * Um único endpoint retorna jogos, usuários e listas
 */

import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { calcMedia } from '../utils/helpers';

export const searchRouter = Router();

// GET /search?q=termo
searchRouter.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ games: [], users: [], lists: [] });

    const [games, users, lists] = await Promise.all([
      prisma.tAB_JOGOS.findMany({
        where:   { nm_jogo: { contains: q } },
        include: { avaliacoes: { select: { nota: true } } },
        take:    5,
      }),
      prisma.tAB_USUARIO.findMany({
        where:  { nm_usuario: { contains: q } },
        select: {
          id_usuario: true, nm_usuario: true, img_usuario: true, bio_usuario: true,
          _count: { select: { avaliacoes: true, seguidores: true } },
        },
        take: 4,
      }),
      prisma.tAB_LISTA.findMany({
        where:   { publica: true, OR: [{ nm_lista: { contains: q } }, { descricao: { contains: q } }] },
        include: { usuario: { select: { id_usuario: true, nm_usuario: true } }, jogos: { include: { jogo: true }, take: 3 } },
        take:    4,
      }),
    ]);

    return res.json({
      games: games.map(g => { const { avaliacoes: _, ...rest } = calcMedia(g); return rest; }),
      users,
      lists,
    });
  } catch (err) { next(err); }
});
