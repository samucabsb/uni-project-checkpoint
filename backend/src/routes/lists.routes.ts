/**
 * Rotas de Listas
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';

export const listsRouter = Router();

const jogosDaLista = { include: { jogo: { include: { avaliacoes: { select: { nota: true } } } } } };

// GET /lists — todas públicas (com busca por texto)
listsRouter.get('/', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').toLowerCase().trim();

    const listas = await prisma.tAB_LISTA.findMany({
      where:   { publica: true },
      include: { usuario: true, jogos: jogosDaLista },
      orderBy: { created_at: 'desc' },
    });

    // Filtragem por busca (nome, descrição ou usuário)
    const resultado = search
      ? listas.filter(l =>
          l.nm_lista.toLowerCase().includes(search) ||
          (l.descricao || '').toLowerCase().includes(search) ||
          l.usuario.nm_usuario.toLowerCase().includes(search),
        )
      : listas;

    return res.json(resultado);
  } catch (err) { next(err); }
});

// GET /lists/user/:id — listas de um usuário
listsRouter.get('/user/:id', async (req, res, next) => {
  try {
    const listas = await prisma.tAB_LISTA.findMany({
      where:   { id_usuario: Number(req.params.id) },
      include: { jogos: jogosDaLista },
      orderBy: { created_at: 'desc' },
    });
    return res.json(listas);
  } catch (err) { next(err); }
});

// GET /lists/:id — detalhes de uma lista
listsRouter.get('/:id', async (req, res, next) => {
  try {
    const lista = await prisma.tAB_LISTA.findUnique({
      where:   { id_lista: Number(req.params.id) },
      include: { usuario: true, jogos: jogosDaLista },
    });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });
    return res.json(lista);
  } catch (err) { next(err); }
});

// POST /lists — criar lista
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

// PUT /lists/:id — editar lista
listsRouter.put('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const lista = await prisma.tAB_LISTA.findUnique({ where: { id_lista: Number(req.params.id) } });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    if (lista.id_usuario !== req.usuario!.id_usuario && req.usuario!.tipo_usuario !== 'ADMIN') {
      return res.status(403).json({ message: 'Sem permissão.' });
    }

    const schema = z.object({ nm_lista: z.string().min(2).optional(), descricao: z.string().optional().nullable(), publica: z.boolean().optional() });
    const dados = schema.parse(req.body);
    const atualizada = await prisma.tAB_LISTA.update({ where: { id_lista: lista.id_lista }, data: dados });
    return res.json(atualizada);
  } catch (err) { next(err); }
});

// DELETE /lists/:id — excluir lista
listsRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const lista = await prisma.tAB_LISTA.findUnique({ where: { id_lista: Number(req.params.id) } });
    if (!lista) return res.status(404).json({ message: 'Lista não encontrada.' });

    if (lista.id_usuario !== req.usuario!.id_usuario && req.usuario!.tipo_usuario !== 'ADMIN') {
      return res.status(403).json({ message: 'Sem permissão.' });
    }

    await prisma.tAB_LISTA.delete({ where: { id_lista: lista.id_lista } });
    return res.json({ message: 'Lista excluída.' });
  } catch (err) { next(err); }
});

// POST /lists/:id/games — adicionar jogo
listsRouter.post('/:id/games', authMiddleware, async (req, res, next) => {
  try {
    const id_jogo = Number(req.body.id_jogo);
    if (isNaN(id_jogo)) return res.status(400).json({ message: 'ID do jogo inválido.' });

    await prisma.tAB_LISTA_JOGO.upsert({
      where:  { id_lista_id_jogo: { id_lista: Number(req.params.id), id_jogo } },
      update: {},
      create: { id_lista: Number(req.params.id), id_jogo },
    });
    return res.status(201).json({ message: 'Jogo adicionado.' });
  } catch (err) { next(err); }
});

// DELETE /lists/:id/games/:id_jogo — remover jogo
listsRouter.delete('/:id/games/:id_jogo', authMiddleware, async (req, res, next) => {
  try {
    await prisma.tAB_LISTA_JOGO.deleteMany({
      where: { id_lista: Number(req.params.id), id_jogo: Number(req.params.id_jogo) },
    });
    return res.json({ message: 'Jogo removido.' });
  } catch (err) { next(err); }
});
