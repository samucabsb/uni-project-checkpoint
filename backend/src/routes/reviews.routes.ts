/**
 * Rotas de Avaliações — v1.5
 *
 * GET    /reviews           — listar recentes
 * POST   /reviews           — criar/editar (upsert); comentario opcional; nota 1-10
 * DELETE /reviews/:id       — excluir (dono ou admin)
 * POST   /reviews/:id/like  — curtir avaliação
 * DELETE /reviews/:id/like  — descurtir avaliação
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sanitizeUser } from '../utils/helpers';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/authMiddleware';
import { parseId } from '../utils/validate';

export const reviewsRouter = Router();

// ── GET /reviews ──────────────────────────────────────────
reviewsRouter.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const reviews = await prisma.tAB_AVALIACAO.findMany({
      include: {
        usuario: true,
        jogo:    true,
        _count:  { select: { likes: true } },
      },
      orderBy: { created_at: 'desc' },
      take:    40,
    });

    const meuId = req.usuario?.id_usuario;

    // Verifica se o usuário logado curtiu cada review
    const comLikes = await Promise.all(
      reviews.map(async r => {
        const jaCurtiu = meuId
          ? !!(await prisma.tAB_LIKE_REVIEW.findUnique({
              where: {
                id_usuario_id_avaliacao: { id_usuario: meuId, id_avaliacao: r.id_avaliacao },
              },
            }))
          : false;

        return {
          ...r,
          usuario:     r.usuario ? sanitizeUser(r.usuario as unknown as Record<string, unknown>) : null,
          likes_count: r._count.likes,
          ja_curtiu:   jaCurtiu,
        };
      }),
    );

    return res.json(comLikes);
  } catch (err) { next(err); }
});

// ── POST /reviews — criar ou editar ──────────────────────
reviewsRouter.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      id_jogo:     z.number().int().positive(),
      nota:        z.number().int().min(1).max(10),  // 1=0.5★ a 10=5★
      comentario:  z.string().max(1000).optional().nullable(),
      data_jogada: z.string().optional().nullable(),
    });

    const dados = schema.parse(req.body);

    // Verifica se o jogo existe antes do upsert
    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo: dados.id_jogo } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    const review = await prisma.tAB_AVALIACAO.upsert({
      where: {
        id_usuario_id_jogo: { id_usuario: req.usuario!.id_usuario, id_jogo: dados.id_jogo },
      },
      update: {
        nota:        dados.nota,
        comentario:  dados.comentario ?? null,
        data_jogada: dados.data_jogada ? new Date(dados.data_jogada) : null,
      },
      create: {
        id_usuario:  req.usuario!.id_usuario,
        id_jogo:     dados.id_jogo,
        nota:        dados.nota,
        comentario:  dados.comentario ?? null,
        data_jogada: dados.data_jogada ? new Date(dados.data_jogada) : null,
      },
    });

    return res.status(201).json(review);
  } catch (err) { next(err); }
});

// ── DELETE /reviews/:id ────────────────────────────────────
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

// ── POST /reviews/:id/like — curtir ───────────────────────
reviewsRouter.post('/:id/like', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const review = await prisma.tAB_AVALIACAO.findUnique({ where: { id_avaliacao: id } });
    if (!review) return res.status(404).json({ message: 'Avaliação não encontrada.' });

    // Não pode curtir a própria avaliação
    if (review.id_usuario === req.usuario!.id_usuario) {
      return res.status(400).json({ message: 'Você não pode curtir sua própria avaliação.' });
    }

    await prisma.tAB_LIKE_REVIEW.upsert({
      where: {
        id_usuario_id_avaliacao: { id_usuario: req.usuario!.id_usuario, id_avaliacao: id },
      },
      update: {},
      create: { id_usuario: req.usuario!.id_usuario, id_avaliacao: id },
    });

    const total = await prisma.tAB_LIKE_REVIEW.count({ where: { id_avaliacao: id } });
    return res.status(201).json({ message: 'Curtida registrada.', likes_count: total });
  } catch (err) { next(err); }
});

// ── DELETE /reviews/:id/like — descurtir ──────────────────
reviewsRouter.delete('/:id/like', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    await prisma.tAB_LIKE_REVIEW.deleteMany({
      where: { id_usuario: req.usuario!.id_usuario, id_avaliacao: id },
    });

    const total = await prisma.tAB_LIKE_REVIEW.count({ where: { id_avaliacao: id } });
    return res.json({ message: 'Curtida removida.', likes_count: total });
  } catch (err) { next(err); }
});
