/**
 * Helpers compartilhados entre as rotas
 * Centraliza funções utilitárias para evitar duplicação
 */

// Remove a senha antes de serializar um usuário para o cliente
export function sanitize(u: Record<string, unknown>): Record<string, unknown> {
  const { senha_usuario, ...rest } = u;
  void senha_usuario;
  return rest;
}

// Calcula média e total de avaliações de um jogo
export function calcMedia<T extends { avaliacoes: { nota: number }[] }>(
  jogo: T,
): T & { media: number; total_avaliacoes: number } {
  const notas  = jogo.avaliacoes.map(a => a.nota);
  const media  = notas.length
    ? notas.reduce((sum, n) => sum + n, 0) / notas.length
    : 0;
  return { ...jogo, media: Number(media.toFixed(1)), total_avaliacoes: notas.length };
}
