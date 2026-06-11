/**
 * searchQueue.ts — Checkpoint v1.10
 *
 * Fila em memória para processamento paralelo de buscas de jogos.
 * Implementa o padrão Producer/Consumer desacoplado da requisição HTTP.
 *
 * Arquitetura:
 *   Route (Producer) → addSearchJob() → queue[] → Worker (Consumer) → Banco
 *
 * Nota: Fila em memória é suficiente para demonstração acadêmica.
 * Em produção, substituir por Redis + BullMQ.
 */

export type SearchJob = {
  termo:      string;
  id_usuario: number | null;
  resultados: number;
  created_at: Date;
};

// Fila FIFO em memória
const queue: SearchJob[] = [];

// Contadores para evidência de execução
let totalAdded    = 0;
let totalConsumed = 0;

/** Adiciona um job na fila (Producer — chamado pela rota de busca) */
export function addSearchJob(job: SearchJob): void {
  queue.push(job);
  totalAdded++;
  console.log(`[QUEUE] Job adicionado | termo: "${job.termo}" | fila: ${queue.length} | total: ${totalAdded}`);
}

/** Remove e retorna o próximo job da fila (Consumer — chamado pelo worker) */
export function getNextJob(): SearchJob | undefined {
  return queue.shift();
}

/** Retorna o tamanho atual da fila */
export function queueSize(): number {
  return queue.length;
}

/** Incrementa contador de jobs consumidos */
export function incrementConsumed(): void {
  totalConsumed++;
}

/** Retorna estatísticas da fila para diagnóstico */
export function getQueueStats() {
  return {
    pendentes:  queue.length,
    adicionados: totalAdded,
    processados: totalConsumed,
  };
}
