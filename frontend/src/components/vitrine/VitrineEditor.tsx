/**
 * VitrineEditor — modal para montar/editar a vitrine
 */

import { useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal, Input, Button } from '../ui';
import { GamePoster } from '../GamePoster';
import { StatusJogo } from '../../types';

interface Props {
  open:        boolean;
  onClose:     () => void;
  vitrine:     StatusJogo[];
  onUpdated:   () => void;
}

export function VitrineEditor({ open, onClose, vitrine, onUpdated }: Props) {
  const { toast } = useToast();
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState<{ id_jogo: number; nm_jogo: string; img_jogo: string }[]>([]);
  const [position, setPosition] = useState(1);
  const [adding, setAdding]   = useState(false);

  function nextFreePosition() {
    const occupied = new Set(vitrine.map(v => v.top_position));
    for (let p = 1; p <= 4; p++) if (!occupied.has(p)) return p;
    return 1;
  }

  async function handleSearch(q: string) {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    try { const r = await api.get('/games/search', { params: { q } }); setResults(r.data); }
    catch {}
  }

  async function handleAdd(id_jogo: number) {
    setAdding(true);
    try {
      await api.post('/users/vitrine', { id_jogo, top_position: position });
      toast(`Adicionado à posição ${position} da vitrine!`);
      onUpdated();
      onClose();
      setSearch(''); setResults([]);
    } catch { toast('Erro ao atualizar vitrine.', 'error'); }
    finally { setAdding(false); }
  }

  const occupied = vitrine.find(v => v.top_position === position);

  return (
    <Modal open={open} onClose={onClose} title="Editar Vitrine">
      <div className="space-y-4">
        {/* Posição */}
        <div>
          <label className="mb-2 block text-sm font-bold text-zinc-300">Posição na vitrine</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(p => {
              const item = vitrine.find(v => v.top_position === p);
              return (
                <button key={p} onClick={() => setPosition(p)}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${position === p ? 'bg-checkpoint-green text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                  {item ? (
                    <div className="flex flex-col items-center gap-1">
                      <span>{p}</span>
                      <span className="text-[10px] opacity-70 truncate px-1 max-w-full">{item.jogo.nm_jogo.slice(0, 8)}</span>
                    </div>
                  ) : (
                    <span>{p} — livre</span>
                  )}
                </button>
              );
            })}
          </div>
          {occupied && (
            <p className="mt-1.5 text-xs text-yellow-400">
              ⚠ Posição {position} ocupada por "{occupied.jogo.nm_jogo}". Será substituído.
            </p>
          )}
        </div>

        {/* Busca */}
        <Input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar jogo para adicionar…"
          autoFocus
        />

        {/* Resultados */}
        {results.length > 0 && (
          <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-800 divide-y divide-zinc-800/50">
            {results.map(g => (
              <button key={g.id_jogo} disabled={adding}
                onClick={() => handleAdd(g.id_jogo)}
                className="flex w-full items-center gap-3 p-3 hover:bg-zinc-800 transition-colors text-left disabled:opacity-50">
                <GamePoster src={g.img_jogo} alt={g.nm_jogo} size="mini"/>
                <span className="text-sm font-bold">{g.nm_jogo}</span>
              </button>
            ))}
          </div>
        )}

        {search.length >= 2 && results.length === 0 && (
          <p className="text-sm text-center text-zinc-500 py-2">Nenhum jogo encontrado.</p>
        )}

        {vitrine.length > 0 && (
          <p className="text-xs text-zinc-500 text-center">
            {4 - vitrine.length > 0 ? `${4 - vitrine.length} vaga${4 - vitrine.length > 1 ? 's' : ''} disponível${4 - vitrine.length > 1 ? 'is' : ''}` : 'Vitrine completa (4/4)'}
          </p>
        )}
      </div>
    </Modal>
  );
}

export { VitrineEditor as default };
