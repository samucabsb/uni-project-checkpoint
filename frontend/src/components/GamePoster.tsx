/**
 * GamePoster — imagem de capa de jogo padronizada
 * - size="card"   → aspect-[2/3], object-cover object-top
 * - size="detail" → aspect-[2/3], object-cover object-top (na page do jogo)
 * - size="thumb"  → tamanho fixo pequeno para listas/diário
 * Sempre tem fallback visual se a imagem falhar
 */

import { useState } from 'react';

type Size = 'card' | 'detail' | 'thumb' | 'mini';

interface Props {
  src:       string;
  alt:       string;
  size?:     Size;
  className?: string;
  loading?:  'lazy' | 'eager';
}

const SIZE_CLASSES: Record<Size, string> = {
  card:   'aspect-[2/3] w-full',
  detail: 'h-44 w-32',
  thumb:  'h-16 w-12',
  mini:   'h-12 w-9',
};

export function GamePoster({ src, alt, size = 'card', className = '', loading = 'lazy' }: Props) {
  const [failed, setFailed] = useState(false);

  const sizeClass = SIZE_CLASSES[size];
  const initials  = alt.slice(0, 2).toUpperCase();

  if (failed) {
    return (
      <div className={`flex-shrink-0 flex items-center justify-center rounded-xl bg-zinc-900 text-checkpoint-green font-black text-lg select-none ${sizeClass} ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={`flex-shrink-0 rounded-xl object-cover object-top ${sizeClass} ${className}`}
    />
  );
}
