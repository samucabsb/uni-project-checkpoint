/**
 * Rotas de Jogos — v1.6
 * Adições: listas que contêm o jogo, popular por período
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { calcMedia } from '../utils/helpers';
import { logAtividade } from '../utils/activities';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { parseId, clamp } from '../utils/validate';

export const gamesRouter = Router();

const jogoSchema = z.object({
  nm_jogo:       z.string().min(2).max(100),
  img_jogo:      z.string().url('URL inválida'),
  genero:        z.string().max(50).optional().nullable(),
  plataforma:    z.string().max(100).optional().nullable(),
  classificacao: z.string().max(10).optional().nullable(),
  descricao:     z.string().max(2000).optional().nullable(),
  dt_jogo:       z.string().refine(v => !isNaN(Date.parse(v)), 'Data inválida'),
});

// ── GET /games ────────────────────────────────────────────
gamesRouter.get('/', async (req, res, next) => {
  try {
    const { search = '', genero = '', ano = '', classificacao = '', take = '60', sort = 'az' } =
      req.query as Record<string, string>;

    const AND: unknown[] = [];
    if (search)        AND.push({ nm_jogo: { contains: search } });
    if (genero)        AND.push({ genero:  { contains: genero } });
    if (classificacao) AND.push({ classificacao });
    if (ano)           AND.push({ dt_jogo: { gte: new Date(`${ano}-01-01`), lte: new Date(`${ano}-12-31`) } });

    const orderByMap: Record<string, unknown> = {
      az:      { nm_jogo: 'asc'  },
      recente: { dt_jogo: 'desc' },
      antigo:  { dt_jogo: 'asc'  },
    };

    const jogos = await prisma.tAB_JOGOS.findMany({
      where:   { AND },
      include: { avaliacoes: { select: { nota: true } }, _count: { select: { status_jogos: true } } },
      orderBy: (orderByMap[sort] ?? { nm_jogo: "asc" }) as { [key: string]: "asc" | "desc" },
      take:    clamp(Number(take) || 60, 1, 100),
    });

    const comMedia = jogos.map(calcMedia);
    if (sort === 'melhor')        comMedia.sort((a, b) => (b.media || 0) - (a.media || 0));
    if (sort === 'mais_avaliado') comMedia.sort((a, b) => (b.total_avaliacoes || 0) - (a.total_avaliacoes || 0));

    return res.json(comMedia);
  } catch (err) { next(err); }
});

// ── GET /games/search ─────────────────────────────────────
gamesRouter.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const jogos = await prisma.tAB_JOGOS.findMany({
      where:   { nm_jogo: { contains: q } },
      include: { avaliacoes: { select: { nota: true } } },
      take:    6,
    });

    return res.json(jogos.map(j => { const { avaliacoes: _, ...rest } = calcMedia(j); return rest; }));
  } catch (err) { next(err); }
});

// ── GET /games/popular ────────────────────────────────────
gamesRouter.get('/popular', async (req, res, next) => {
  try {
    const periodo = String(req.query.periodo || 'semana');
    const from    = periodo === 'semana' ? new Date(Date.now() - 7 * 864e5)
                 : periodo === 'mes'     ? new Date(Date.now() - 30 * 864e5)
                 : new Date(0);

    const jogos = await prisma.tAB_JOGOS.findMany({
      where:   { avaliacoes: { some: { created_at: { gte: from } } } },
      include: { avaliacoes: { select: { nota: true } }, _count: { select: { status_jogos: true } } },
      orderBy: { avaliacoes: { _count: 'desc' } },
      take:    8,
    });

    return res.json(jogos.map(calcMedia));
  } catch (err) { next(err); }
});

// ── GET /games/:id ────────────────────────────────────────
gamesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const jogo = await prisma.tAB_JOGOS.findUnique({
      where:   { id_jogo: id },
      include: {
        avaliacoes: {
          include: {
            usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
            _count:  { select: { likes: true, comentarios: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        _count: { select: { status_jogos: true } },
      },
    });

    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    // Listas públicas que contêm este jogo
    const listasComJogo = await prisma.tAB_LISTA.findMany({
      where:   { publica: true, jogos: { some: { id_jogo: id } } },
      include: { usuario: { select: { id_usuario: true, nm_usuario: true } } },
      take:    5,
    });

    // Distribuição de notas
    const distribuicao: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) distribuicao[i] = 0;
    jogo.avaliacoes.forEach(a => { distribuicao[a.nota] = (distribuicao[a.nota] || 0) + 1; });

    return res.json({
      ...calcMedia(jogo),
      distribuicao_notas: distribuicao,
      listas_com_jogo:    listasComJogo,
      avaliacoes: jogo.avaliacoes.map(a => ({
        ...a,
        likes_count:    a._count.likes,
        comments_count: a._count.comentarios,
      })),
    });
  } catch (err) { next(err); }
});

// ── POST /games ───────────────────────────────────────────
gamesRouter.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const dados     = jogoSchema.parse(req.body);
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
    const id    = parseId(req.params.id, res);
    if (id === null) return;
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
    const id   = parseId(req.params.id, res);
    if (id === null) return;
    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo: id } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    await prisma.tAB_JOGOS.delete({ where: { id_jogo: id } });
    return res.json({ message: 'Jogo excluído.' });
  } catch (err) { next(err); }
});
