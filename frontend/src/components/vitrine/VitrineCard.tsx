/**
 * VitrineCard — card individual da vitrine com overlay e remoção
 */

import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Heart } from 'lucide-react';
import { GamePoster } from '../GamePoster';
import { StatusJogo } from '../../types';

interface Props {
  item:     StatusJogo;
  isOwner:  boolean;
  removing: boolean;
  onRemove: () => void;
}

export function VitrineCard({ item, isOwner, removing, onRemove }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-zinc-900">
      <Link to={`/jogos/${item.id_jogo}`} className="block">
        <GamePoster
          src={item.jogo.img_jogo}
          alt={item.jogo.nm_jogo}
          size="card"
          className="w-full transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs font-bold line-clamp-2 leading-tight">{item.jogo.nm_jogo}</p>
        </div>
      </Link>

      {item.favorito && (
        <span className="absolute left-2 top-2 rounded-full bg-checkpoint-green p-1 text-black shadow pointer-events-none">
          <Heart size={10} fill="currentColor"/>
        </span>
      )}

      {isOwner && (
        <button
          onClick={onRemove}
          disabled={removing}
          aria-label={`Remover ${item.jogo.nm_jogo} da vitrine`}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-zinc-300 opacity-0 transition hover:bg-red-900/80 hover:text-white group-hover:opacity-100 disabled:opacity-40"
        >
          {removing
            ? <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"/>
            : <X size={13}/>}
        </button>
      )}
    </div>
  );
}
