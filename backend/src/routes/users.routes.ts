/**
 * Rotas de Usuários — v1.9
 * MUDANÇA v1.9: Biblioteca removida.
 *   - status_jogos retorna apenas itens da vitrine (top_position ≠ null)
 *   - _count inclui diario (sessões do diário)
 *   - estatisticas removidas (eram baseadas na biblioteca)
 *   - vitrine renomeada na resposta
 * FIX v1.9: minha_reacao, likes_count e dislikes_count corretos nas avaliações
 */

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
      select: {
        id_usuario:  true, nm_usuario: true, img_usuario: true, bio_usuario: true,
        _count:      { select: { avaliacoes: true, seguidores: true } },
      },
      take: 8,
    });
    return res.json(users);
  } catch (err) { next(err); }
});

// ── PUT /users/me — atualizar perfil ─────────────────────
usersRouter.put('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      bio_usuario: z.string().max(300).optional().nullable(),
      img_usuario: z.union([
        z.string().url('Informe uma URL válida para o avatar.'),
        z.literal(''),
        z.null(),
      ]).optional(),
      senha_atual: z.string().optional(),
      senha_nova:  z.string().min(6, 'Senha precisa de pelo menos 6 caracteres.').optional(),
    });

    const dados = schema.parse(req.body);
    const update: Record<string, unknown> = {};

    if ('bio_usuario' in dados) update.bio_usuario = dados.bio_usuario ?? null;
    if ('img_usuario' in dados) {
      update.img_usuario = dados.img_usuario === '' ? null : (dados.img_usuario ?? null);
    }

    if (dados.senha_nova) {
      if (!dados.senha_atual) return res.status(400).json({ message: 'Informe a senha atual para alterar.' });
      const usuario = await prisma.tAB_USUARIO.findUnique({ where: { id_usuario: req.usuario!.id_usuario } });
      const ok = await bcrypt.compare(dados.senha_atual, usuario!.senha_usuario);
      if (!ok) return res.status(401).json({ message: 'Senha atual incorreta.' });
      update.senha_usuario = await bcrypt.hash(dados.senha_nova, 10);
    }

    if (Object.keys(update).length === 0)
      return res.status(400).json({ message: 'Nenhum campo para atualizar.' });

    const atualizado = await prisma.tAB_USUARIO.update({
      where: { id_usuario: req.usuario!.id_usuario },
      data:  update,
    });

    return res.json(sanitizeUser(atualizado as unknown as Record<string, unknown>));
  } catch (err) { next(err); }
});

// ── DELETE /users/me ──────────────────────────────────────
usersRouter.delete('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await prisma.tAB_USUARIO.delete({ where: { id_usuario: req.usuario!.id_usuario } });
    return res.json({ message: 'Conta excluída.' });
  } catch (err) { next(err); }
});

// ── POST /users/vitrine — definir Top 4 ──────────────────
usersRouter.post('/vitrine', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      id_jogo:      z.number().int().positive(),
      top_position: z.number().int().min(1).max(4),
    });
    const { id_jogo, top_position } = schema.parse(req.body);

    const jogo = await prisma.tAB_JOGOS.findUnique({ where: { id_jogo } });
    if (!jogo) return res.status(404).json({ message: 'Jogo não encontrado.' });

    await prisma.tAB_STATUS_JOGO.updateMany({
      where: { id_usuario: req.usuario!.id_usuario, top_position },
      data:  { top_position: null },
    });

    await prisma.tAB_STATUS_JOGO.upsert({
      where:  { id_usuario_id_jogo: { id_usuario: req.usuario!.id_usuario, id_jogo } },
      update: { top_position, favorito: true },
      create: { id_usuario: req.usuario!.id_usuario, id_jogo, top_position, favorito: true, status: 'QUERO_JOGAR' },
    });

    await logAtividade({ id_usuario: req.usuario!.id_usuario, tipo: 'FAVORITOU_JOGO', id_jogo });
    return res.status(201).json({ message: 'Vitrine atualizada.' });
  } catch (err) { next(err); }
});

