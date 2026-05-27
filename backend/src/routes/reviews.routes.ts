/**
 * Rotas de Avaliações
 * GET    /api/reviews    — listar recentes
 * POST   /api/reviews    — criar ou editar (upsert)
 * DELETE /api/reviews/:id — excluir
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import { sanitize } from "../utils/helpers";

export const reviewsRouter = Router();

const reviewSchema = z.object({
  id_jogo:     z.number().int().positive(),
  nota:        z.number().int().min(1).max(5),
  comentario:  z.string().min(3, 'Escreva ao menos 3 caracteres').max(1000),
  data_jogada: z.string().optional().nullable(),
});

reviewsRouter.get('/', async (_req, res, next) => {
  try {
    const reviews = await prisma.tAB_AVALIACAO.findMany({
      include:  { usuario: true, jogo: true },
      orderBy:  { created_at: 'desc' },
      take:     40,
    });
    // Remove senha dos usuários retornados
    const safe = reviews.map(r => ({
      ...r,
      usuario: r.usuario ? sanitize(r.usuario as unknown as Record<string, unknown>) : null,
    }));
    return res.json(safe);
  } catch (err) { next(err); }
});

reviewsRouter.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const dados = reviewSchema.parse(req.body);

    const review = await prisma.tAB_AVALIACAO.upsert({
      where:  { id_usuario_id_jogo: { id_usuario: req.usuario!.id_usuario, id_jogo: dados.id_jogo } },
      update: { nota: dados.nota, comentario: dados.comentario, data_jogada: dados.data_jogada ? new Date(dados.data_jogada) : null },
      create: { id_usuario: req.usuario!.id_usuario, id_jogo: dados.id_jogo, nota: dados.nota, comentario: dados.comentario, data_jogada: dados.data_jogada ? new Date(dados.data_jogada) : null },
    });

    return res.status(201).json(review);
  } catch (err) { next(err); }
});

reviewsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const review = await prisma.tAB_AVALIACAO.findUnique({ where: { id_avaliacao: Number(req.params.id) } });
    if (!review) return res.status(404).json({ message: 'Avaliação não encontrada.' });

    const ehDono  = review.id_usuario === req.usuario!.id_usuario;
    const ehAdmin = req.usuario!.tipo_usuario === 'ADMIN';
    if (!ehDono && !ehAdmin) return res.status(403).json({ message: 'Sem permissão.' });

    await prisma.tAB_AVALIACAO.delete({ where: { id_avaliacao: review.id_avaliacao } });
    return res.json({ message: 'Avaliação excluída.' });
  } catch (err) { next(err); }
});
