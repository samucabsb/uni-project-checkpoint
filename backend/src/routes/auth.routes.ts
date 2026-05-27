/**
 * Rotas de autenticação
 * POST /api/auth/register — criar conta
 * POST /api/auth/login    — entrar com usuário e senha
 * GET  /api/auth/me       — retorna o usuário logado
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/auth';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { sanitize } from '../utils/helpers';

export const authRouter = Router();

// ── POST /auth/register ───────────────────────────────────
authRouter.post('/register', async (req, res, next) => {
  try {
    const schema = z.object({
      nm_usuario:    z.string().min(3, 'Mínimo 3 caracteres').max(30).regex(/^\S+$/, 'Sem espaços'),
      email_usuario: z.string().email('E-mail inválido'),
      senha_usuario: z.string().min(6, 'Mínimo 6 caracteres'),
    });

    const dados = schema.parse(req.body);

    const existente = await prisma.tAB_USUARIO.findFirst({
      where: { OR: [{ nm_usuario: dados.nm_usuario }, { email_usuario: dados.email_usuario }] },
    });
    if (existente) {
      const campo = existente.nm_usuario === dados.nm_usuario ? 'usuário' : 'e-mail';
      return res.status(409).json({ message: `Este ${campo} já está em uso.` });
    }

    await prisma.tAB_USUARIO.create({
      data: {
        nm_usuario:    dados.nm_usuario,
        email_usuario: dados.email_usuario,
        senha_usuario: await bcrypt.hash(dados.senha_usuario, 10),
        img_usuario:   `https://api.dicebear.com/8.x/adventurer/svg?seed=${dados.nm_usuario}`,
      },
    });

    return res.status(201).json({ message: 'Conta criada com sucesso. Faça login para continuar.' });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/login ──────────────────────────────────────
authRouter.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({
      nm_usuario:    z.string().min(1),
      senha_usuario: z.string().min(1),
    });

    const dados   = schema.parse(req.body);
    const usuario = await prisma.tAB_USUARIO.findUnique({ where: { nm_usuario: dados.nm_usuario } });

    // Mensagem genérica para não vazar qual campo está errado
    if (!usuario || !(await bcrypt.compare(dados.senha_usuario, usuario.senha_usuario))) {
      return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
    }

    const token = generateToken({
      id_usuario:   usuario.id_usuario,
      nm_usuario:   usuario.nm_usuario,
      tipo_usuario: usuario.tipo_usuario,
    });

    return res.json({ user: sanitize(usuario as unknown as Record<string, unknown>), token });
  } catch (err) {
    next(err);
  }
});

// ── GET /auth/me ──────────────────────────────────────────
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const usuario = await prisma.tAB_USUARIO.findUnique({
      where:   { id_usuario: req.usuario!.id_usuario },
      include: { _count: { select: { seguidores: true, seguindo: true, avaliacoes: true, listas: true } } },
    });

    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });

    return res.json(sanitize(usuario as unknown as Record<string, unknown>));
  } catch (err) {
    next(err);
  }
});
