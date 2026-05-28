import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { sanitizeUser, calcMedia } from '../utils/helpers';
import { logAtividade } from '../utils/activities';
import { authMiddleware, optionalAuth, AuthRequest } from '../middlewares/authMiddleware';
import { parseId } from '../utils/validate';

export const usersRouter = Router();

// ── GET /users/search ─────────────────────────────────────
usersRouter.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const users = await prisma.tAB_USUARIO.findMany({
      where:  { nm_usuario: { contains: q } },
      select: { id_usuario: true, nm_usuario: true, img_usuario: true, bio_usuario: true, _count: { select: { avaliacoes: true, seguidores: true } } },
      take:   8,
    });
    return res.json(users);
  } catch (err) { next(err); }
});

// ── GET /users/:id ────────────────────────────────────────
usersRouter.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const usuario = await prisma.tAB_USUARIO.findUnique({
      where:   { id_usuario: id },
      include: {
        avaliacoes: {
          include: { jogo: true, _count: { select: { likes: true, comentarios: true } } },
          orderBy: { created_at: 'desc' },
        },
        listas: {
          where:   { publica: true },
          include: { jogos: { include: { jogo: true }, take: 4, orderBy: { position: 'asc' } }, _count: { select: { likes: true } } },
          orderBy: { created_at: 'desc' },
        },
        status_jogos: {
          include: { jogo: { include: { avaliacoes: { select: { nota: true } } } } },
          orderBy: [{ top_position: 'asc' }],
        },
        _count: { select: { seguidores: true, seguindo: true, avaliacoes: true, listas: true } },
      },
    });

    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const isFollowing = req.usuario
      ? !!(await prisma.tAB_FOLLOW.findFirst({ where: { id_usuario_seguidor: req.usuario.id_usuario, id_usuario_seguido: id } }))
      : false;

    // Estatísticas
    const estatisticas = {
      zerados:     usuario.status_jogos.filter(s => s.status === 'ZERADO').length,
      jogando:     usuario.status_jogos.filter(s => s.status === 'JOGANDO').length,
      quero_jogar: usuario.status_jogos.filter(s => s.status === 'QUERO_JOGAR').length,
      favoritos:   usuario.status_jogos.filter(s => s.favorito).length,
    };

    return res.json({
      ...sanitizeUser(usuario as unknown as Record<string, unknown>),
      isFollowing,
      estatisticas,
      avaliacoes: usuario.avaliacoes.map(a => ({
        ...a,
        likes_count:    a._count.likes,
        comments_count: a._count.comentarios,
      })),
      listas: usuario.listas.map(l => ({ ...l, likes_count: l._count.likes })),
      status_jogos: usuario.status_jogos.map(s => ({
        ...s,
        jogo: calcMedia(s.jogo),
      })),
    });
  } catch (err) { next(err); }
});

// ── POST /users/:id/follow ────────────────────────────────
usersRouter.post('/:id/follow', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;
    if (id === req.usuario!.id_usuario) return res.status(400).json({ message: 'Você não pode se seguir.' });

    const alvo = await prisma.tAB_USUARIO.findUnique({ where: { id_usuario: id } });
    if (!alvo) return res.status(404).json({ message: 'Usuário não encontrado.' });

    await prisma.tAB_FOLLOW.upsert({
      where:  { id_usuario_seguidor_id_usuario_seguido: { id_usuario_seguidor: req.usuario!.id_usuario, id_usuario_seguido: id } },
      update: {},
      create: { id_usuario_seguidor: req.usuario!.id_usuario, id_usuario_seguido: id },
    });

    await logAtividade({
      id_usuario:       req.usuario!.id_usuario,
      tipo:             'SEGUIU_USUARIO',
      id_usuario_alvo:  id,
    });

    return res.status(201).json({ message: 'Seguindo.' });
  } catch (err) { next(err); }
});

// ── DELETE /users/:id/unfollow ────────────────────────────
usersRouter.delete('/:id/unfollow', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    await prisma.tAB_FOLLOW.deleteMany({
      where: { id_usuario_seguidor: req.usuario!.id_usuario, id_usuario_seguido: id },
    });

    return res.json({ message: 'Deixou de seguir.' });
  } catch (err) { next(err); }
});

// ── PUT /users/me ─────────────────────────────────────────
usersRouter.put('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      bio_usuario: z.string().max(300).optional().nullable(),
      img_usuario: z.string().url().optional().nullable(),
      senha_atual: z.string().optional(),
      senha_nova:  z.string().min(6).optional(),
    });

    const dados = schema.parse(req.body);
    const update: Record<string, unknown> = {};

    if ('bio_usuario' in dados) update.bio_usuario = dados.bio_usuario;
    if ('img_usuario' in dados) update.img_usuario = dados.img_usuario;

    if (dados.senha_nova) {
      if (!dados.senha_atual) return res.status(400).json({ message: 'Informe a senha atual.' });
      const usuario = await prisma.tAB_USUARIO.findUnique({ where: { id_usuario: req.usuario!.id_usuario } });
      const ok = await bcrypt.compare(dados.senha_atual, usuario!.senha_usuario);
      if (!ok) return res.status(401).json({ message: 'Senha atual incorreta.' });
      update.senha_usuario = await bcrypt.hash(dados.senha_nova, 10);
    }

    const atualizado = await prisma.tAB_USUARIO.update({
      where: { id_usuario: req.usuario!.id_usuario },
      data:  update,
    });

    return res.json(sanitizeUser(atualizado as unknown as Record<string, unknown>));
  } catch (err) { next(err); }
});

// ── Vitrine ───────────────────────────────────────────────
usersRouter.post('/vitrine', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      id_jogo:      z.number().int().positive(),
      top_position: z.number().int().min(1).max(4),
    });

    const { id_jogo, top_position } = schema.parse(req.body);

    // Remove posição anterior (evita duplicata de posição)
    await prisma.tAB_STATUS_JOGO.updateMany({
      where: { id_usuario: req.usuario!.id_usuario, top_position },
      data:  { top_position: null },
    });

    await prisma.tAB_STATUS_JOGO.upsert({
      where:  { id_usuario_id_jogo: { id_usuario: req.usuario!.id_usuario, id_jogo } },
      update: { top_position, favorito: true },
      create: { id_usuario: req.usuario!.id_usuario, id_jogo, top_position, favorito: true, status: 'ZERADO' },
    });

    await logAtividade({ id_usuario: req.usuario!.id_usuario, tipo: 'FAVORITOU_JOGO', id_jogo });

    return res.status(201).json({ message: 'Vitrine atualizada.' });
  } catch (err) { next(err); }
});

usersRouter.delete('/vitrine/:position', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const position = Number(req.params.position);
    if (!Number.isInteger(position) || position < 1 || position > 4) {
      return res.status(400).json({ message: 'Posição inválida (1-4).' });
    }

    await prisma.tAB_STATUS_JOGO.updateMany({
      where: { id_usuario: req.usuario!.id_usuario, top_position: position },
      data:  { top_position: null },
    });

    return res.json({ message: 'Jogo removido da vitrine.' });
  } catch (err) { next(err); }
});

// ── DELETE /users/me — excluir conta ─────────────────────
usersRouter.delete('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await prisma.tAB_USUARIO.delete({ where: { id_usuario: req.usuario!.id_usuario } });
    return res.json({ message: 'Conta excluída.' });
  } catch (err) { next(err); }
});
