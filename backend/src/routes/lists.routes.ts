/**
 * Rotas de Listas — v1.6
 * Likes em listas + ordenação manual dos jogos
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logAtividade } from '../utils/activities';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/authMiddleware';
import { parseId } from '../utils/validate';

export const listsRouter = Router();

const jogosDaLista = {
  include: {
    jogo: { include: { avaliacoes: { select: { nota: true } } } },
  },
  orderBy: [{ position: 'asc' as const }, { id_jogo: 'asc' as const }],
};

async function getLikedListasSet(meuId: number | undefined, ids: number[]): Promise<Set<number>> {
  if (!meuId || !ids.length) return new Set();
  const likes = await prisma.tAB_LIKE_LISTA.findMany({
    where:  { id_usuario: meuId, id_lista: { in: ids } },
    select: { id_lista: true },
  });
  return new Set(likes.map(l => l.id_lista));
}

function enrichLista(lista: Record<string, unknown>, likedSet: Set<number>) {
  const likes = (lista as { _count?: { likes?: number } })._count?.likes ?? 0;
  return { ...lista, likes_count: likes, ja_curtiu: likedSet.has(lista.id_lista as number) };
}

const listaInclude = {
  usuario: true,
  jogos: jogosDaLista,
  _count: { select: { likes: true } },
};

// ── GET /lists ────────────────────────────────────────────
listsRouter.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const where: Record<string, unknown> = { publica: true };

    if (search) {
      where.OR = [
        { nm_lista:  { contains: search } },
        { descricao: { contains: search } },
        { usuario:   { nm_usuario: { contains: search } } },
      ];
    }

    const listas = await prisma.tAB_LISTA.findMany({
      where,
      include: listaInclude,
      orderBy: { created_at: 'desc' },
      take:    50,
    });

    const ids      = listas.map(l => l.id_lista);
    const likedSet = await getLikedListasSet(req.usuario?.id_usuario, ids);

    return res.json(listas.map(l => enrichLista(l as unknown as Record<string, unknown>, likedSet)));
  } catch (err) { next(err); }
});

// ── GET /lists/popular ────────────────────────────────────
listsRouter.get('/popular', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const periodo = String(req.query.periodo || 'semana');
    const from    = periodo === 'semana' ? new Date(Date.now() - 7 * 864e5)
                 : periodo === 'mes'     ? new Date(Date.now() - 30 * 864e5)
                 : new Date(0);

    const listas = await prisma.tAB_LISTA.findMany({
      where:   { publica: true, created_at: { gte: from } },
      include: listaInclude,
      orderBy: { likes: { _count: 'desc' } },
      take:    10,
    });

    const ids      = listas.map(l => l.id_lista);
    const likedSet = await getLikedListasSet(req.usuario?.id_usuario, ids);

    return res.json(listas.map(l => enrichLista(l as unknown as Record<string, unknown>, likedSet)));
  } catch (err) { next(err); }
});

// ── GET /lists/user/:id ───────────────────────────────────
listsRouter.get('/user/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const id    = parseId(req.params.id, res);
    if (id === null) return;
    const ehDono = req.usuario?.id_usuario === id || req.usuario?.tipo_usuario === 'ADMIN';
    const where: Record<string, unknown> = { id_usuario: id };
    if (!ehDono) where.publica = true;

    const listas = await prisma.tAB_LISTA.findMany({
      where,
      include: listaInclude,
      orderBy: { created_at: 'desc' },
    });

    const ids      = listas.map(l => l.id_lista);
    const likedSet = await getLikedListasSet(req.usuario?.id_usuario, ids);
    return res.json(listas.map(l => enrichLista(l as unknown as Record<string, unknown>, likedSet)));
  } catch (err) { next(err); }
});

// ── GET /lists/:id ────────────────────────────────────────
listsRouter.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const lista = await prisma.tAB_LISTA.findUnique({
      where:   { id_lista: id },
      include: listaInclude,
    });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    const ehDono = req.usuario?.id_usuario === lista.id_usuario || req.usuario?.tipo_usuario === 'ADMIN';
    if (!lista.publica && !ehDono) return res.status(403).json({ message: 'Esta lista é privada.' });

    const likedSet = await getLikedListasSet(req.usuario?.id_usuario, [id]);
    return res.json(enrichLista(lista as unknown as Record<string, unknown>, likedSet));
  } catch (err) { next(err); }
});

// ── POST /lists ───────────────────────────────────────────
listsRouter.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      nm_lista:  z.string().min(2).max(100),
      descricao: z.string().max(500).optional().nullable(),
      publica:   z.boolean().optional().default(true),
    });
    const dados = schema.parse(req.body);
    const lista = await prisma.tAB_LISTA.create({
      data: { id_usuario: req.usuario!.id_usuario, ...dados },
    });

    await logAtividade({
      id_usuario: req.usuario!.id_usuario,
      tipo:       'CRIOU_LISTA',
      id_lista:   lista.id_lista,
    });

    return res.status(201).json(lista);
  } catch (err) { next(err); }
});

// ── PUT /lists/:id ────────────────────────────────────────
listsRouter.put('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const lista = await prisma.tAB_LISTA.findUnique({ where: { id_lista: id } });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    const ehDono = lista.id_usuario === req.usuario!.id_usuario || req.usuario!.tipo_usuario === 'ADMIN';
    if (!ehDono) return res.status(403).json({ message: 'Sem permissão.' });

    const schema = z.object({
      nm_lista:  z.string().min(2).optional(),
      descricao: z.string().optional().nullable(),
      publica:   z.boolean().optional(),
    });
    const atualizada = await prisma.tAB_LISTA.update({ where: { id_lista: id }, data: schema.parse(req.body) });
    return res.json(atualizada);
  } catch (err) { next(err); }
});

// ── DELETE /lists/:id ─────────────────────────────────────
listsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const lista = await prisma.tAB_LISTA.findUnique({ where: { id_lista: id } });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    const ehDono = lista.id_usuario === req.usuario!.id_usuario || req.usuario!.tipo_usuario === 'ADMIN';
    if (!ehDono) return res.status(403).json({ message: 'Sem permissão.' });

    await prisma.tAB_LISTA.delete({ where: { id_lista: id } });
    return res.json({ message: 'Lista excluída.' });
  } catch (err) { next(err); }
});

// ── POST /lists/:id/games ─────────────────────────────────
listsRouter.post('/:id/games', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;
    const id_jogo = Number(req.body.id_jogo);
    if (!Number.isInteger(id_jogo) || id_jogo <= 0) return res.status(400).json({ message: 'ID do jogo inválido.' });

    const lista = await prisma.tAB_LISTA.findUnique({ where: { id_lista: id } });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    const ehDono = lista.id_usuario === req.usuario!.id_usuario || req.usuario!.tipo_usuario === 'ADMIN';
    if (!ehDono) return res.status(403).json({ message: 'Sem permissão para alterar esta lista.' });

    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    await prisma.tAB_LISTA_JOGO.upsert({
      where:  { id_lista_id_jogo: { id_lista: id, id_jogo } },
      update: {},
      create: { id_lista: id, id_jogo },
    });

    await logAtividade({
      id_usuario: req.usuario!.id_usuario,
      tipo:       'ADICIONOU_JOGO_LISTA',
      id_lista:   id,
      id_jogo,
    });

    return res.status(201).json({ message: 'Jogo adicionado.' });
  } catch (err) { next(err); }
});

// ── DELETE /lists/:id/games/:id_jogo ─────────────────────
listsRouter.delete('/:id/games/:id_jogo', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id      = parseId(req.params.id, res);
    if (id === null) return;
    const id_jogo = parseId(req.params.id_jogo, res);
    if (id_jogo === null) return;

    const lista = await prisma.tAB_LISTA.findUnique({ where: { id_lista: id } });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    const ehDono = lista.id_usuario === req.usuario!.id_usuario || req.usuario!.tipo_usuario === 'ADMIN';
    if (!ehDono) return res.status(403).json({ message: 'Sem permissão.' });

    await prisma.tAB_LISTA_JOGO.deleteMany({ where: { id_lista: id, id_jogo } });
    return res.json({ message: 'Jogo removido.' });
  } catch (err) { next(err); }
});

// ── PUT /lists/:id/games/order — ordenar ─────────────────
listsRouter.put('/:id/games/order', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const lista = await prisma.tAB_LISTA.findUnique({ where: { id_lista: id } });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    const ehDono = lista.id_usuario === req.usuario!.id_usuario || req.usuario!.tipo_usuario === 'ADMIN';
    if (!ehDono) return res.status(403).json({ message: 'Sem permissão.' });

    const schema = z.object({
      order: z.array(z.object({ id_jogo: z.number().int().positive(), position: z.number().int().positive() })),
    });
    const { order } = schema.parse(req.body);

    await prisma.$transaction(
      order.map(o => prisma.tAB_LISTA_JOGO.updateMany({
        where: { id_lista: id, id_jogo: o.id_jogo },
        data:  { position: o.position },
      })),
    );

    return res.json({ message: 'Ordem atualizada.' });
  } catch (err) { next(err); }
});

// ── POST /lists/:id/like ──────────────────────────────────
listsRouter.post('/:id/like', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const lista = await prisma.tAB_LISTA.findUnique({ where: { id_lista: id } });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    await prisma.tAB_LIKE_LISTA.upsert({
      where:  { id_usuario_id_lista: { id_usuario: req.usuario!.id_usuario, id_lista: id } },
      update: {},
      create: { id_usuario: req.usuario!.id_usuario, id_lista: id },
    });

    await logAtividade({
      id_usuario: req.usuario!.id_usuario,
      tipo:       'CURTIU_LISTA',
      id_lista:   id,
    });

    const total = await prisma.tAB_LIKE_LISTA.count({ where: { id_lista: id } });
    return res.status(201).json({ likes_count: total });
  } catch (err) { next(err); }
});

// ── DELETE /lists/:id/like ────────────────────────────────
listsRouter.delete('/:id/like', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    await prisma.tAB_LIKE_LISTA.deleteMany({
      where: { id_usuario: req.usuario!.id_usuario, id_lista: id },
    });

    const total = await prisma.tAB_LIKE_LISTA.count({ where: { id_lista: id } });
    return res.json({ likes_count: total });
  } catch (err) { next(err); }
});
