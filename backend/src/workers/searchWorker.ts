/**
 * searchWorker.ts — Checkpoint v1.10.4
 *
 * Worker de busca desacoplado da API HTTP.
 *
 * Responsabilidade:
 *   1. Consumir jobs PENDENTES da TAB_FILA_BUSCA.
 *   2. Marcar job como PROCESSANDO para evitar dupla execução.
 *   3. Persistir a métrica em TAB_BUSCA_JOGO.
 *   4. Finalizar como CONCLUIDO ou ERRO.
 *
 * Este arquivo não deve ser iniciado pelo server.ts.
 * Use: npm run dev:worker
 */

import { prisma } from '../utils/prisma';

const WORKER_INTERVAL_MS = Number(process.env.SEARCH_WORKER_INTERVAL_MS ?? 1000);

let workerAtivo = false;
let tickEmExecucao = false;
let intervalRef: ReturnType<typeof setInterval> | null = null;

async function recoverInterruptedJobs(): Promise<void> {
  const recovered = await prisma.filaBusca.updateMany({
    where: { status: 'PROCESSANDO' },
    data: {
      status: 'PENDENTE',
      erro: 'Job recuperado após reinício do worker.',
      started_at: null,
      finished_at: null,
    },
  });

  if (recovered.count > 0) {
    console.log(`[WORKER] ${recovered.count} job(s) PROCESSANDO recuperado(s) para PENDENTE.`);
  }
}

/**
 * Consome um job da fila, se existir.
 * Retorna true quando algum job foi processado, false quando a fila estava vazia
 * ou quando outro worker capturou o mesmo job primeiro.
 */
export async function processNextSearchJob(): Promise<boolean> {
  const job = await prisma.filaBusca.findFirst({
    where: { status: 'PENDENTE' },
    orderBy: { created_at: 'asc' },
  });

  if (!job) return false;

  // Claim atômico por status: se outro worker capturar antes, count será 0.
  const claimed = await prisma.filaBusca.updateMany({
    where: { id_fila: job.id_fila, status: 'PENDENTE' },
    data: { status: 'PROCESSANDO', started_at: new Date(), erro: null },
  });

  if (claimed.count === 0) return false;

  console.log(
    `[WORKER] ⚙️  Job capturado | id: ${job.id_fila} | termo: "${job.termo}" | resultados: ${job.resultados}`,
  );

  try {
    await prisma.tAB_BUSCA_JOGO.create({
      data: {
        termo: job.termo,
        id_usuario: job.id_usuario,
        resultados: job.resultados,
        created_at: job.created_at,
      },
    });

    await prisma.filaBusca.update({
      where: { id_fila: job.id_fila },
      data: { status: 'CONCLUIDO', finished_at: new Date(), erro: null },
    });

    console.log(
      `[WORKER] ✅ Job concluído | id: ${job.id_fila} | termo: "${job.termo}" | destino: TAB_BUSCA_JOGO`,
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await prisma.filaBusca.update({
      where: { id_fila: job.id_fila },
      data: { status: 'ERRO', erro: message, finished_at: new Date() },
    });

    console.error(`[WORKER] ❌ Job com erro | id: ${job.id_fila} | termo: "${job.termo}":`, error);
    return true;
  }
}

async function workerTick(): Promise<void> {
  if (tickEmExecucao) return;

  tickEmExecucao = true;
  try {
    await processNextSearchJob();
  } catch (error) {
    console.error('[WORKER] ❌ Erro inesperado no tick do worker:', error);
  } finally {
    tickEmExecucao = false;
  }
}

export function startSearchWorker(): void {
  if (workerAtivo) {
    console.log('[WORKER] Worker de busca já está em execução neste processo.');
    return;
  }

  workerAtivo = true;
  console.log(`[WORKER] 🚀 Worker de busca iniciado em processo separado | intervalo: ${WORKER_INTERVAL_MS}ms`);

  void recoverInterruptedJobs().catch(error => {
    console.error('[WORKER] ❌ Falha ao recuperar jobs interrompidos:', error);
  });

  // Primeiro tick imediato para facilitar demonstração ao vivo.
  void workerTick();

  intervalRef = setInterval(() => {
    void workerTick();
  }, WORKER_INTERVAL_MS);
}

export function stopSearchWorker(): void {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }
  workerAtivo = false;
}
