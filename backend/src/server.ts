/**
 * Servidor Express do Checkpoint v1.4
 * Sem Docker — SQLite local via Prisma
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { routes } from './routes';
import { errorMiddleware } from './middlewares/errorMiddleware';

const app  = express();
const PORT = Number(process.env.PORT) || 3333;

// Segurança
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limit: 200 requisições por minuto por IP
app.use(rateLimit({ windowMs: 60_000, limit: 200 }));

// Parseia JSON
app.use(express.json({ limit: '2mb' }));

// Monta todas as rotas no prefixo /api
app.use('/api', routes);

// Handler global de erros (deve ser o último)
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`\n🎮 Checkpoint API v1.4`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
