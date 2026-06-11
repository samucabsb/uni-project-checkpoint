/**
 * searchQueue.ts — Checkpoint v1.10.4
 *
 * Fila persistente para processamento de buscas de jogos.
 *
 * Arquitetura:
 *   Route (Producer) → TAB_FILA_BUSCA → Worker separado (Consumer) → TAB_BUSCA_JOGO
 *
 * Motivo da mudança v1.10.4:
 *   - Remove o armazenamento volátil da fila.
 *   - Permite executar API e worker em processos separados.
 *   - Mantém evidência auditável no banco para apresentação acadêmica.
 */

import { prisma } from '../utils/prisma';

export type SearchJob = {
  termo: string;
  id_usuario: number | null;
  resultados: number;
  created_at?: Date;
};

export type QueueStats = {
  pendentes: number;
  processando: number;
  processados: number;
  erros: number;
  adicionados: number;
};

/**
 * Producer: registra um job na fila persistente.
 *
 * Observação importante:
 * A rota HTTP chama esta função em modo fire-and-forget. Se a fila falhar,
 * a busca do usuário continua funcionando e a falha fica registrada em log.
 */
export async function addSearchJob(job: SearchJob): Promise<void> {
  const created = await prisma.filaBusca.create({
    data: {
      termo: job.termo,
      id_usuario: job.id_usuario,
      resultados: job.resultados,
      status: 'PENDENTE',
      created_at: job.created_at ?? new Date(),
    },
  });

  console.log(
    `[QUEUE] Job persistido | id: ${created.id_fila} | termo: "${created.termo}" | status: ${created.status}`,
  );
}

/** Retorna estatísticas reais da fila persistente. */
export async function getQueueStats(): Promise<QueueStats> {
  const [pendentes, processando, processados, erros, adicionados] = await Promise.all([
    prisma.filaBusca.count({ where: { status: 'PENDENTE' } }),
    prisma.filaBusca.count({ where: { status: 'PROCESSANDO' } }),
    prisma.filaBusca.count({ where: { status: 'CONCLUIDO' } }),
    prisma.filaBusca.count({ where: { status: 'ERRO' } }),
    prisma.filaBusca.count(),
  ]);

  return { pendentes, processando, processados, erros, adicionados };
}