// ── DELETE /users/vitrine/:position ──────────────────────
usersRouter.delete('/vitrine/:position', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const position = Number(req.params.position);
    if (!Number.isInteger(position) || position < 1 || position > 4)
      return res.status(400).json({ message: 'Posição inválida. Use 1, 2, 3 ou 4.' });

    await prisma.tAB_STATUS_JOGO.updateMany({
      where: { id_usuario: req.usuario!.id_usuario, top_position: position },
      data:  { top_position: null },
    });
    return res.json({ message: 'Jogo removido da vitrine.' });
  } catch (err) { next(err); }
});

// ── GET /users/:id — perfil público ──────────────────────
usersRouter.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const usuario = await prisma.tAB_USUARIO.findUnique({
      where:   { id_usuario: id },
      include: {
        avaliacoes: {
          include: {
            jogo:    true,
            usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
            _count:  { select: { reacoes: true, comentarios: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        listas: {
          where:   { publica: true },
          include: {
            jogos:  { include: { jogo: true }, take: 4, orderBy: { position: 'asc' } },
            _count: { select: { likes: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        // Apenas itens da vitrine (top_position definido)
        status_jogos: {
          where:   { top_position: { not: null } },
          include: { jogo: { include: { avaliacoes: { select: { nota: true } } } } },
          orderBy: [{ top_position: 'asc' }],
        },
        _count: {
          select: {
            seguidores: true,
            seguindo:   true,
            avaliacoes: true,
            listas:     true,
            diario:     true,  // contagem de sessões do diário
          },
        },
      },
    });

    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const isFollowing = req.usuario
      ? !!(await prisma.tAB_FOLLOW.findFirst({
          where: { id_usuario_seguidor: req.usuario.id_usuario, id_usuario_seguido: id },
        }))
      : false;

    // Busca todas as reações das avaliações deste perfil em 1 query
    const avIds = usuario.avaliacoes.map(a => a.id_avaliacao);
    const likeMap    = new Map<number, number>();
    const dislikeMap = new Map<number, number>();
    const meusReacoes = new Map<number, string>();

    if (avIds.length > 0) {
      const todasReacoes = await prisma.tAB_REACAO_REVIEW.findMany({
        where:  { id_avaliacao: { in: avIds } },
        select: { id_avaliacao: true, id_usuario: true, tipo: true },
      });
      todasReacoes.forEach(r => {
        if (r.tipo === 'LIKE')    likeMap.set(r.id_avaliacao,    (likeMap.get(r.id_avaliacao)    ?? 0) + 1);
        if (r.tipo === 'DISLIKE') dislikeMap.set(r.id_avaliacao, (dislikeMap.get(r.id_avaliacao) ?? 0) + 1);
        if (req.usuario && r.id_usuario === req.usuario.id_usuario)
          meusReacoes.set(r.id_avaliacao, r.tipo);
      });
    }

    return res.json({
      ...sanitizeUser(usuario as unknown as Record<string, unknown>),
      isFollowing,
      avaliacoes: usuario.avaliacoes.map(a => ({
        ...a,
        likes_count:    likeMap.get(a.id_avaliacao)    ?? 0,
        dislikes_count: dislikeMap.get(a.id_avaliacao) ?? 0,
        comments_count: a._count.comentarios,
        minha_reacao:   meusReacoes.get(a.id_avaliacao) ?? null,
      })),
      listas:  usuario.listas.map(l => ({ ...l, likes_count: l._count.likes })),
      vitrine: usuario.status_jogos.map(s => ({ ...s, jogo: calcMedia(s.jogo) })),
    });
  } catch (err) { next(err); }
});

// ── POST /users/:id/follow ────────────────────────────────
usersRouter.post('/:id/follow', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;
    if (id === req.usuario!.id_usuario)
      return res.status(400).json({ message: 'Você não pode seguir a si mesmo.' });

    const alvo = await prisma.tAB_USUARIO.findUnique({ where: { id_usuario: id } });
    if (!alvo) return res.status(404).json({ message: 'Usuário não encontrado.' });

    await prisma.tAB_FOLLOW.upsert({
      where:  { id_usuario_seguidor_id_usuario_seguido: { id_usuario_seguidor: req.usuario!.id_usuario, id_usuario_seguido: id } },
      update: {},
      create: { id_usuario_seguidor: req.usuario!.id_usuario, id_usuario_seguido: id },
    });

    await logAtividade({ id_usuario: req.usuario!.id_usuario, tipo: 'SEGUIU_USUARIO', id_usuario_alvo: id });
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
