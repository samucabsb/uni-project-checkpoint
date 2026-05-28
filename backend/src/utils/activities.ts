/**
 * Utilitário de atividades — v1.6
 *
 * Registra ações dos usuários no feed social.
 * Falha silenciosa: se o log falhar, a ação principal não é afetada.
 */

import { prisma } from './prisma';

export type TipoAtividade =
  | 'AVALIOU_JOGO'
  | 'CURTIU_REVIEW'
  | 'CRIOU_LISTA'
  | 'ADICIONOU_JOGO_LISTA'
  | 'FAVORITOU_JOGO'
  | 'MUDOU_STATUS'
  | 'SEGUIU_USUARIO'
  | 'CURTIU_LISTA';

interface AtividadeInput {
  id_usuario:       number;
  tipo:             TipoAtividade;
  id_jogo?:         number | null;
  id_avaliacao?:    number | null;
  id_lista?:        number | null;
  id_usuario_alvo?: number | null;
  dados_extras?:    string | null;  // ex: "JOGANDO" para MUDOU_STATUS
}

export async function logAtividade(data: AtividadeInput): Promise<void> {
  try {
    await prisma.tAB_ATIVIDADE.create({ data });
  } catch {
    // Intencionalmente silencioso — atividade não é crítica para o fluxo
  }
}
