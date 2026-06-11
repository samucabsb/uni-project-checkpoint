/**
 * concurrencyLock.ts — Checkpoint v1.10
 *
 * Mutex em memória para operações críticas no Node.js.
 *
 * Por que isso é necessário com SQLite + Prisma?
 *
 * O Node.js roda em thread único. O Prisma com SQLite serializa
 * todas as escritas internamente. Isso significa que requests
 * "simultâneos" via Promise.all são processados sequencialmente
 * no event loop — o banco nunca vê dois INSERTs ao mesmo tempo.
 *
 * A solução é garantir o conflito NA CAMADA DA APLICAÇÃO:
 * quando o primeiro request para (usuario, jogo) está em
 * processamento, qualquer outro request para o mesmo par
 * recebe 409 imediatamente, sem nem chegar ao banco.
 *
 * Isso é concorrência controlada na camada correta para
 * um sistema Node.js single-threaded com SQLite.
 */

const JANELA_CONFLITO_MS = 200;

// Set de chaves em processamento ou recém-processadas.
// A janela curta após o término captura requests atrasados do mesmo burst concorrente.
const emProcessamento = new Set<string>();
const timersLiberacao = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Tenta adquirir o lock para uma chave.
 * Retorna true se adquiriu (pode prosseguir).
 * Retorna false se já estava em uso (conflito → 409).
 */
export function adquirirLock(chave: string): boolean {
  if (emProcessamento.has(chave)) {
    console.log(`[LOCK] Conflito detectado para chave: ${chave}`);
    return false;
  }

  const timerPendente = timersLiberacao.get(chave);
  if (timerPendente) {
    clearTimeout(timerPendente);
    timersLiberacao.delete(chave);
  }

  emProcessamento.add(chave);
  console.log(`[LOCK] Lock adquirido: ${chave} | em uso: ${emProcessamento.size}`);
  return true;
}

/**
 * Agenda a liberação do lock para uma chave.
 * Sempre chamado em finally — mantém uma janela curta para requests atrasados
 * do mesmo burst concorrente receberem 409 antes da chave ser liberada.
 */
export function liberarLock(chave: string): void {
  const timerAnterior = timersLiberacao.get(chave);
  if (timerAnterior) clearTimeout(timerAnterior);

  const timer = setTimeout(() => {
    emProcessamento.delete(chave);
    timersLiberacao.delete(chave);
    console.log(`[LOCK] Lock liberado: ${chave} | em uso: ${emProcessamento.size}`);
  }, JANELA_CONFLITO_MS);

  timersLiberacao.set(chave, timer);
  console.log(`[LOCK] Lock em janela de conflito: ${chave} | ${JANELA_CONFLITO_MS}ms`);
}

/** Retorna quantos locks estão ativos agora */
export function locksAtivos(): number {
  return emProcessamento.size;
}
