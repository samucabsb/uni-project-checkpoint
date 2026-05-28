/**
 * Rotas de Avaliações — v1.6.1
 * CRITICAL FIX: /popular e /comments/:id ANTES de /:id
 * FIX: validação de data futura
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sanitizeUser } from '../utils/helpers';
import { logAtividade } from '../utils/activities';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/authMiddleware';
import { parseId } from '../utils/validate';

export const reviewsRouter = Router();

const includeAvaliacao = {
  usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
  jogo:    true,
  _count:  { select: { likes: true, comentarios: true } },
};

async function getLikedSet(meuId: number | undefined, ids: number[]): Promise<Set<number>> {
  if (!meuId || ids.length === 0) return new Set();
  const likes = await prisma.tAB_LIKE_REVIEW.findMany({
    where:  { id_usuario: meuId, id_avaliacao: { in: ids } },
    select: { id_avaliacao: true },
  });
  return new Set(likes.map(l => l.id_avaliacao));
}

function enrichReview(r: Record<string, unknown>, likedSet: Set<number>) {
  const count = (r._count as { likes: number; comentarios: number }) || { likes: 0, comentarios: 0 };
  return {
    ...r,
    usuario:        r.usuario ? sanitizeUser(r.usuario as Record<string, unknown>) : null,
    likes_count:    count.likes,
    comments_count: count.comentarios,
    ja_curtiu:      likedSet.has(r.id_avaliacao as number),
  };
}

// Schema de avaliação com data futura bloqueada
const avaliacaoSchema = z.object({
  id_jogo:     z.number().int().positive(),
  nota:        z.number().int().min(1).max(10),
  comentario:  z.string().max(1000).optional().nullable(),
  data_jogada: z.string()
    .refine(v => !v || !isNaN(Date.parse(v)), 'Data inválida.')
    .refine(v => !v || new Date(v) <= new Date(), 'A data não pode ser no futuro.')
    .optional()
    .nullable(),
});

// ── GET /reviews — recentes ───────────────────────────────
reviewsRouter.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const reviews = await prisma.tAB_AVALIACAO.findMany({
      include: includeAvaliacao,
      orderBy: { created_at: 'desc' },
      take:    40,
    });
    const ids      = reviews.map(r => r.id_avaliacao);
    const likedSet = await getLikedSet(req.usuario?.id_usuario, ids);
    return res.json(reviews.map(r => enrichReview(r as unknown as Record<string, unknown>, likedSet)));
  } catch (err) { next(err); }
});

// ── GET /reviews/popular — ANTES de /:id ────────────────
reviewsRouter.get('/popular', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const periodo = String(req.query.periodo || 'semana');
    const from    = periodo === 'semana' ? new Date(Date.now() - 7 * 864e5)
                 : periodo === 'mes'     ? new Date(Date.now() - 30 * 864e5)
                 : new Date(0);

    const reviews = await prisma.tAB_AVALIACAO.findMany({
      where:   { created_at: { gte: from } },
      include: includeAvaliacao,
      orderBy: { likes: { _count: 'desc' } },
      take:    20,
    });
    const ids      = reviews.map(r => r.id_avaliacao);
    const likedSet = await getLikedSet(req.usuario?.id_usuario, ids);
    return res.json(reviews.map(r => enrichReview(r as unknown as Record<string, unknown>, likedSet)));
  } catch (err) { next(err); }
});

// ── DELETE /reviews/comments/:id — ANTES de /:id ─────────
reviewsRouter.delete('/comments/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const comentario = await prisma.tAB_COMENTARIO_REVIEW.findUnique({ where: { id_comentario: id } });
    if (!comentario) return res.status(404).json({ message: 'Comentário não encontrado.' });

    const ehDono  = comentario.id_usuario === req.usuario!.id_usuario;
    const ehAdmin = req.usuario!.tipo_usuario === 'ADMIN';
    if (!ehDono && !ehAdmin) return res.status(403).json({ message: 'Sem permissão.' });

    await prisma.tAB_COMENTARIO_REVIEW.delete({ where: { id_comentario: id } });
    return res.json({ message: 'Comentário excluído.' });
  } catch (err) { next(err); }
});

// ── GET /reviews/:id ──────────────────────────────────────
reviewsRouter.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const review = await prisma.tAB_AVALIACAO.findUnique({
      where:   { id_avaliacao: id },
      include: includeAvaliacao,
    });
    if (!review) return res.status(404).json({ message: 'Avaliação não encontrada.' });

    const likedSet = await getLikedSet(req.usuario?.id_usuario, [id]);
    return res.json(enrichReview(review as unknown as Record<string, unknown>, likedSet));
  } catch (err) { next(err); }
});

// ── POST /reviews ─────────────────────────────────────────
reviewsRouter.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const dados = avaliacaoSchema.parse(req.body);

    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo: dados.id_jogo } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    const review = await prisma.tAB_AVALIACAO.upsert({
      where:  { id_usuario_id_jogo: { id_usuario: req.usuario!.id_usuario, id_jogo: dados.id_jogo } },
      update: { nota: dados.nota, comentario: dados.comentario ?? null, data_jogada: dados.data_jogada ? new Date(dados.data_jogada) : null },
      create: { id_usuario: req.usuario!.id_usuario, id_jogo: dados.id_jogo, nota: dados.nota, comentario: dados.comentario ?? null, data_jogada: dados.data_jogada ? new Date(dados.data_jogada) : null },
    });

    await logAtividade({ id_usuario: req.usuario!.id_usuario, tipo: 'AVALIOU_JOGO', id_jogo: dados.id_jogo, id_avaliacao: review.id_avaliacao });

    return res.status(201).json(review);
  } catch (err) { next(err); }
});

// ── DELETE /reviews/:id ───────────────────────────────────
reviewsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const review = await prisma.tAB_AVALIACAO.findUnique({ where: { id_avaliacao: id } });
    if (!review) return res.status(404).json({ message: 'Avaliação não encontrada.' });

    const ehDono  = review.id_usuario === req.usuario!.id_usuario;
    const ehAdmin = req.usuario!.tipo_usuario === 'ADMIN';
    if (!ehDono && !ehAdmin) return res.status(403).json({ message: 'Sem permissão.' });

    await prisma.tAB_AVALIACAO.delete({ where: { id_avaliacao: id } });
    return res.json({ message: 'Avaliação excluída.' });
  } catch (err) { next(err); }
});

// ── POST /reviews/:id/like ────────────────────────────────
reviewsRouter.post('/:id/like', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const review = await prisma.tAB_AVALIACAO.findUnique({ where: { id_avaliacao: id } });
    if (!review) return res.status(404).json({ message: 'Avaliação não encontrada.' });
    if (review.id_usuario === req.usuario!.id_usuario) return res.status(400).json({ message: 'Você não pode curtir sua própria avaliação.' });

    await prisma.tAB_LIKE_REVIEW.upsert({
      where:  { id_usuario_id_avaliacao: { id_usuario: req.usuario!.id_usuario, id_avaliacao: id } },
      update: {},
      create: { id_usuario: req.usuario!.id_usuario, id_avaliacao: id },
    });

    await logAtividade({ id_usuario: req.usuario!.id_usuario, tipo: 'CURTIU_REVIEW', id_avaliacao: id });

    const total = await prisma.tAB_LIKE_REVIEW.count({ where: { id_avaliacao: id } });
    return res.status(201).json({ likes_count: total });
  } catch (err) { next(err); }
});

// ── DELETE /reviews/:id/like ──────────────────────────────
reviewsRouter.delete('/:id/like', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    await prisma.tAB_LIKE_REVIEW.deleteMany({ where: { id_usuario: req.usuario!.id_usuario, id_avaliacao: id } });
    const total = await prisma.tAB_LIKE_REVIEW.count({ where: { id_avaliacao: id } });
    return res.json({ likes_count: total });
  } catch (err) { next(err); }
});

// ── GET /reviews/:id/comments ─────────────────────────────
reviewsRouter.get('/:id/comments', async (req, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const comentarios = await prisma.tAB_COMENTARIO_REVIEW.findMany({
      where:   { id_avaliacao: id },
      include: { usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } } },
      orderBy: { created_at: 'asc' },
    });
    return res.json(comentarios);
  } catch (err) { next(err); }
});

// ── POST /reviews/:id/comments ────────────────────────────
reviewsRouter.post('/:id/comments', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id     = parseId(req.params.id, res);
    if (id === null) return;

    const schema = z.object({ texto: z.string().min(1, 'Comentário não pode estar vazio.').max(500) });
    const { texto } = schema.parse(req.body);

    const review = await prisma.tAB_AVALIACAO.findUnique({ where: { id_avaliacao: id } });
    if (!review) return res.status(404).json({ message: 'Avaliação não encontrada.' });

    const comentario = await prisma.tAB_COMENTARIO_REVIEW.create({
      data:    { id_usuario: req.usuario!.id_usuario, id_avaliacao: id, texto },
      include: { usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } } },
    });
    return res.status(201).json(comentario);
  } catch (err) { next(err); }
});
