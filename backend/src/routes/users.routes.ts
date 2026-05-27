/**
 * Rotas de Usuários
 * GET  /api/users/search  — busca pública por nome (novo na v1.4)
 * GET  /api/users         — listar todos (admin)
 * GET  /api/users/:id     — perfil completo
 * PUT  /api/users/:id     — editar perfil
 * DELETE /api/users/:id   — excluir (admin)
 * POST /api/users/:id/follow   — seguir
 * DELETE /api/users/:id/follow — deixar de seguir
 * PUT  /api/users/:id/tipo     — promover/rebaixar (admin)
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sanitize } from '../utils/helpers';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/authMiddleware';

export const usersRouter = Router();

// ── GET /users/search — busca pública ─────────────────────
// ROTA NOVA v1.4: permite encontrar usuários pelo nome de usuário
// Precisa estar ANTES de /:id para não ser capturada como parâmetro
usersRouter.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const usuarios = await prisma.tAB_USUARIO.findMany({
      where:   { nm_usuario: { contains: q } },
      select:  {
        id_usuario:   true,
        nm_usuario:   true,
        img_usuario:  true,
        bio_usuario:  true,
        tipo_usuario: true,
        _count: { select: { avaliacoes: true, seguidores: true } },
      },
      orderBy: { nm_usuario: 'asc' },
      take:    8,
    });

    return res.json(usuarios);
  } catch (err) { next(err); }
});

// ── GET /users — listar todos (admin) ─────────────────────
usersRouter.get('/', authMiddleware, adminMiddleware, async (_req, res, next) => {
  try {
    const usuarios = await prisma.tAB_USUARIO.findMany({
      include:  { _count: { select: { seguidores: true, seguindo: true, avaliacoes: true, listas: true } } },
      orderBy:  { created_at: 'desc' },
    });
    return res.json(usuarios.map(u => sanitize(u as unknown as Record<string, unknown>)));
  } catch (err) { next(err); }
});

// ── GET /users/:id — perfil completo ─────────────────────
usersRouter.get('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });

    const usuario = await prisma.tAB_USUARIO.findUnique({
      where:   { id_usuario: id },
      include: {
        avaliacoes: {
          include: { jogo: { include: { avaliacoes: { select: { nota: true } } } } },
          orderBy: { created_at: 'desc' },
        },
        listas: {
          include: { jogos: { include: { jogo: true }, take: 5 } },
          orderBy: { created_at: 'desc' },
        },
        status_jogos: {
          include: { jogo: { include: { avaliacoes: { select: { nota: true } } } } },
          orderBy: { updated_at: 'desc' },
        },
        _count: { select: { seguidores: true, seguindo: true, avaliacoes: true, listas: true } },
      },
    });

    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const isFollowing = req.usuario!.id_usuario !== id
      ? !!(await prisma.tAB_FOLLOW.findUnique({
          where: {
            id_usuario_seguidor_id_usuario_seguido: {
              id_usuario_seguidor: req.usuario!.id_usuario,
              id_usuario_seguido:  id,
            },
          },
        }))
      : false;

    return res.json({
      ...sanitize(usuario as unknown as Record<string, unknown>),
      isFollowing,
    });
  } catch (err) { next(err); }
});

// ── PUT /users/:id — editar perfil ────────────────────────
usersRouter.put('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id      = Number(req.params.id);
    const isAdmin = req.usuario!.tipo_usuario === 'ADMIN';

    if (req.usuario!.id_usuario !== id && !isAdmin) {
      return res.status(403).json({ message: 'Sem permissão para editar este perfil.' });
    }

    const schema = z.object({
      nm_usuario:    z.string().min(3).max(30).regex(/^\S+$/, 'Sem espaços').optional(),
      email_usuario: z.string().email().optional(),
      bio_usuario:   z.string().max(200).optional().nullable(),
      img_usuario:   z.string().optional().nullable(),
      senha_usuario: z.string().min(6).optional(),
    });

    const dados  = schema.parse(req.body);
    const update: Record<string, unknown> = { ...dados };

    if (dados.senha_usuario) {
      update.senha_usuario = await bcrypt.hash(dados.senha_usuario, 10);
    }
    if (!isAdmin) delete update.tipo_usuario;

    const atualizado = await prisma.tAB_USUARIO.update({
      where: { id_usuario: id },
      data:  update,
    });
    return res.json(sanitize(atualizado as unknown as Record<string, unknown>));
  } catch (err) { next(err); }
});

// ── DELETE /users/:id — excluir (admin) ───────────────────
usersRouter.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (req.usuario!.id_usuario === id) {
      return res.status(400).json({ message: 'Você não pode excluir sua própria conta.' });
    }
    await prisma.tAB_USUARIO.delete({ where: { id_usuario: id } });
    return res.json({ message: 'Usuário excluído.' });
  } catch (err) { next(err); }
});

// ── POST /users/:id/follow ────────────────────────────────
usersRouter.post('/:id/follow', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const alvo = Number(req.params.id);
    if (alvo === req.usuario!.id_usuario) {
      return res.status(400).json({ message: 'Você não pode seguir a si mesmo.' });
    }
    await prisma.tAB_FOLLOW.upsert({
      where:  {
        id_usuario_seguidor_id_usuario_seguido: {
          id_usuario_seguidor: req.usuario!.id_usuario,
          id_usuario_seguido:  alvo,
        },
      },
      update: {},
      create: { id_usuario_seguidor: req.usuario!.id_usuario, id_usuario_seguido: alvo },
    });
    return res.status(201).json({ message: 'Agora você está seguindo este usuário.' });
  } catch (err) { next(err); }
});

// ── DELETE /users/:id/follow ──────────────────────────────
usersRouter.delete('/:id/follow', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await prisma.tAB_FOLLOW.deleteMany({
      where: {
        id_usuario_seguidor: req.usuario!.id_usuario,
        id_usuario_seguido:  Number(req.params.id),
      },
    });
    return res.json({ message: 'Você deixou de seguir.' });
  } catch (err) { next(err); }
});

// ── PUT /users/:id/tipo — promover/rebaixar (admin) ───────
usersRouter.put('/:id/tipo', authMiddleware, adminMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (req.usuario!.id_usuario === id) {
      return res.status(400).json({ message: 'Você não pode alterar sua própria permissão.' });
    }

    const { tipo_usuario } = req.body as { tipo_usuario: string };
    if (!['USER', 'ADMIN'].includes(tipo_usuario)) {
      return res.status(400).json({ message: 'Tipo inválido. Use USER ou ADMIN.' });
    }

    const u = await prisma.tAB_USUARIO.update({
      where: { id_usuario: id },
      data:  { tipo_usuario },
    });
    return res.json({ message: 'Permissão alterada.', tipo_usuario: u.tipo_usuario });
  } catch (err) { next(err); }
});
