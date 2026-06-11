/**
 * searchWorkerRunner.ts — Checkpoint v1.10.4
 *
 * Runner do worker em processo separado.
 *
 * Execução:
 *   npm run dev:worker
 *
 * A API Express não inicia este worker automaticamente.
 * A comunicação entre API e worker acontece pela tabela TAB_FILA_BUSCA.
 */

import * as dotenv from 'dotenv';
import { prisma } from '../utils/prisma';
import { startSearchWorker, stopSearchWorker } from './searchWorker';

dotenv.config();

console.log('🔧 Checkpoint SearchWorker v1.10.4');
console.log('   Processo: worker separado da API');
console.log('   Fila:     TAB_FILA_BUSCA');
console.log('   Saída:    TAB_BUSCA_JOGO');

startSearchWorker();

async function shutdown(signal: string): Promise<void> {
  console.log(`
[WORKER] Encerrando worker (${signal})...`);
  stopSearchWorker();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => { void shutdown('SIGINT'); });
process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
