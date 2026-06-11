/**
 * Servidor Express — Checkpoint v1.10.4
 *
 * Novidades v1.10.4:
 *   - API não inicia mais o worker automaticamente.
 *   - Worker de busca roda em processo separado: npm run dev:worker.
 *   - /api/queue/stats monitora a fila persistente TAB_FILA_BUSCA.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { routes } from './routes';
import { errorMiddleware } from './middlewares/errorMiddleware';
import { getQueueStats } from './queue/searchQueue';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 20) {
  console.error(`
❌ ERRO: JWT_SECRET não configurado ou muito curto no .env
`);
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3333;

// ── Segurança ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limit geral: 200 req/min por IP
app.use(rateLimit({ windowMs: 60_000, limit: 200 }));

// Rate limit para login: 10 tentativas/min por IP
const loginRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  message: { message: 'Muitas tentativas de login. Tente novamente em 1 minuto.' },
});
app.use('/api/auth/login', loginRateLimit);

// ── Parsers ───────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// ── Rotas ─────────────────────────────────────────────────
app.use('/api', routes);

// ── Diagnóstico da fila persistente ───────────────────────
app.get('/api/queue/stats', async (_req, res, next) => {
  try {
    res.json({
      ...(await getQueueStats()),
      timestamp: new Date().toISOString(),
      descricao: 'Estatísticas da fila persistente TAB_FILA_BUSCA processada por worker separado',
    });
  } catch (err) {
    next(err);
  }
});

// ── Handler global de erros (deve ser o último) ───────────
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`
🎮 Checkpoint API v1.10.4`);
  console.log(`   URL:        http://localhost:${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/api/health`);
  console.log(`   Fila stats: http://localhost:${PORT}/api/queue/stats`);
  console.log(`
📐 Arquitetura:`);
  console.log(`   Frontend → Express API → Prisma → SQLite`);
  console.log(`                         ↓`);
  console.log(`                  TAB_FILA_BUSCA (fila persistente)`);
  console.log(`                         ↓`);
  console.log(`          SearchWorker (processo separado: npm run dev:worker)`);
  console.log(`                         ↓`);
  console.log(`                  TAB_BUSCA_JOGO (métricas)
`);
});
