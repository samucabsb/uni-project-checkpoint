/**
 * Rotas de Jogos — CRUD completo
 * GET    /api/games          — listar com filtros
 * GET    /api/games/search   — autocomplete
 * GET    /api/games/:id      — detalhes + avaliações
 * POST   /api/games          — criar (admin)
 * PUT    /api/games/:id      — editar (admin)
 * DELETE /api/games/:id      — excluir (admin)
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { calcMedia } from '../utils/helpers';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/authMiddleware';

export const gamesRouter = Router();

const jogoSchema = z.object({
  nm_jogo:       z.string().min(2, 'Nome muito curto').max(100),
  img_jogo:      z.string().url('URL de imagem inválida'),
  genero:        z.string().max(50).optional().nullable(),
  plataforma:    z.string().max(100).optional().nullable(),
  classificacao: z.string().max(10).optional().nullable(),
  descricao:     z.string().max(2000).optional().nullable(),
  dt_jogo:       z.string().refine(v => !isNaN(Date.parse(v)), 'Data inválida'),
});

// ── GET /games ────────────────────────────────────────────
gamesRouter.get('/', async (req, res, next) => {
  try {
    const {
      search = '', genero = '', ano = '',
      classificacao = '', take = '60',
    } = req.query as Record<string, string>;

    const AND: unknown[] = [];
    if (search)        AND.push({ nm_jogo: { contains: search } });
    if (genero)        AND.push({ genero: { contains: genero } });
    if (classificacao) AND.push({ classificacao });
    if (ano)           AND.push({ dt_jogo: {
      gte: new Date(`${ano}-01-01`),
      lte: new Date(`${ano}-12-31`),
    }});

    const jogos = await prisma.tAB_JOGOS.findMany({
      where:   { AND },
      include: { avaliacoes: { select: { nota: true } } },
      orderBy: { nm_jogo: 'asc' },
      take:    Math.min(100, Number(take) || 60),
    });

    return res.json(jogos.map(calcMedia));
  } catch (err) { next(err); }
});

// ── GET /games/search — autocomplete ─────────────────────
gamesRouter.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const jogos = await prisma.tAB_JOGOS.findMany({
      where:   { nm_jogo: { contains: q } },
      include: { avaliacoes: { select: { nota: true } } },
      take:    8,
    });

    return res.json(jogos.map(j => {
      const { media, total_avaliacoes, avaliacoes: _, ...rest } = calcMedia(j);
      return { ...rest, media, total_avaliacoes };
    }));
  } catch (err) { next(err); }
});

// ── GET /games/:id ────────────────────────────────────────
gamesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });

    const jogo = await prisma.tAB_JOGOS.findUnique({
      where:   { id_jogo: id },
      include: {
        avaliacoes: {
          include: {
            usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        _count: { select: { status_jogos: true } },
      },
    });

    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    return res.json(calcMedia(jogo));
  } catch (err) { next(err); }
});

// ── POST /games ───────────────────────────────────────────
gamesRouter.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const dados = jogoSchema.parse(req.body);

    const existente = await prisma.tAB_JOGOS.findUnique({ where: { nm_jogo: dados.nm_jogo } });
    if (existente) return res.status(409).json({ message: 'Já existe um jogo com esse nome.' });

    const jogo = await prisma.tAB_JOGOS.create({
      data: { ...dados, dt_jogo: new Date(dados.dt_jogo), id_usuario: req.usuario!.id_usuario },
    });

    return res.status(201).json(jogo);
  } catch (err) { next(err); }
});

// ── PUT /games/:id ────────────────────────────────────────
gamesRouter.put('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });

    const dados = jogoSchema.partial().parse(req.body);
    const data: Record<string, unknown> = { ...dados };
    if (dados.dt_jogo) data.dt_jogo = new Date(dados.dt_jogo);

    const jogo = await prisma.tAB_JOGOS.update({ where: { id_jogo: id }, data });
    return res.json(jogo);
  } catch (err) { next(err); }
});

// ── DELETE /games/:id ─────────────────────────────────────
gamesRouter.delete('/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo: id } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    await prisma.tAB_JOGOS.delete({ where: { id_jogo: id } });
    return res.json({ message: 'Jogo excluído com sucesso.' });
  } catch (err) { next(err); }
});
