/**
 * Servidor Express — Checkpoint v1.5
 * SQLite local via Prisma — sem Docker
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { routes } from './routes';
import { errorMiddleware } from './middlewares/errorMiddleware';

// ── Validação obrigatória de variáveis de ambiente ────────
// Impede o servidor de subir sem JWT_SECRET configurado
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 20) {
  console.error('\n❌ ERRO: JWT_SECRET não configurado ou muito curto no .env\n');
  console.error('   Configure JWT_SECRET com pelo menos 20 caracteres.\n');
  process.exit(1);
}

const app  = express();
const PORT = Number(process.env.PORT) || 3333;

// ── Segurança ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limit geral: 200 req/min por IP
app.use(rateLimit({ windowMs: 60_000, limit: 200 }));

// Rate limit específico para login: 10 tentativas/min por IP
// Evita ataques de força bruta em /auth/login
const loginRateLimit = rateLimit({
  windowMs: 60_000,
  limit:    10,
  message:  { message: 'Muitas tentativas de login. Tente novamente em 1 minuto.' },
});
app.use('/api/auth/login', loginRateLimit);

// ── Parsers ───────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ── Rotas ─────────────────────────────────────────────────
app.use('/api', routes);

// ── Handler global de erros (deve ser o último) ───────────
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`\n🎮 Checkpoint API v1.5`);
  console.log(`   URL:    http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
