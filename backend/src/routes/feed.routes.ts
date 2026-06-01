/**
 * Feed e Admin — v1.9
 * FIX v1.9: /discover e /trending agora usam optionalAuth e retornam
 *           minha_reacao para cada review (corrigindo o estado dos botões
 *           de reação no Feed para usuários logados)
 * FIX v1.8: l._count.likes (não .reacoes) para contagem de curtidas em listas
 */

import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { sanitizeUser, calcMedia } from '../utils/helpers';
import { authMiddleware, adminMiddleware, optionalAuth, AuthRequest } from '../middlewares/authMiddleware';

export const feedRouter  = Router();
export const adminRouter = Router();

// ── Helper: reações de um conjunto de avaliações ──────────
async function buildReacoesData(avIds: number[], meuId?: number) {
  if (avIds.length === 0) return {
    likeMap: new Map<number, number>(),
    dislikeMap: new Map<number, number>(),
    meusReacoes: new Map<number, string>(),
  };

  const todasReacoes = await prisma.tAB_REACAO_REVIEW.findMany({
    where:  { id_avaliacao: { in: avIds } },
    select: { id_avaliacao: true, id_usuario: true, tipo: true },
  });

  const likeMap    = new Map<number, number>();
  const dislikeMap = new Map<number, number>();
  const meusReacoes = new Map<number, string>();

  todasReacoes.forEach(r => {
    if (r.tipo === 'LIKE')    likeMap.set(r.id_avaliacao,    (likeMap.get(r.id_avaliacao)    ?? 0) + 1);
    if (r.tipo === 'DISLIKE') dislikeMap.set(r.id_avaliacao, (dislikeMap.get(r.id_avaliacao) ?? 0) + 1);
    if (meuId && r.id_usuario === meuId) meusReacoes.set(r.id_avaliacao, r.tipo);
  });

  return { likeMap, dislikeMap, meusReacoes };
}

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

// ── GET /feed/me — atividades do próprio usuário ─────────
feedRouter.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const atividades = await prisma.tAB_ATIVIDADE.findMany({
      where:   { id_usuario: req.usuario!.id_usuario },
      include: {
        usuario:      { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
        usuario_alvo: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
        jogo:         true,
        avaliacao:    { include: { _count: { select: { reacoes: true } } } },
        lista:        { include: { _count: { select: { likes: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take:    50,
    });
    return res.json(atividades);
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
        avaliacao:    { include: { _count: { select: { reacoes: true } } } },
        lista:        { include: { _count: { select: { likes: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take:    60,
    });

    return res.json(atividades);
  } catch (err) { next(err); }
});

// ── GET /feed/discover ────────────────────────────────────
// FIX v1.9: usa optionalAuth para retornar minha_reacao
feedRouter.get('/discover', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const [reviews, lists, games, recentReviewers] = await Promise.all([
      prisma.tAB_AVALIACAO.findMany({
        include: {
          usuario: true,
          jogo:    true,
          _count:  { select: { reacoes: true, comentarios: true } },
        },
        orderBy: { created_at: 'desc' },
        take:    20,
      }),
      prisma.tAB_LISTA.findMany({
        where:   { publica: true },
        include: {
          usuario: true,
          jogos:   { include: { jogo: true }, take: 5 },
          _count:  { select: { likes: true } },
        },
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

    const avIds = reviews.map(r => r.id_avaliacao);
    const { likeMap, dislikeMap, meusReacoes } = await buildReacoesData(avIds, req.usuario?.id_usuario);

    return res.json({
      reviews: reviews.map(r => ({
        ...r,
        usuario:        sanitizeUser(r.usuario as unknown as Record<string, unknown>),
        likes_count:    likeMap.get(r.id_avaliacao)    ?? 0,
        dislikes_count: dislikeMap.get(r.id_avaliacao) ?? 0,
        comments_count: r._count.comentarios,
        minha_reacao:   meusReacoes.get(r.id_avaliacao) ?? null,   // ← FIX
      })),
      lists:  lists.map(l => ({ ...l, likes_count: l._count.likes })),
      games:  games.map(calcMedia),
      users:  recentReviewers.map(r => r.usuario),
    });
  } catch (err) { next(err); }
});

// ── GET /feed/trending ────────────────────────────────────
// FIX v1.9: usa optionalAuth para retornar minha_reacao
feedRouter.get('/trending', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const periodo = String(req.query.periodo || 'semana');
    const from    = periodo === 'semana' ? new Date(Date.now() - 7  * 864e5)
                 : periodo === 'mes'     ? new Date(Date.now() - 30 * 864e5)
                 : new Date(0);

    const [games, reviews, lists] = await Promise.all([
      prisma.tAB_JOGOS.findMany({
        include: { avaliacoes: { select: { nota: true } }, _count: { select: { status_jogos: true } } },
        where:   { avaliacoes: { some: { created_at: { gte: from } } } },
        orderBy: { avaliacoes: { _count: 'desc' } },
        take:    6,
      }),
      prisma.tAB_AVALIACAO.findMany({
        include: {
          usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
          jogo:    true,
          _count:  { select: { reacoes: true } },
        },
        where:   { created_at: { gte: from } },
        orderBy: { reacoes: { _count: 'desc' } },
        take:    6,
      }),
      prisma.tAB_LISTA.findMany({
        where:   { publica: true, created_at: { gte: from } },
        include: {
          usuario: true,
          jogos:   { include: { jogo: true }, take: 4 },
          _count:  { select: { likes: true } },
        },
        orderBy: { likes: { _count: 'desc' } },
        take:    6,
      }),
    ]);

    const avIds = reviews.map(r => r.id_avaliacao);
    const { likeMap, dislikeMap, meusReacoes } = await buildReacoesData(avIds, req.usuario?.id_usuario);

    return res.json({
      games:   games.map(calcMedia),
      reviews: reviews.map(r => ({
        ...r,
        likes_count:    likeMap.get(r.id_avaliacao)    ?? 0,
        dislikes_count: dislikeMap.get(r.id_avaliacao) ?? 0,
        minha_reacao:   meusReacoes.get(r.id_avaliacao) ?? null,  // ← FIX
      })),
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
