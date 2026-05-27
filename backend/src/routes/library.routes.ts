/**
 * Rotas da Biblioteca Pessoal
 *
 * "Vitrine" é o nome público do recurso `top_position` no banco.
 * Favoritos (coração) e Vitrine são independentes.
 *
 * GET    /library                      — listar com filtro de status
 * POST   /library/games/:id/status     — adicionar/atualizar status
 * POST   /library/games/:id/favorite   — marcar favorito
 * DELETE /library/games/:id/favorite   — remover favorito
 * PUT    /library/vitrine              — salvar estado completo da Vitrine (4 slots)
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { calcMedia } from '../utils/helpers';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';

export const libraryRouter = Router();

// ── GET /library ──────────────────────────────────────────
libraryRouter.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const status = String(req.query.status || 'TODOS');

    const where: Record<string, unknown> = { id_usuario: req.usuario!.id_usuario };
    if (status !== 'TODOS' && status !== 'FAVORITOS' && status !== 'VITRINE') {
      where.status = status;
    }
    if (status === 'FAVORITOS') where.favorito      = true;
    if (status === 'VITRINE')   where.top_position  = { not: null };

    const items = await prisma.tAB_STATUS_JOGO.findMany({
      where,
      include: { jogo: { include: { avaliacoes: { select: { nota: true } } } } },
      orderBy: [{ top_position: 'asc' }, { updated_at: 'desc' }],
    });

    return res.json(items.map(i => ({ ...i, jogo: calcMedia(i.jogo) })));
  } catch (err) { next(err); }
});

// ── POST /library/games/:id/status ────────────────────────
libraryRouter.post('/games/:id/status', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      status:       z.enum(['QUERO_JOGAR', 'JOGANDO', 'ZERADO', 'ABANDONADO']).optional(),
      favorito:     z.boolean().optional(),
      top_position: z.number().int().min(1).max(4).nullable().optional(),
    });

    const dados = schema.parse(req.body);

    const item = await prisma.tAB_STATUS_JOGO.upsert({
      where: {
        id_usuario_id_jogo: {
          id_usuario: req.usuario!.id_usuario,
          id_jogo:    Number(req.params.id),
        },
      },
      update: dados,
      create: {
        id_usuario: req.usuario!.id_usuario,
        id_jogo:    Number(req.params.id),
        status:     dados.status || 'QUERO_JOGAR',
        favorito:   dados.favorito ?? false,
      },
    });

    return res.json(item);
  } catch (err) { next(err); }
});

// ── POST /library/games/:id/favorite ─────────────────────
libraryRouter.post('/games/:id/favorite', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const item = await prisma.tAB_STATUS_JOGO.upsert({
      where: {
        id_usuario_id_jogo: {
          id_usuario: req.usuario!.id_usuario,
          id_jogo:    Number(req.params.id),
        },
      },
      update: { favorito: true },
      create: {
        id_usuario: req.usuario!.id_usuario,
        id_jogo:    Number(req.params.id),
        favorito:   true,
        status:     'QUERO_JOGAR',
      },
    });
    return res.json(item);
  } catch (err) { next(err); }
});

// ── DELETE /library/games/:id/favorite ────────────────────
// Remove o favorito mas mantém o status e a posição da Vitrine
libraryRouter.delete('/games/:id/favorite', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await prisma.tAB_STATUS_JOGO.updateMany({
      where: {
        id_usuario: req.usuario!.id_usuario,
        id_jogo:    Number(req.params.id),
      },
      data: { favorito: false },
    });
    return res.json({ message: 'Favorito removido.' });
  } catch (err) { next(err); }
});

// ── PUT /library/vitrine ──────────────────────────────────
// Salva o estado completo da Vitrine (até 4 jogos com posições).
// O cliente deve enviar SEMPRE os 4 slots desejados — slots não
// enviados são apagados. Isso evita estado inconsistente.
libraryRouter.put('/vitrine', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      items: z.array(
        z.object({
          id_jogo:  z.number().int().positive(),
          position: z.number().int().min(1).max(4),
        }),
      ).max(4),
    });

    const { items } = schema.parse(req.body);

    // Valida posições únicas
    const positions = items.map(i => i.position);
    if (new Set(positions).size !== positions.length) {
      return res.status(400).json({ message: 'Posições duplicadas na Vitrine.' });
    }

    // Transação: reseta todas as posições, depois define as novas
    await prisma.$transaction([
      prisma.tAB_STATUS_JOGO.updateMany({
        where: { id_usuario: req.usuario!.id_usuario },
        data:  { top_position: null },
      }),
      ...items.map(item =>
        prisma.tAB_STATUS_JOGO.upsert({
          where: {
            id_usuario_id_jogo: {
              id_usuario: req.usuario!.id_usuario,
              id_jogo:    item.id_jogo,
            },
          },
          update: { top_position: item.position, favorito: true },
          create: {
            id_usuario:   req.usuario!.id_usuario,
            id_jogo:      item.id_jogo,
            top_position: item.position,
            favorito:     true,
            status:       'QUERO_JOGAR',
          },
        }),
      ),
    ]);

    return res.json({ message: 'Vitrine atualizada.' });
  } catch (err) { next(err); }
});
