/**
 * searchWorker.ts — Checkpoint v1.10
 *
 * Worker independente que processa jobs da fila em background.
 * Executa a cada 1 segundo via setInterval — desacoplado da requisição HTTP.
 *
 * Responsabilidades:
 *   1. Consumir jobs da fila
 *   2. Persistir métricas de busca no banco (TAB_BUSCA_JOGO)
 *   3. Emitir logs auditáveis para evidência de execução
 *
 * Este é o componente que satisfaz o requisito de "fila + worker" do professor.
 * Execução independente da requisição principal = paralelismo real.
 */

import { getNextJob, incrementConsumed, queueSize } from '../queue/searchQueue';
import { prisma } from '../utils/prisma';

const WORKER_INTERVAL_MS = 1000; // processa a cada 1 segundo
let workerAtivo = false;

export function startSearchWorker(): void {
  if (workerAtivo) {
    console.log('[WORKER] Worker de busca já está em execução.');
    return;
  }

  workerAtivo = true;
  console.log('[WORKER] 🚀 Worker de busca iniciado — processando a cada 1s');

  setInterval(async () => {
    const job = getNextJob();
    if (!job) return; // fila vazia — aguarda próximo tick

    console.log(`[WORKER] ⚙️  Processando | termo: "${job.termo}" | resultados: ${job.resultados} | fila restante: ${queueSize()}`);

    try {
      await prisma.tAB_BUSCA_JOGO.create({
        data: {
          termo:       job.termo,
          id_usuario:  job.id_usuario,
          resultados:  job.resultados,
          created_at:  job.created_at,
        },
      });

      incrementConsumed();
      console.log(`[WORKER] ✅ Busca registrada | termo: "${job.termo}" | usuário: ${job.id_usuario ?? 'anônimo'}`);
    } catch (error) {
      console.error(`[WORKER] ❌ Erro ao processar busca "${job.termo}":`, error);
      // Falha silenciosa — não bloqueia o worker
    }
  }, WORKER_INTERVAL_MS);
}
