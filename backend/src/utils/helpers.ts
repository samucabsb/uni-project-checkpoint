/**
 * Helpers compartilhados entre rotas
 */

// Remove senha antes de serializar usuário para o cliente
export function sanitizeUser(u: Record<string, unknown>): Record<string, unknown> {
  const { senha_usuario, ...rest } = u;
  void senha_usuario;
  return rest;
}

// Mantém alias para compatibilidade interna
export const sanitize = sanitizeUser;

// Converte nota 1-10 para estrelas exibidas (0.5-5.0)
export function notaParaDisplay(nota: number): number {
  return Math.round((nota / 2) * 10) / 10;
}

// Calcula média e total de avaliações — retorna media em escala de exibição (0.5-5.0)
export function calcMedia<T extends { avaliacoes: { nota: number }[] }>(
  jogo: T,
): T & { media: number; total_avaliacoes: number } {
  const notas = jogo.avaliacoes.map(a => a.nota);
  const media = notas.length
    ? notas.reduce((sum, n) => sum + n, 0) / notas.length
    : 0;
  return {
    ...jogo,
    media:            Number(notaParaDisplay(media).toFixed(1)),
    total_avaliacoes: notas.length,
  };
}
