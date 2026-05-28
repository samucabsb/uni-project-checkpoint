import { Response } from 'express';

/** Converte parâmetro de rota para ID inteiro positivo. Retorna null e envia 400 se inválido. */
export function parseId(param: string | string[], res: Response): number | null {
  const raw = Array.isArray(param) ? param[0] : param;
  const id  = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: 'ID inválido. Use um número inteiro positivo.' });
    return null;
  }
  return id;
}

/** Limita um valor entre min e max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Converte nota interna (1-10) para exibição (0.5–5.0 estrelas). */
export function notaParaEstrelas(nota: number): number {
  return Math.round((nota / 2) * 10) / 10;
}
