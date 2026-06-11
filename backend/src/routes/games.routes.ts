/**
 * Rotas de Jogos — v1.10.4
 *
 * NOVIDADES v1.10:
 *   - GET / e GET /search agora adicionam jobs na fila de paralelismo
 *   - Logs de concorrência nas rotas principais
 *   - Sem quebra nas funcionalidades existentes
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { calcMedia } from '../utils/helpers';
import { logAtividade } from '../utils/activities';
import { authMiddleware, adminMiddleware, optionalAuth, AuthRequest } from '../middlewares/authMiddleware';
import { parseId, clamp } from '../utils/validate';
import { addSearchJob, type SearchJob } from '../queue/searchQueue';

export const gamesRouter = Router();

function enqueueSearchMetric(job: SearchJob): void {
  void addSearchJob(job).catch(error => {
    console.error('[QUEUE] Falha ao persistir job de busca:', error);
  });
}


const jogoSchema = z.object({
  nm_jogo:       z.string().min(2).max(100),
  img_jogo:      z.string().url('URL inválida'),
  genero:        z.string().max(50).optional().nullable(),
  plataforma:    z.string().max(100).optional().nullable(),
  classificacao: z.string().max(10).optional().nullable(),
  jogadores:     z.string().max(50).optional().nullable(),
  descricao:     z.string().max(2000).optional().nullable(),
  dt_jogo:       z.string().refine(v => !isNaN(Date.parse(v)), 'Data inválida'),
});

// ── GET /games ────────────────────────────────────────────
gamesRouter.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
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
      orderBy: (orderByMap[sort] ?? { nm_jogo: 'asc' }) as { [key: string]: 'asc' | 'desc' },
      take:    clamp(Number(take) || 60, 1, 100),
    });

    const comMedia = jogos.map(calcMedia);
    if (sort === 'melhor')        comMedia.sort((a, b) => (b.media || 0) - (a.media || 0));
    if (sort === 'mais_avaliado') comMedia.sort((a, b) => (b.total_avaliacoes || 0) - (a.total_avaliacoes || 0));

    res.json(comMedia);

    // ── PARALELISMO v1.10.4 ───────────────────────────────
    // A resposta HTTP já foi enviada; a métrica é apenas enfileirada.
    // O worker separado consome TAB_FILA_BUSCA em background.
    if (search.trim().length >= 2) {
      enqueueSearchMetric({
        termo:      search.trim(),
        id_usuario: req.usuario?.id_usuario ?? null,
        resultados: comMedia.length,
        created_at: new Date(),
      });
    }

    return;
  } catch (err) { next(err); }
});

// ── GET /games/search ─────────────────────────────────────
gamesRouter.get('/search', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const jogos = await prisma.tAB_JOGOS.findMany({
      where:   { nm_jogo: { contains: q } },
      include: { avaliacoes: { select: { nota: true } } },
      take:    6,
    });

    const resultado = jogos.map(j => { const { avaliacoes: _, ...rest } = calcMedia(j); return rest; });

    res.json(resultado);

    // ── PARALELISMO v1.10.4 ───────────────────────────────
    // Enfileira a métrica sem bloquear a resposta da busca.
    enqueueSearchMetric({
      termo:      q,
      id_usuario: req.usuario?.id_usuario ?? null,
      resultados: resultado.length,
      created_at: new Date(),
    });

    return;
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

// ── GET /games/:id — com optionalAuth para minha_reacao ──
gamesRouter.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const id = parseId(req.params.id, res);
    if (id === null) return;

    const jogo = await prisma.tAB_JOGOS.findUnique({
      where:   { id_jogo: id },
      include: {
        avaliacoes: {
          include: {
            usuario: { select: { id_usuario: true, nm_usuario: true, img_usuario: true } },
            _count:  { select: { reacoes: true, comentarios: true } },
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

    // Reações do usuário logado para as avaliações deste jogo
    const avIds = jogo.avaliacoes.map(a => a.id_avaliacao);
    const reacoesMap = new Map<number, string>();
    const dislikeMap = new Map<number, number>();
    const likeMap    = new Map<number, number>();

    if (avIds.length > 0) {
      const todasReacoes = await prisma.tAB_REACAO_REVIEW.findMany({
        where:  { id_avaliacao: { in: avIds } },
        select: { id_avaliacao: true, id_usuario: true, tipo: true },
      });

      todasReacoes.forEach(r => {
        if (r.tipo === 'LIKE')    likeMap.set(r.id_avaliacao,    (likeMap.get(r.id_avaliacao)    ?? 0) + 1);
        if (r.tipo === 'DISLIKE') dislikeMap.set(r.id_avaliacao, (dislikeMap.get(r.id_avaliacao) ?? 0) + 1);
        if (req.usuario && r.id_usuario === req.usuario.id_usuario) {
          reacoesMap.set(r.id_avaliacao, r.tipo);
        }
      });
    }

    return res.json({
      ...calcMedia(jogo),
      distribuicao_notas: distribuicao,
      listas_com_jogo:    listasComJogo,
      avaliacoes: jogo.avaliacoes.map(a => ({
        ...a,
        likes_count:    likeMap.get(a.id_avaliacao)    ?? 0,
        dislikes_count: dislikeMap.get(a.id_avaliacao) ?? 0,
        comments_count: a._count.comentarios,
        minha_reacao:   reacoesMap.get(a.id_avaliacao) ?? null,
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
      data: {
        nm_jogo:       dados.nm_jogo,
        img_jogo:      dados.img_jogo,
        genero:        dados.genero ?? null,
        plataforma:    dados.plataforma ?? null,
        classificacao: dados.classificacao ?? null,
        jogadores:     dados.jogadores ?? null,
        descricao:     dados.descricao ?? null,
        dt_jogo:       new Date(dados.dt_jogo),
        id_usuario:    req.usuario!.id_usuario,
      },
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
