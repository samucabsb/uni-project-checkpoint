/**
 * Rotas de Autenticação — v1.6
 * Normalização: nm_usuario e email_usuario em lowercase + trim
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/auth';
import { sanitizeUser } from '../utils/helpers';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const schema = z.object({
      nm_usuario:    z.string().min(3).max(30).regex(/^\S+$/, 'Sem espaços'),
      email_usuario: z.string().email(),
      senha_usuario: z.string().min(6),
    });

    const dados = schema.parse(req.body);

    // Normalização: lowercase + trim para evitar duplicatas case-insensitive
    const nm_usuario    = dados.nm_usuario.toLowerCase().trim();
    const email_usuario = dados.email_usuario.toLowerCase().trim();

    const existente = await prisma.tAB_USUARIO.findFirst({
      where: { OR: [{ nm_usuario }, { email_usuario }] },
    });
    if (existente) {
      const campo = existente.nm_usuario === nm_usuario ? 'usuário' : 'e-mail';
      return res.status(409).json({ message: `Este ${campo} já está em uso.` });
    }

    await prisma.tAB_USUARIO.create({
      data: {
        nm_usuario,
        email_usuario,
        senha_usuario: await bcrypt.hash(dados.senha_usuario, 10),
        img_usuario:   `https://api.dicebear.com/8.x/adventurer/svg?seed=${nm_usuario}`,
      },
    });

    return res.status(201).json({ message: 'Conta criada. Faça login para continuar.' });
  } catch (err) { next(err); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({
      nm_usuario:    z.string().min(1),
      senha_usuario: z.string().min(1),
    });

    const dados   = schema.parse(req.body);
    const usuario = await prisma.tAB_USUARIO.findUnique({
      where: { nm_usuario: dados.nm_usuario.toLowerCase().trim() },
    });

    if (!usuario || !(await bcrypt.compare(dados.senha_usuario, usuario.senha_usuario))) {
      return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
    }

    const token = generateToken({
      id_usuario:   usuario.id_usuario,
      nm_usuario:   usuario.nm_usuario,
      tipo_usuario: usuario.tipo_usuario,
    });

    return res.json({ user: sanitizeUser(usuario as unknown as Record<string, unknown>), token });
  } catch (err) { next(err); }
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const usuario = await prisma.tAB_USUARIO.findUnique({
      where:   { id_usuario: req.usuario!.id_usuario },
      include: { _count: { select: { seguidores: true, seguindo: true, avaliacoes: true, listas: true } } },
    });
    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.json(sanitizeUser(usuario as unknown as Record<string, unknown>));
  } catch (err) { next(err); }
});
