/**
 * Rotas de Usuários — v1.5
 * Perfil público com auth opcional (isFollowing só para logados)
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sanitizeUser } from '../utils/helpers';
import { authMiddleware, adminMiddleware, optionalAuth, AuthRequest } from '../middlewares/authMiddleware';
import { parseId } from '../utils/validate';

export const usersRouter = Router();

// ── GET /users/search — busca pública ─────────────────────
usersRouter.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const usuarios = await prisma.tAB_USUARIO.findMany({
      where:   { nm_usuario: { contains: q } },
      select: {
        id_usuario:   true, nm_usuario:   true,
        img_usuario:  true, bio_usuario:  true, tipo_usuario: true,
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
    return res.json(usuarios.map(u => sanitizeUser(u as unknown as Record<string, unknown>)));
  } catch (err) { next(err); }
});

// ── GET /users/:id — perfil público com auth opcional ─────
// v1.5: não exige login; isFollowing calculado apenas quando logado
usersRouter.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const usuario = await prisma.tAB_USUARIO.findUnique({
      where:   { id_usuario: id },
      include: {
        avaliacoes: {
          include: {
            jogo: { include: { avaliacoes: { select: { nota: true } } } },
            _count: { select: { likes: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        listas: {
          where:   req.usuario?.id_usuario === id ? {} : { publica: true }, // dono vê tudo
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

    // isFollowing só calculado quando há usuário logado e não é o próprio perfil
    let isFollowing = false;
    if (req.usuario && req.usuario.id_usuario !== id) {
      isFollowing = !!(await prisma.tAB_FOLLOW.findUnique({
        where: {
          id_usuario_seguidor_id_usuario_seguido: {
            id_usuario_seguidor: req.usuario.id_usuario,
            id_usuario_seguido:  id,
          },
        },
      }));
    }

    // Estatísticas da biblioteca
    const stats = await prisma.tAB_STATUS_JOGO.groupBy({
      by:    ['status'],
      where: { id_usuario: id },
      _count: true,
    });

    const estatisticas = {
      zerados:     stats.find(s => s.status === 'ZERADO')?._count      || 0,
      jogando:     stats.find(s => s.status === 'JOGANDO')?._count     || 0,
      quero_jogar: stats.find(s => s.status === 'QUERO_JOGAR')?._count || 0,
      favoritos:   await prisma.tAB_STATUS_JOGO.count({ where: { id_usuario: id, favorito: true } }),
    };

    return res.json({
      ...sanitizeUser(usuario as unknown as Record<string, unknown>),
      isFollowing,
      estatisticas,
    });
  } catch (err) { next(err); }
});

// ── GET /users/:id/followers ──────────────────────────────
usersRouter.get('/:id/followers', optionalAuth, async (req, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const follows = await prisma.tAB_FOLLOW.findMany({
      where:   { id_usuario_seguido: id },
      include: {
        seguidor: {
          select: {
            id_usuario: true, nm_usuario: true, img_usuario: true, bio_usuario: true,
            _count: { select: { avaliacoes: true, seguidores: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json(follows.map(f => f.seguidor));
  } catch (err) { next(err); }
});

// ── GET /users/:id/following ──────────────────────────────
usersRouter.get('/:id/following', optionalAuth, async (req, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const follows = await prisma.tAB_FOLLOW.findMany({
      where:   { id_usuario_seguidor: id },
      include: {
        seguido: {
          select: {
            id_usuario: true, nm_usuario: true, img_usuario: true, bio_usuario: true,
            _count: { select: { avaliacoes: true, seguidores: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json(follows.map(f => f.seguido));
  } catch (err) { next(err); }
});

// ── PUT /users/:id ────────────────────────────────────────
usersRouter.put('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id      = parseId(req.params.id, res);
    if (id === null) return;
    const isAdmin = req.usuario!.tipo_usuario === 'ADMIN';

    if (req.usuario!.id_usuario !== id && !isAdmin) {
      return res.status(403).json({ message: 'Sem permissão para editar este perfil.' });
    }

    const schema = z.object({
      nm_usuario:    z.string().min(3).max(30).regex(/^\S+$/).optional(),
      email_usuario: z.string().email().optional(),
      bio_usuario:   z.string().max(200).optional().nullable(),
      img_usuario:   z.string().url().optional().nullable().or(z.literal('')).optional().nullable(),
      senha_usuario: z.string().min(6).optional(),
    });

    const dados  = schema.parse(req.body);
    const update: Record<string, unknown> = { ...dados };
    if (dados.senha_usuario) update.senha_usuario = await bcrypt.hash(dados.senha_usuario, 10);
    if (!isAdmin) delete update.tipo_usuario;

    const atualizado = await prisma.tAB_USUARIO.update({ where: { id_usuario: id }, data: update });
    return res.json(sanitizeUser(atualizado as unknown as Record<string, unknown>));
  } catch (err) { next(err); }
});

// ── DELETE /users/:id ─────────────────────────────────────
usersRouter.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;
    if (req.usuario!.id_usuario === id) {
      return res.status(400).json({ message: 'Você não pode excluir sua própria conta.' });
    }
    const usuario = await prisma.tAB_USUARIO.findUnique({ where: { id_usuario: id } });
    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });

    await prisma.tAB_USUARIO.delete({ where: { id_usuario: id } });
    return res.json({ message: 'Usuário excluído.' });
  } catch (err) { next(err); }
});

// ── POST /users/:id/follow ────────────────────────────────
usersRouter.post('/:id/follow', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const alvo = parseId(req.params.id, res);
    if (alvo === null) return;
    if (alvo === req.usuario!.id_usuario) {
      return res.status(400).json({ message: 'Você não pode seguir a si mesmo.' });
    }
    const alvoExiste = await prisma.tAB_USUARIO.findUnique({ where: { id_usuario: alvo } });
    if (!alvoExiste) return res.status(404).json({ message: 'Usuário não encontrado.' });

    await prisma.tAB_FOLLOW.upsert({
      where: {
        id_usuario_seguidor_id_usuario_seguido: {
          id_usuario_seguidor: req.usuario!.id_usuario, id_usuario_seguido: alvo,
        },
      },
      update: {},
      create: { id_usuario_seguidor: req.usuario!.id_usuario, id_usuario_seguido: alvo },
    });
    return res.status(201).json({ message: 'Agora você está seguindo.' });
  } catch (err) { next(err); }
});

// ── DELETE /users/:id/follow ──────────────────────────────
usersRouter.delete('/:id/follow', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const alvo = parseId(req.params.id, res);
    if (alvo === null) return;
    await prisma.tAB_FOLLOW.deleteMany({
      where: { id_usuario_seguidor: req.usuario!.id_usuario, id_usuario_seguido: alvo },
    });
    return res.json({ message: 'Você deixou de seguir.' });
  } catch (err) { next(err); }
});

// ── PUT /users/:id/tipo — promover/rebaixar (admin) ───────
usersRouter.put('/:id/tipo', authMiddleware, adminMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;
    if (req.usuario!.id_usuario === id) {
      return res.status(400).json({ message: 'Você não pode alterar sua própria permissão.' });
    }
    const alvo = await prisma.tAB_USUARIO.findUnique({ where: { id_usuario: id } });
    if (!alvo) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const { tipo_usuario } = req.body as { tipo_usuario: string };
    if (!['USER', 'ADMIN'].includes(tipo_usuario)) {
      return res.status(400).json({ message: 'Tipo inválido. Use USER ou ADMIN.' });
    }
    const u = await prisma.tAB_USUARIO.update({ where: { id_usuario: id }, data: { tipo_usuario } });
    return res.json({ message: 'Permissão alterada.', tipo_usuario: u.tipo_usuario });
  } catch (err) { next(err); }
});
