/**
 * Rotas de Avaliações — v1.10
 *
 * NOVIDADES v1.10:
 *   - Logs de concorrência em POST /reviews e POST /reviews/:id/react
 *   - Tratamento explícito de P2002 com 409 Conflict
 *   - Comportamento de upsert mantido para avaliações (idempotente por design)
 *   - Follow usa create com catch P2002 → 409 (para teste de conflito)
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
  _count:  { select: { reacoes: true, comentarios: true } },
};

async function getReacoesMap(meuId: number | undefined, ids: number[]) {
  if (!meuId || ids.length === 0) return new Map<number, string>();
  const reacoes = await prisma.tAB_REACAO_REVIEW.findMany({
    where:  { id_usuario: meuId, id_avaliacao: { in: ids } },
    select: { id_avaliacao: true, tipo: true },
  });
  return new Map(reacoes.map(r => [r.id_avaliacao as number, r.tipo as string])) as Map<number, string>;
}

async function getContadores(id: number) {
  const [likes, dislikes] = await Promise.all([
    prisma.tAB_REACAO_REVIEW.count({ where: { id_avaliacao: id, tipo: 'LIKE'    } }),
    prisma.tAB_REACAO_REVIEW.count({ where: { id_avaliacao: id, tipo: 'DISLIKE' } }),
  ]);
  return { likes_count: likes, dislikes_count: dislikes };
}

function enrichReview(r: Record<string, unknown>, reacoesMap: Map<number, string>) {
  const count = (r._count as { reacoes: number; comentarios: number }) || { reacoes: 0, comentarios: 0 };
  const minhaReacao = reacoesMap.get(r.id_avaliacao as number) ?? null;
  return {
    ...r,
    usuario:        r.usuario ? sanitizeUser(r.usuario as Record<string, unknown>) : null,
    comments_count: count.comentarios,
    minha_reacao:   minhaReacao,
  };
}

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

// ── GET /reviews ──────────────────────────────────────────
reviewsRouter.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const reviews    = await prisma.tAB_AVALIACAO.findMany({ include: includeAvaliacao, orderBy: { created_at: 'desc' }, take: 40 });
    const ids        = reviews.map(r => r.id_avaliacao);
    const reacoesMap = await getReacoesMap(req.usuario?.id_usuario, ids);

    const todasReacoes = await prisma.tAB_REACAO_REVIEW.findMany({
      where:  { id_avaliacao: { in: ids } },
      select: { id_avaliacao: true, tipo: true },
    });
    const likeMap    = new Map<number, number>();
    const dislikeMap = new Map<number, number>();
    todasReacoes.forEach(r => {
      if (r.tipo === 'LIKE')    likeMap.set(r.id_avaliacao, (likeMap.get(r.id_avaliacao) ?? 0) + 1);
      if (r.tipo === 'DISLIKE') dislikeMap.set(r.id_avaliacao, (dislikeMap.get(r.id_avaliacao) ?? 0) + 1);
    });

    return res.json(reviews.map(r => ({
      ...enrichReview(r as unknown as Record<string, unknown>, reacoesMap),
      likes_count:    likeMap.get(r.id_avaliacao)    ?? 0,
      dislikes_count: dislikeMap.get(r.id_avaliacao) ?? 0,
    })));
  } catch (err) { next(err); }
});

// ── GET /reviews/popular ──────────────────────────────────
reviewsRouter.get('/popular', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const periodo = String(req.query.periodo || 'semana');
    const from    = periodo === 'semana' ? new Date(Date.now() - 7 * 864e5)
                 : periodo === 'mes'     ? new Date(Date.now() - 30 * 864e5)
                 : new Date(0);

    const reviews    = await prisma.tAB_AVALIACAO.findMany({
      where:   { created_at: { gte: from } },
      include: includeAvaliacao,
      orderBy: { reacoes: { _count: 'desc' } },
      take:    20,
    });
    const ids        = reviews.map(r => r.id_avaliacao);
    const reacoesMap = await getReacoesMap(req.usuario?.id_usuario, ids);
    return res.json(reviews.map(r => enrichReview(r as unknown as Record<string, unknown>, reacoesMap)));
  } catch (err) { next(err); }
});

// ── DELETE /reviews/comments/:id ─────────────────────────
reviewsRouter.delete('/comments/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const c = await prisma.tAB_COMENTARIO_REVIEW.findUnique({ where: { id_comentario: id } });
    if (!c) return res.status(404).json({ message: 'Comentário não encontrado.' });

    const ok = c.id_usuario === req.usuario!.id_usuario || req.usuario!.tipo_usuario === 'ADMIN';
    if (!ok) return res.status(403).json({ message: 'Sem permissão.' });

    await prisma.tAB_COMENTARIO_REVIEW.delete({ where: { id_comentario: id } });
    return res.json({ message: 'Comentário excluído.' });
  } catch (err) { next(err); }
});

// ── GET /reviews/:id ──────────────────────────────────────
reviewsRouter.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const review = await prisma.tAB_AVALIACAO.findUnique({ where: { id_avaliacao: id }, include: includeAvaliacao });
    if (!review) return res.status(404).json({ message: 'Avaliação não encontrada.' });

    const reacoesMap = await getReacoesMap(req.usuario?.id_usuario, [id]);
    const contadores = await getContadores(id);

    return res.json({
      ...enrichReview(review as unknown as Record<string, unknown>, reacoesMap),
      ...contadores,
    });
  } catch (err) { next(err); }
});

// ── POST /reviews ─────────────────────────────────────────
// Comportamento: upsert (cria ou atualiza avaliação do usuário para o jogo)
// Para teste de conflito de CRIAÇÃO: use o script concurrency-test.ts
// (após deletar a avaliação existente, o primeiro POST vence, os demais ficam em update)
reviewsRouter.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const dados = avaliacaoSchema.parse(req.body);

    console.log(`[CONCORRÊNCIA] Iniciando POST /reviews | user: ${req.usuario!.id_usuario} | jogo: ${dados.id_jogo}`);

    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo: dados.id_jogo } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    // Verificar se é criação ou edição
    const existente = await prisma.tAB_AVALIACAO.findUnique({
      where: { id_usuario_id_jogo: { id_usuario: req.usuario!.id_usuario, id_jogo: dados.id_jogo } },
    });

    try {
      const review = await prisma.tAB_AVALIACAO.upsert({
        where:  { id_usuario_id_jogo: { id_usuario: req.usuario!.id_usuario, id_jogo: dados.id_jogo } },
        update: { nota: dados.nota, comentario: dados.comentario ?? null, data_jogada: dados.data_jogada ? new Date(dados.data_jogada) : null },
        create: { id_usuario: req.usuario!.id_usuario, id_jogo: dados.id_jogo, nota: dados.nota, comentario: dados.comentario ?? null, data_jogada: dados.data_jogada ? new Date(dados.data_jogada) : null },
      });

      if (!existente) {
        prisma.tAB_DIARIO_JOGO.create({
          data: {
            id_usuario:  req.usuario!.id_usuario,
            id_jogo:     dados.id_jogo,
            data_jogada: dados.data_jogada ? new Date(dados.data_jogada) : new Date(),
            nota:        dados.nota,
            comentario:  dados.comentario ?? null,
          },
        }).catch(() => {});
      }

      await logAtividade({ id_usuario: req.usuario!.id_usuario, tipo: 'AVALIOU_JOGO', id_jogo: dados.id_jogo, id_avaliacao: review.id_avaliacao });

      console.log(`[CONCORRÊNCIA] POST /reviews concluído | user: ${req.usuario!.id_usuario} | jogo: ${dados.id_jogo} | ação: ${existente ? 'UPDATE' : 'CREATE'}`);
      return res.status(201).json(review);
    } catch (dbErr: unknown) {
      // Captura explícita de conflito de constraint única (corrida entre criações)
      if (typeof dbErr === 'object' && dbErr !== null && 'code' in dbErr && (dbErr as { code: string }).code === 'P2002') {
        console.log(`[CONCORRÊNCIA] Conflito detectado em POST /reviews | user: ${req.usuario!.id_usuario} | jogo: ${dados.id_jogo} → 409`);
        return res.status(409).json({ message: 'Conflito: avaliação já existe para este jogo.' });
      }
      throw dbErr;
    }
  } catch (err) { next(err); }
});

// ── DELETE /reviews/:id ───────────────────────────────────
reviewsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const review = await prisma.tAB_AVALIACAO.findUnique({ where: { id_avaliacao: id } });
    if (!review) return res.status(404).json({ message: 'Avaliação não encontrada.' });

    const ok = review.id_usuario === req.usuario!.id_usuario || req.usuario!.tipo_usuario === 'ADMIN';
    if (!ok) return res.status(403).json({ message: 'Sem permissão.' });

    await prisma.tAB_AVALIACAO.delete({ where: { id_avaliacao: id } });
    return res.json({ message: 'Avaliação excluída.' });
  } catch (err) { next(err); }
});

// ── POST /reviews/:id/react ───────────────────────────────
reviewsRouter.post('/:id/react', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const { tipo } = z.object({ tipo: z.enum(['LIKE', 'DISLIKE']) }).parse(req.body);

    const review = await prisma.tAB_AVALIACAO.findUnique({ where: { id_avaliacao: id } });
    if (!review) return res.status(404).json({ message: 'Avaliação não encontrada.' });
    if (review.id_usuario === req.usuario!.id_usuario) {
      return res.status(400).json({ message: 'Você não pode reagir à sua própria avaliação.' });
    }

    const existente = await prisma.tAB_REACAO_REVIEW.findUnique({
      where: { id_usuario_id_avaliacao: { id_usuario: req.usuario!.id_usuario, id_avaliacao: id } },
    });

    if (existente?.tipo === tipo) {
      await prisma.tAB_REACAO_REVIEW.delete({
        where: { id_usuario_id_avaliacao: { id_usuario: req.usuario!.id_usuario, id_avaliacao: id } },
      });
    } else {
      await prisma.tAB_REACAO_REVIEW.upsert({
        where:  { id_usuario_id_avaliacao: { id_usuario: req.usuario!.id_usuario, id_avaliacao: id } },
        update: { tipo },
        create: { id_usuario: req.usuario!.id_usuario, id_avaliacao: id, tipo },
      });
      if (tipo === 'LIKE') {
        await logAtividade({ id_usuario: req.usuario!.id_usuario, tipo: 'CURTIU_REVIEW', id_avaliacao: id });
      }
    }

    return res.json({ ...(await getContadores(id)), minha_reacao: existente?.tipo === tipo ? null : tipo });
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
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const { texto } = z.object({ texto: z.string().min(1).max(500) }).parse(req.body);

    const review = await prisma.tAB_AVALIACAO.findUnique({ where: { id_avaliacao: id } });
    if (!review) return res.status(404).json({ message: 'Avaliação não encontrada.' });

    const comentario = await prisma.tAB_COMENTARIO_REVIEW.create({
      data:    { id_usuario: req.usuario!.id_usuario, id_avaliacao: id, texto },
      include: { usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } } },
    });
    return res.status(201).json(comentario);
  } catch (err) { next(err); }
});
