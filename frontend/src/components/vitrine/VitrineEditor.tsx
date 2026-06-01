/**
 * VitrineEditor — modal para montar/editar a vitrine
 * FIX: position inicial usa nextFreePosition em vez de sempre 1
 */

import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal, Input, Button } from '../ui';
import { GamePoster } from '../GamePoster';
import { StatusJogo } from '../../types';

interface Props {
  open:      boolean;
  onClose:   () => void;
  vitrine:   StatusJogo[];
  onUpdated: () => void;
}

export function VitrineEditor({ open, onClose, vitrine, onUpdated }: Props) {
  const { toast }                         = useToast();
  const [search, setSearch]               = useState('');
  const [results, setResults]             = useState<{ id_jogo: number; nm_jogo: string; img_jogo: string }[]>([]);
  const [position, setPosition]           = useState(1);
  const [adding, setAdding]               = useState(false);

  // FIX: seleciona a primeira posição livre ao abrir o modal
  function nextFreePosition(): number {
    const occupied = new Set(vitrine.map(v => v.top_position));
    for (let p = 1; p <= 4; p++) if (!occupied.has(p)) return p;
    return 1; // vitrine cheia → padrão para posição 1
  }

  useEffect(() => {
    if (open) {
      setPosition(nextFreePosition());
      setSearch('');
      setResults([]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSearch(q: string) {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    try {
      const r = await api.get('/games/search', { params: { q } });
      setResults(r.data);
    } catch { /* silencioso */ }
  }

  async function handleAdd(id_jogo: number) {
    setAdding(true);
    try {
      await api.post('/users/vitrine', { id_jogo, top_position: position });
      toast(`Adicionado à posição ${position} da vitrine!`);
      onUpdated();
      onClose();
    } catch { toast('Erro ao atualizar vitrine.', 'error'); }
    finally { setAdding(false); }
  }

  const occupied = vitrine.find(v => v.top_position === position);

  return (
    <Modal open={open} onClose={onClose} title="Editar Vitrine">
      <div className="space-y-4">
        {/* Seleção de posição */}
        <div>
          <label className="mb-2 block text-sm font-bold text-zinc-300">Posição na vitrine</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(p => {
              const item = vitrine.find(v => v.top_position === p);
              return (
                <button
                  key={p}
                  onClick={() => setPosition(p)}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                    position === p ? 'bg-checkpoint-green text-black' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {item ? (
                    <div className="flex flex-col items-center gap-1">
                      <span>{p}</span>
                      <span className="max-w-full truncate px-1 text-[10px] opacity-70">
                        {item.jogo.nm_jogo.slice(0, 8)}
                      </span>
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
              ⚠ Posição {position} ocupada por &quot;{occupied.jogo.nm_jogo}&quot;. Será substituído.
            </p>
          )}
        </div>

        {/* Campo de busca */}
        <Input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar jogo para adicionar…"
          autoFocus
        />

        {/* Resultados */}
        {results.length > 0 && (
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800/50 rounded-xl border border-zinc-800">
            {results.map(g => (
              <button
                key={g.id_jogo}
                disabled={adding}
                onClick={() => handleAdd(g.id_jogo)}
                className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                <GamePoster src={g.img_jogo} alt={g.nm_jogo} size="mini" />
                <span className="text-sm font-bold">{g.nm_jogo}</span>
              </button>
            ))}
          </div>
        )}

        {search.length >= 2 && results.length === 0 && (
          <p className="py-2 text-center text-sm text-zinc-500">Nenhum jogo encontrado.</p>
        )}

        {vitrine.length > 0 && (
          <p className="text-center text-xs text-zinc-500">
            {4 - vitrine.length > 0
              ? `${4 - vitrine.length} vaga${4 - vitrine.length > 1 ? 's' : ''} disponível${4 - vitrine.length > 1 ? 'is' : ''}`
              : 'Vitrine completa (4/4)'}
          </p>
        )}
      </div>
    </Modal>
  );
}

export default VitrineEditor;
