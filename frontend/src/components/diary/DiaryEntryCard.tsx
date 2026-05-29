import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GamePoster } from '../GamePoster';
import { Stars } from '../ui';
import { DiarioEntry } from '../../types';

interface Props {
  entry:     DiarioEntry;
  onDelete:  (id: number) => void;
  deleting:  boolean;
}

export function DiaryEntryCard({ entry, onDelete, deleting }: Props) {
  return (
    <article className="card flex items-start gap-4 rounded-2xl p-4">
      <Link to={`/jogos/${entry.id_jogo}`} className="flex-shrink-0">
        <GamePoster src={entry.jogo.img_jogo} alt={entry.jogo.nm_jogo} size="thumb"/>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/jogos/${entry.id_jogo}`}
              className="font-bold text-sm hover:text-checkpoint-green transition-colors line-clamp-1">
              {entry.jogo.nm_jogo}
            </Link>
            <p className="text-xs text-zinc-500">
              {format(new Date(entry.data_jogada), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <button onClick={() => onDelete(entry.id_diario)} disabled={deleting}
            aria-label="Excluir entrada"
            className="flex-shrink-0 text-zinc-600 hover:text-red-400 transition-colors p-1 disabled:opacity-40">
            <Trash2 size={14}/>
          </button>
        </div>
        {entry.nota && (
          <div className="mt-1.5 flex items-center gap-2">
            <Stars value={entry.nota} size={12}/>
            <span className="text-xs font-bold text-checkpoint-green">{(entry.nota / 2).toFixed(1)}</span>
          </div>
        )}
        {entry.comentario && (
          <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{entry.comentario}</p>
        )}
      </div>
    </article>
  );
}
