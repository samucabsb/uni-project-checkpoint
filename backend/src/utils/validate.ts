/**
 * Utilitários de validação compartilhados
 * Centraliza parsing de IDs e outros helpers de validação
 */

import { Response } from 'express';

/**
 * Converte um parâmetro de rota para ID inteiro positivo.
 * Se inválido, envia resposta 400 e retorna null.
 *
 * @example
 * const id = parseId(req.params.id, res);
 * if (id === null) return;
 */
export function parseId(param: string, res: Response): number | null {
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: 'ID inválido. Use um número inteiro positivo.' });
    return null;
  }
  return id;
}

/**
 * Limita um valor entre min e max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converte nota interna (1-10) para exibição (0.5–5.0 estrelas).
 */
export function notaParaEstrelas(nota: number): number {
  return Math.round((nota / 2) * 10) / 10;
}
