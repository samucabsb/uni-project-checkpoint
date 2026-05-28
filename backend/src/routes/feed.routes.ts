/**
 * Feed e Admin — v1.6
 * Adições: timeline de atividades, trending
 */

import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { sanitizeUser, calcMedia } from '../utils/helpers';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/authMiddleware';

export const feedRouter  = Router();
export const adminRouter = Router();

// ── GET /feed/stats ───────────────────────────────────────
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
        include: { usuario: true, jogo: true, _count: { select: { likes: true, comentarios: true } } },
        orderBy: { created_at: 'desc' },
        take:    20,
      }),
      prisma.tAB_LISTA.findMany({
        where:   { publica: true },
        include: { usuario: true, jogos: { include: { jogo: true }, take: 5 }, _count: { select: { likes: true } } },
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
        include:  { usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true, bio_usuario: true, _count: { select: { avaliacoes: true, seguidores: true } } } } },
        orderBy:  { created_at: 'desc' },
        take:     12,
      }),
    ]);

    return res.json({
      reviews: reviews.map(r => ({
        ...r,
        usuario:         sanitizeUser(r.usuario as unknown as Record<string, unknown>),
        likes_count:     r._count.likes,
        comments_count:  r._count.comentarios,
      })),
      lists:  lists.map(l => ({ ...l, likes_count: l._count.likes })),
      games:  games.map(calcMedia),
      users:  recentReviewers.map(r => r.usuario),
    });
  } catch (err) { next(err); }
});

// ── GET /feed/following — timeline de quem o usuário segue ─
feedRouter.get('/following', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const follows = await prisma.tAB_FOLLOW.findMany({
      where:  { id_usuario_seguidor: req.usuario!.id_usuario },
      select: { id_usuario_seguido: true },
    });
    const ids = follows.map(f => f.id_usuario_seguido);
    if (ids.length === 0) return res.json([]);

    const atividades = await prisma.tAB_ATIVIDADE.findMany({
      where:   { id_usuario: { in: ids } },
      include: {
        usuario:      { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
        usuario_alvo: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
        jogo:         true,
        avaliacao:    { include: { _count: { select: { likes: true } } } },
        lista:        { include: { _count: { select: { likes: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take:    60,
    });

    return res.json(atividades);
  } catch (err) { next(err); }
});

// ── GET /feed/trending ────────────────────────────────────
feedRouter.get('/trending', async (req, res, next) => {
  try {
    const periodo = String(req.query.periodo || 'semana');
    const from    = periodo === 'semana' ? new Date(Date.now() - 7 * 864e5)
                 : periodo === 'mes'     ? new Date(Date.now() - 30 * 864e5)
                 : new Date(0);

    const [games, reviews, lists] = await Promise.all([
      // Jogos mais avaliados no período
      prisma.tAB_JOGOS.findMany({
        include: { avaliacoes: { select: { nota: true } } },
        where:   { avaliacoes: { some: { created_at: { gte: from } } } },
        orderBy: { avaliacoes: { _count: 'desc' } },
        take:    6,
      }),
      // Reviews mais curtidas no período
      prisma.tAB_AVALIACAO.findMany({
        include: {
          usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
          jogo:    true,
          _count:  { select: { likes: true } },
        },
        where:   { created_at: { gte: from } },
        orderBy: { likes: { _count: 'desc' } },
        take:    6,
      }),
      // Listas com mais likes
      prisma.tAB_LISTA.findMany({
        where:   { publica: true, created_at: { gte: from } },
        include: { usuario: true, jogos: { include: { jogo: true }, take: 4 }, _count: { select: { likes: true } } },
        orderBy: { likes: { _count: 'desc' } },
        take:    6,
      }),
    ]);

    return res.json({
      games:   games.map(calcMedia),
      reviews: reviews.map(r => ({ ...r, likes_count: r._count.likes })),
      lists:   lists.map(l => ({ ...l, likes_count: l._count.likes })),
      periodo,
    });
  } catch (err) { next(err); }
});

// ── GET /admin/dashboard ──────────────────────────────────
adminRouter.get('/dashboard', authMiddleware, adminMiddleware, async (_req, res, next) => {
  try {
    const [usuarios, jogos, avaliacoes, listas, status, atividades] = await Promise.all([
      prisma.tAB_USUARIO.count(),
      prisma.tAB_JOGOS.count(),
      prisma.tAB_AVALIACAO.count(),
      prisma.tAB_LISTA.count(),
      prisma.tAB_STATUS_JOGO.count(),
      prisma.tAB_ATIVIDADE.count(),
    ]);

    const todasAv    = await prisma.tAB_AVALIACAO.findMany({ select: { nota: true } });
    const mediaGeral = todasAv.length
      ? Number(((todasAv.reduce((s, a) => s + a.nota, 0) / todasAv.length) / 2).toFixed(1))
      : 0;

    return res.json({ totais: { usuarios, jogos, avaliacoes, listas, status, atividades, mediaGeral } });
  } catch (err) { next(err); }
});
