/**
 * Servidor Express — Checkpoint v1.10
 *
 * Novidades v1.10:
 *   - Worker de busca paralelo iniciado na startup
 *   - Logs de arquitetura no console
 *   - Rota /api/queue/stats para monitorar fila ao vivo
 */

import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import rateLimit from 'express-rate-limit';
import { routes }            from './routes';
import { errorMiddleware }   from './middlewares/errorMiddleware';
import { startSearchWorker } from './workers/searchWorker';
import { getQueueStats }     from './queue/searchQueue';

// ── Validação obrigatória de variáveis de ambiente ────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 20) {
  console.error('\n❌ ERRO: JWT_SECRET não configurado ou muito curto no .env\n');
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

// Rate limit para login: 10 tentativas/min por IP
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

// ── Rota de diagnóstico da fila (evidência para apresentação) ──
app.get('/api/queue/stats', (_req, res) => {
  res.json({
    ...getQueueStats(),
    timestamp: new Date().toISOString(),
    descricao: 'Estatísticas da fila de processamento paralelo de buscas',
  });
});

// ── Handler global de erros (deve ser o último) ───────────
app.use(errorMiddleware);

// ── Iniciar Worker de Paralelismo ─────────────────────────
startSearchWorker();

app.listen(PORT, () => {
  console.log(`\n🎮 Checkpoint API v1.10`);
  console.log(`   URL:        http://localhost:${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/api/health`);
  console.log(`   Fila stats: http://localhost:${PORT}/api/queue/stats`);
  console.log(`\n📐 Arquitetura:`);
  console.log(`   Frontend → Express API → Prisma → SQLite`);
  console.log(`                         ↓`);
  console.log(`                    SearchQueue (fila em memória)`);
  console.log(`                         ↓`);
  console.log(`                    SearchWorker (background, 1s)`);
  console.log(`                         ↓`);
  console.log(`                    TAB_BUSCA_JOGO (métricas)\n`);
});
