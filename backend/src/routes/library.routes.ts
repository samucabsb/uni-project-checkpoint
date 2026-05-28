/**
 * Rotas da Biblioteca — v1.6
 * Status, favoritos, vitrine + atividades sociais
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { calcMedia } from '../utils/helpers';
import { logAtividade } from '../utils/activities';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { parseId } from '../utils/validate';

export const libraryRouter = Router();

// ── GET /library ──────────────────────────────────────────
libraryRouter.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const status = String(req.query.status || 'TODOS');
    const where: Record<string, unknown> = { id_usuario: req.usuario!.id_usuario };

    if (status !== 'TODOS' && status !== 'FAVORITOS' && status !== 'VITRINE') where.status = status;
    if (status === 'FAVORITOS') where.favorito     = true;
    if (status === 'VITRINE')   where.top_position = { not: null };

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
    const id_jogo = parseId(req.params.id, res);
    if (id_jogo === null) return;

    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    const schema = z.object({
      status:       z.enum(['QUERO_JOGAR', 'JOGANDO', 'ZERADO', 'ABANDONADO']).optional(),
      favorito:     z.boolean().optional(),
      top_position: z.number().int().min(1).max(4).nullable().optional(),
    });
    const dados = schema.parse(req.body);

    const item = await prisma.tAB_STATUS_JOGO.upsert({
      where:  { id_usuario_id_jogo: { id_usuario: req.usuario!.id_usuario, id_jogo } },
      update: dados,
      create: { id_usuario: req.usuario!.id_usuario, id_jogo, status: dados.status || 'QUERO_JOGAR', favorito: dados.favorito ?? false },
    });

    // Registrar atividade de mudança de status
    if (dados.status) {
      await logAtividade({
        id_usuario:  req.usuario!.id_usuario,
        tipo:        'MUDOU_STATUS',
        id_jogo,
        dados_extras: dados.status,
      });
    }

    return res.json(item);
  } catch (err) { next(err); }
});

// ── POST /library/games/:id/favorite ─────────────────────
libraryRouter.post('/games/:id/favorite', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id_jogo = parseId(req.params.id, res);
    if (id_jogo === null) return;

    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    const item = await prisma.tAB_STATUS_JOGO.upsert({
      where:  { id_usuario_id_jogo: { id_usuario: req.usuario!.id_usuario, id_jogo } },
      update: { favorito: true },
      create: { id_usuario: req.usuario!.id_usuario, id_jogo, favorito: true, status: 'QUERO_JOGAR' },
    });

    await logAtividade({ id_usuario: req.usuario!.id_usuario, tipo: 'FAVORITOU_JOGO', id_jogo });

    return res.json(item);
  } catch (err) { next(err); }
});

// ── DELETE /library/games/:id/favorite ───────────────────
libraryRouter.delete('/games/:id/favorite', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id_jogo = parseId(req.params.id, res);
    if (id_jogo === null) return;

    await prisma.tAB_STATUS_JOGO.updateMany({
      where: { id_usuario: req.usuario!.id_usuario, id_jogo },
      data:  { favorito: false },
    });
    return res.json({ message: 'Favorito removido.' });
  } catch (err) { next(err); }
});

// ── PUT /library/vitrine ──────────────────────────────────
libraryRouter.put('/vitrine', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      items: z.array(z.object({
        id_jogo:  z.number().int().positive(),
        position: z.number().int().min(1).max(4),
      })).max(4),
    });
    const { items } = schema.parse(req.body);

    const positions = items.map(i => i.position);
    if (new Set(positions).size !== positions.length) {
      return res.status(400).json({ message: 'Posições duplicadas na Vitrine.' });
    }

    await prisma.$transaction([
      prisma.tAB_STATUS_JOGO.updateMany({
        where: { id_usuario: req.usuario!.id_usuario },
        data:  { top_position: null },
      }),
      ...items.map(item =>
        prisma.tAB_STATUS_JOGO.upsert({
          where:  { id_usuario_id_jogo: { id_usuario: req.usuario!.id_usuario, id_jogo: item.id_jogo } },
          update: { top_position: item.position, favorito: true },
          create: { id_usuario: req.usuario!.id_usuario, id_jogo: item.id_jogo, top_position: item.position, favorito: true, status: 'QUERO_JOGAR' },
        }),
      ),
    ]);

    return res.json({ message: 'Vitrine atualizada.' });
  } catch (err) { next(err); }
});
