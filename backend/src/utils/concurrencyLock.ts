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

// Set de chaves em processamento no momento
const emProcessamento = new Set<string>();

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
  emProcessamento.add(chave);
  console.log(`[LOCK] Lock adquirido: ${chave} | em uso: ${emProcessamento.size}`);
  return true;
}

/**
 * Libera o lock para uma chave.
 * Sempre chamado em finally — garante liberação mesmo em erro.
 */
export function liberarLock(chave: string): void {
  emProcessamento.delete(chave);
  console.log(`[LOCK] Lock liberado: ${chave} | em uso: ${emProcessamento.size}`);
}

/** Retorna quantos locks estão ativos agora */
export function locksAtivos(): number {
  return emProcessamento.size;
}
