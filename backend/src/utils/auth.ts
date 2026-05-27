import jwt from 'jsonwebtoken';

export type TokenPayload = {
  id_usuario:   number;
  nm_usuario:   string;
  tipo_usuario: string;
};

// Gera um token JWT com os dados do usuário
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
}

// Verifica e decodifica um token JWT
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET || 'secret') as TokenPayload;
}
