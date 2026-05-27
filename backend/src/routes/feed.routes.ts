/**
 * Feed e Admin — v1.5
 */

import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { sanitizeUser, calcMedia } from '../utils/helpers';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/authMiddleware';

export const feedRouter  = Router();
export const adminRouter = Router();

// ── GET /feed/stats — estatísticas públicas (Landing) ─────
feedRouter.get('/stats', async (_req, res, next) => {
  try {
    const [jogos, usuarios, avaliacoes] = await Promise.all([
      prisma.tAB_JOGOS.count(),
      prisma.tAB_USUARIO.count(),
      prisma.tAB_AVALIACAO.count(),
    ]);
    return res.json({ jogos, usuarios, avaliacoes });
  } catch (err) { next(err); }
});

// ── GET /feed/discover ────────────────────────────────────
feedRouter.get('/discover', async (_req, res, next) => {
  try {
    const [reviews, lists, games, recentReviewers] = await Promise.all([
      prisma.tAB_AVALIACAO.findMany({
        include:  { usuario: true, jogo: true, _count: { select: { likes: true } } },
        orderBy:  { created_at: 'desc' },
        take:     20,
      }),
      prisma.tAB_LISTA.findMany({
        where:   { publica: true },
        include: { usuario: true, jogos: { include: { jogo: true }, take: 5 } },
        orderBy: { created_at: 'desc' },
        take:    8,
      }),
      prisma.tAB_JOGOS.findMany({
        include: { avaliacoes: { select: { nota: true } } },
        orderBy: { created_at: 'desc' },
        take:    8,
      }),
      prisma.tAB_AVALIACAO.findMany({
        distinct: ['id_usuario'],
        include:  {
          usuario: {
            select: {
              id_usuario: true, nm_usuario: true, img_usuario: true, bio_usuario: true,
              _count: { select: { avaliacoes: true, seguidores: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take:    12,
      }),
    ]);

    return res.json({
      reviews: reviews.map(r => ({
        ...r,
        usuario:     sanitizeUser(r.usuario as unknown as Record<string, unknown>),
        likes_count: r._count.likes,
      })),
      lists,
      games: games.map(calcMedia),
      users: recentReviewers.map(r => r.usuario),
    });
  } catch (err) { next(err); }
});

// ── GET /feed/following ───────────────────────────────────
feedRouter.get('/following', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const follows = await prisma.tAB_FOLLOW.findMany({
      where:  { id_usuario_seguidor: req.usuario!.id_usuario },
      select: { id_usuario_seguido: true },
    });

    const ids = follows.map(f => f.id_usuario_seguido);
    if (ids.length === 0) return res.json([]);

    const reviews = await prisma.tAB_AVALIACAO.findMany({
      where:   { id_usuario: { in: ids } },
      include: { usuario: true, jogo: true, _count: { select: { likes: true } } },
      orderBy: { created_at: 'desc' },
      take:    30,
    });

    return res.json(
      reviews.map(r => ({
        ...r,
        usuario:     sanitizeUser(r.usuario as unknown as Record<string, unknown>),
        likes_count: r._count.likes,
      })),
    );
  } catch (err) { next(err); }
});

// ── GET /admin/dashboard ──────────────────────────────────
adminRouter.get('/dashboard', authMiddleware, adminMiddleware, async (_req, res, next) => {
  try {
    const [usuarios, jogos, avaliacoes, listas, status] = await Promise.all([
      prisma.tAB_USUARIO.count(),
      prisma.tAB_JOGOS.count(),
      prisma.tAB_AVALIACAO.count(),
      prisma.tAB_LISTA.count(),
      prisma.tAB_STATUS_JOGO.count(),
    ]);

    const todasAv    = await prisma.tAB_AVALIACAO.findMany({ select: { nota: true } });
    const mediaGeral = todasAv.length
      ? Number(((todasAv.reduce((s, a) => s + a.nota, 0) / todasAv.length) / 2).toFixed(1))
      : 0;

    return res.json({ totais: { usuarios, jogos, avaliacoes, listas, status, mediaGeral } });
  } catch (err) { next(err); }
});
