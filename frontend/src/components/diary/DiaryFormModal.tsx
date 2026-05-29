/**
 * DiaryFormModal — modal de nova entrada no diário
 * Inclui: busca de jogo, data (bloqueio futuro), nota opcional, comentário
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal, Input, TextArea, Button, Stars } from '../ui';
import { GamePoster } from '../GamePoster';

interface Props {
  open:    boolean;
  onClose: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export function DiaryFormModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const qc        = useQueryClient();

  const [gameSearch, setGameSearch] = useState('');
  const [gameResults, setGameResults] = useState<{ id_jogo: number; nm_jogo: string; img_jogo: string }[]>([]);
  const [selectedGame, setSelectedGame] = useState<{ id_jogo: number; nm_jogo: string } | null>(null);
  const [form, setForm] = useState({ data_jogada: today(), nota: 0, comentario: '' });

  function resetAll() {
    setSelectedGame(null); setGameSearch(''); setGameResults([]);
    setForm({ data_jogada: today(), nota: 0, comentario: '' });
  }

  async function searchGames(q: string) {
    setGameSearch(q);
    setSelectedGame(null);
    if (q.length < 2) { setGameResults([]); return; }
    try { const r = await api.get('/games/search', { params: { q } }); setGameResults(r.data); }
    catch {}
  }

  const add = useMutation({
    mutationFn: () => api.post('/diary', {
      id_jogo:     selectedGame!.id_jogo,
      data_jogada: form.data_jogada,
      nota:        form.nota || null,
      comentario:  form.comentario || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diary'] });
      toast('Entrada adicionada ao diário!');
      onClose(); resetAll();
    },
    onError: () => toast('Erro ao salvar entrada.', 'error'),
  });

  return (
    <Modal open={open} onClose={() => { onClose(); resetAll(); }} title="Nova entrada no diário">
      <div className="space-y-4">
        {/* Jogo */}
        <div>
          <label className="mb-2 block text-sm font-bold text-zinc-300">Jogo *</label>
          {selectedGame ? (
            <div className="flex items-center justify-between rounded-xl border border-checkpoint-green/50 bg-zinc-900 px-4 py-3">
              <span className="font-bold text-sm">{selectedGame.nm_jogo}</span>
              <button onClick={() => { setSelectedGame(null); setGameSearch(''); setGameResults([]); }}
                className="text-xs text-zinc-500 hover:text-white transition-colors ml-2">Trocar</button>
            </div>
          ) : (
            <div className="relative">
              <Input value={gameSearch} onChange={e => searchGames(e.target.value)}
                placeholder="Buscar jogo…" autoFocus/>
              {gameResults.length > 0 && (
                <div className="absolute left-0 right-0 top-14 z-10 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl max-h-56 overflow-y-auto">
                  {gameResults.map(g => (
                    <button key={g.id_jogo}
                      onClick={() => { setSelectedGame(g); setGameSearch(g.nm_jogo); setGameResults([]); }}
                      className="flex w-full items-center gap-3 p-3 hover:bg-zinc-800 transition-colors">
                      <GamePoster src={g.img_jogo} alt={g.nm_jogo} size="mini"/>
                      <span className="text-sm font-bold text-left">{g.nm_jogo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data — bloqueio de datas futuras */}
        <Input label="Data da sessão *" type="date" value={form.data_jogada}
          max={today()}
          onChange={e => setForm(f => ({ ...f, data_jogada: e.target.value }))}/>

        {/* Nota opcional */}
        <div>
          <label className="mb-2 block text-sm font-bold text-zinc-300">Nota (opcional)</label>
          <div className="flex items-center gap-3">
            <Stars value={form.nota} onChange={n => setForm(f => ({ ...f, nota: n }))} size={26}/>
            {form.nota > 0 && (
              <>
                <span className="font-black text-checkpoint-green">{(form.nota / 2).toFixed(1)}</span>
                <button onClick={() => setForm(f => ({ ...f, nota: 0 }))}
                  className="text-xs text-zinc-500 hover:text-white transition-colors">Limpar</button>
              </>
            )}
          </div>
        </div>

        <TextArea label="Comentário (opcional)" value={form.comentario} placeholder="Como foi a sessão?"
          onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))}/>

        <Button onClick={() => add.mutate()} loading={add.isPending}
          disabled={!selectedGame || !form.data_jogada} className="w-full">
          Salvar entrada
        </Button>
      </div>
    </Modal>
  );
}
