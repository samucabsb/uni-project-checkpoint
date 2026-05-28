/**
 * Diário de Jogos — v1.6
 * Histórico de múltiplas sessões por jogo (diferente da avaliação)
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/authMiddleware';
import { parseId } from '../utils/validate';

export const diaryRouter = Router();

// ── GET /diary — próprio diário ───────────────────────────
diaryRouter.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const entries = await prisma.tAB_DIARIO_JOGO.findMany({
      where:   { id_usuario: req.usuario!.id_usuario },
      include: { jogo: { include: { avaliacoes: { select: { nota: true } } } } },
      orderBy: { data_jogada: 'desc' },
    });
    return res.json(entries);
  } catch (err) { next(err); }
});

// ── GET /diary/user/:id — diário público de outro usuário ─
diaryRouter.get('/user/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const entries = await prisma.tAB_DIARIO_JOGO.findMany({
      where:   { id_usuario: id },
      include: { jogo: true },
      orderBy: { data_jogada: 'desc' },
      take:    30,
    });
    return res.json(entries);
  } catch (err) { next(err); }
});

// ── POST /diary ───────────────────────────────────────────
diaryRouter.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      id_jogo:     z.number().int().positive(),
      data_jogada: z.string().refine(v => !isNaN(Date.parse(v)), 'Data inválida'),
      nota:        z.number().int().min(1).max(10).optional().nullable(),
      comentario:  z.string().max(1000).optional().nullable(),
    });

    const dados = schema.parse(req.body);

    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo: dados.id_jogo } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    const entry = await prisma.tAB_DIARIO_JOGO.create({
      data: {
        id_usuario:  req.usuario!.id_usuario,
        id_jogo:     dados.id_jogo,
        data_jogada: new Date(dados.data_jogada),
        nota:        dados.nota ?? null,
        comentario:  dados.comentario ?? null,
      },
      include: { jogo: true },
    });

    return res.status(201).json(entry);
  } catch (err) { next(err); }
});

// ── PUT /diary/:id ────────────────────────────────────────
diaryRouter.put('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const entry = await prisma.tAB_DIARIO_JOGO.findUnique({ where: { id_diario: id } });
    if (!entry) return res.status(404).json({ message: 'Entrada não encontrada.' });
    if (entry.id_usuario !== req.usuario!.id_usuario && req.usuario!.tipo_usuario !== 'ADMIN') {
      return res.status(403).json({ message: 'Sem permissão.' });
    }

    const schema = z.object({
      data_jogada: z.string().refine(v => !isNaN(Date.parse(v))).optional(),
      nota:        z.number().int().min(1).max(10).optional().nullable(),
      comentario:  z.string().max(1000).optional().nullable(),
    });

    const dados = schema.parse(req.body);
    const updated = await prisma.tAB_DIARIO_JOGO.update({
      where: { id_diario: id },
      data: {
        ...dados,
        data_jogada: dados.data_jogada ? new Date(dados.data_jogada) : undefined,
      },
      include: { jogo: true },
    });

    return res.json(updated);
  } catch (err) { next(err); }
});

// ── DELETE /diary/:id ─────────────────────────────────────
diaryRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const entry = await prisma.tAB_DIARIO_JOGO.findUnique({ where: { id_diario: id } });
    if (!entry) return res.status(404).json({ message: 'Entrada não encontrada.' });
    if (entry.id_usuario !== req.usuario!.id_usuario && req.usuario!.tipo_usuario !== 'ADMIN') {
      return res.status(403).json({ message: 'Sem permissão.' });
    }

    await prisma.tAB_DIARIO_JOGO.delete({ where: { id_diario: id } });
    return res.json({ message: 'Entrada excluída.' });
  } catch (err) { next(err); }
});
