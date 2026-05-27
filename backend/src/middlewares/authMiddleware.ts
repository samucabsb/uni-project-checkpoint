/**
 * Middlewares de autenticação
 *
 * authMiddleware     — exige token válido (retorna 401 se ausente/inválido)
 * optionalAuth       — lê token se presente, mas não falha se ausente
 * adminMiddleware    — exige tipo_usuario === 'ADMIN'
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';

export interface AuthRequest extends Request {
  usuario?: TokenPayload;
}

// Extrai e valida o Bearer token do header Authorization
function extractToken(req: AuthRequest): TokenPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;

  const token = header.split(' ')[1];
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

// Exige autenticação — retorna 401 se token ausente ou inválido
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const usuario = extractToken(req);
  if (!usuario) {
    return res.status(401).json({ message: 'Faça login para continuar.' });
  }
  req.usuario = usuario;
  next();
}

// Auth opcional — não falha se não houver token
// Útil para rotas públicas que se comportam diferente para logados
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  req.usuario = extractToken(req) ?? undefined;
  next();
}

// Exige tipo ADMIN — deve ser usado após authMiddleware
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.usuario?.tipo_usuario !== 'ADMIN') {
    return res.status(403).json({ message: 'Ação permitida apenas para administradores.' });
  }
  next();
}
