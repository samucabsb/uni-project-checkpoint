/**
 * Rotas de Listas — v1.5
 * Permissões: dono ou admin para criar/editar/excluir e para alterar jogos
 * Busca: feita no banco (não em JS)
 * Listas privadas: visitantes só veem públicas
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/authMiddleware';
import { parseId } from '../utils/validate';

export const listsRouter = Router();

const jogosDaLista = {
  include: { jogo: { include: { avaliacoes: { select: { nota: true } } } } },
};

// ── GET /lists — públicas com busca no banco ──────────────
listsRouter.get('/', async (req, res, next) => {
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
      include: { usuario: true, jogos: jogosDaLista },
      orderBy: { created_at: 'desc' },
      take:    50,
    });

    return res.json(listas);
  } catch (err) { next(err); }
});

// ── GET /lists/user/:id — listas de um usuário ────────────
listsRouter.get('/user/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    // Dono vê todas; visitantes só veem públicas
    const where: Record<string, unknown> = { id_usuario: id };
    const ehDono = req.usuario?.id_usuario === id || req.usuario?.tipo_usuario === 'ADMIN';
    if (!ehDono) where.publica = true;

    const listas = await prisma.tAB_LISTA.findMany({
      where,
      include: { jogos: jogosDaLista },
      orderBy: { created_at: 'desc' },
    });
    return res.json(listas);
  } catch (err) { next(err); }
});

// ── GET /lists/:id ────────────────────────────────────────
listsRouter.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const lista = await prisma.tAB_LISTA.findUnique({
      where:   { id_lista: id },
      include: { usuario: true, jogos: jogosDaLista },
    });

    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    // Lista privada: só dono ou admin podem ver
    const ehDono = req.usuario?.id_usuario === lista.id_usuario || req.usuario?.tipo_usuario === 'ADMIN';
    if (!lista.publica && !ehDono) {
      return res.status(403).json({ message: 'Esta lista é privada.' });
    }

    return res.json(lista);
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
    const dados     = schema.parse(req.body);
    const atualizada = await prisma.tAB_LISTA.update({ where: { id_lista: id }, data: dados });
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

// ── POST /lists/:id/games — adicionar jogo (dono/admin) ───
listsRouter.post('/:id/games', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id      = parseId(req.params.id, res);
    if (id === null) return;
    const id_jogo = Number(req.body.id_jogo);
    if (!Number.isInteger(id_jogo) || id_jogo <= 0) {
      return res.status(400).json({ message: 'ID do jogo inválido.' });
    }

    // Valida permissão
    const lista = await prisma.tAB_LISTA.findUnique({ where: { id_lista: id } });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    const ehDono = lista.id_usuario === req.usuario!.id_usuario || req.usuario!.tipo_usuario === 'ADMIN';
    if (!ehDono) return res.status(403).json({ message: 'Sem permissão para alterar esta lista.' });

    // Valida se jogo existe
    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    await prisma.tAB_LISTA_JOGO.upsert({
      where:  { id_lista_id_jogo: { id_lista: id, id_jogo } },
      update: {},
      create: { id_lista: id, id_jogo },
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

    // Valida permissão
    const lista = await prisma.tAB_LISTA.findUnique({ where: { id_lista: id } });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    const ehDono = lista.id_usuario === req.usuario!.id_usuario || req.usuario!.tipo_usuario === 'ADMIN';
    if (!ehDono) return res.status(403).json({ message: 'Sem permissão para alterar esta lista.' });

    await prisma.tAB_LISTA_JOGO.deleteMany({ where: { id_lista: id, id_jogo } });
    return res.json({ message: 'Jogo removido.' });
  } catch (err) { next(err); }
});
