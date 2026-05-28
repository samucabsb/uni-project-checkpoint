/**
 * Diário de Jogos — v1.6
 * Histórico de sessões por jogo, agrupado por mês
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { DiarioEntry } from '../../types';
import { Header, Button, Modal, Input, TextArea, Stars, Skeleton } from '../../components/ui';

const DIARY_KEY = ['diary'];

export default function Diary() {
  const { toast } = useToast();
  const qc        = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({
    id_jogo: '', data_jogada: new Date().toISOString().split('T')[0], nota: 0, comentario: '',
  });
  const [gameSearch, setGameSearch] = useState('');
  const [gameResults, setGameResults] = useState<{ id_jogo: number; nm_jogo: string }[]>([]);
  const [selectedGame, setSelectedGame] = useState<{ id_jogo: number; nm_jogo: string } | null>(null);

  const { data: entries = [], isLoading } = useQuery<DiarioEntry[]>({
    queryKey: DIARY_KEY,
    queryFn:  () => api.get('/diary').then(r => r.data),
  });

  async function searchGames(q: string) {
    setGameSearch(q);
    setSelectedGame(null);
    if (q.length < 2) { setGameResults([]); return; }
    try {
      const r = await api.get('/games/search', { params: { q } });
      setGameResults(r.data);
    } catch {}
  }

  const add = useMutation({
    mutationFn: () => api.post('/diary', {
      id_jogo:     selectedGame!.id_jogo,
      data_jogada: form.data_jogada,
      nota:        form.nota || null,
      comentario:  form.comentario || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DIARY_KEY });
      setModal(false);
      resetForm();
      toast('Entrada adicionada!');
    },
    onError: () => toast('Erro ao salvar.', 'error'),
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/diary/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: DIARY_KEY }); toast('Entrada excluída.'); },
    onError:   () => toast('Erro ao excluir.', 'error'),
  });

  function resetForm() {
    setSelectedGame(null); setGameSearch(''); setGameResults([]);
    setForm({ id_jogo: '', data_jogada: new Date().toISOString().split('T')[0], nota: 0, comentario: '' });
  }

  // Agrupa por mês/ano
  const grouped = entries.reduce<Record<string, DiarioEntry[]>>((acc, e) => {
    const key = format(new Date(e.data_jogada), 'MMMM yyyy', { locale: ptBR });
    (acc[key] = acc[key] || []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header + botão */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Header title="Meu Diário" text="Registre cada sessão de jogo com data, nota e comentário."/>
        <Button onClick={() => setModal(true)} className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
          <Plus size={16}/> Nova entrada
        </Button>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl"/>)}
        </div>
      ) : entries.length === 0 ? (
        /* Estado vazio — SEM classe reveal para garantir visibilidade */
        <div className="card rounded-2xl p-10 text-center">
          <p className="text-2xl font-black">Diário vazio</p>
          <p className="mt-2 text-zinc-400">Registre suas sessões de jogo para acompanhar sua jornada.</p>
          <Button onClick={() => setModal(true)} className="mt-5 flex items-center gap-2 mx-auto">
            <Plus size={16}/> Primeira entrada
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([mes, items]) => (
            <section key={mes} className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-checkpoint-green"/>
                <h2 className="text-lg font-black capitalize">{mes}</h2>
                <span className="text-sm text-zinc-500">{items.length} entrada{items.length !== 1 ? 's' : ''}</span>
              </div>
              {items.map(e => (
                <article key={e.id_diario} className="card flex items-start gap-4 rounded-2xl p-4">
                  <Link to={`/jogos/${e.id_jogo}`} className="flex-shrink-0">
                    <img src={e.jogo.img_jogo} alt={e.jogo.nm_jogo}
                      onError={ev => { (ev.target as HTMLImageElement).src = `https://placehold.co/48x64/18181f/00e187?text=?`; }}
                      className="h-16 w-12 rounded-lg object-cover"/>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/jogos/${e.id_jogo}`} className="font-bold hover:text-checkpoint-green transition-colors line-clamp-1">
                          {e.jogo.nm_jogo}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          {format(new Date(e.data_jogada), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <button onClick={() => del.mutate(e.id_diario)} aria-label="Excluir entrada"
                        className="flex-shrink-0 text-zinc-600 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                    {e.nota && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Stars value={e.nota} size={13}/>
                        <span className="text-xs font-bold text-checkpoint-green">{(e.nota / 2).toFixed(1)}</span>
                      </div>
                    )}
                    {e.comentario && (
                      <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{e.comentario}</p>
                    )}
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>
      )}

      {/* Modal nova entrada */}
      <Modal open={modal} onClose={() => { setModal(false); resetForm(); }} title="Nova entrada no diário">
        <div className="space-y-4">
          {/* Busca de jogo */}
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Jogo *</label>
            {selectedGame ? (
              <div className="flex items-center justify-between rounded-xl border border-checkpoint-green/50 bg-zinc-900 px-4 py-3">
                <span className="font-bold text-sm">{selectedGame.nm_jogo}</span>
                <button onClick={() => { setSelectedGame(null); setGameSearch(''); setGameResults([]); }}
                  className="text-xs text-zinc-500 hover:text-white transition-colors">
                  Trocar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  value={gameSearch}
                  onChange={e => searchGames(e.target.value)}
                  placeholder="Digite o nome do jogo…"
                  autoFocus
                />
                {gameResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-14 z-10 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
                    {gameResults.map(g => (
                      <button key={g.id_jogo}
                        onClick={() => { setSelectedGame(g); setGameSearch(g.nm_jogo); setGameResults([]); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors font-medium">
                        {g.nm_jogo}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Input label="Data da sessão *" type="date" value={form.data_jogada}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setForm(f => ({ ...f, data_jogada: e.target.value }))}/>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Nota (opcional)</label>
            <div className="flex items-center gap-3">
              <Stars value={form.nota} onChange={n => setForm(f => ({ ...f, nota: n }))} size={26}/>
              {form.nota > 0 && (
                <>
                  <span className="font-black text-checkpoint-green">{(form.nota / 2).toFixed(1)}</span>
                  <button onClick={() => setForm(f => ({ ...f, nota: 0 }))} className="text-xs text-zinc-500 hover:text-white">
                    Limpar
                  </button>
                </>
              )}
            </div>
          </div>

          <TextArea label="Comentário (opcional)" value={form.comentario} placeholder="Como foi a sessão?"
            onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))}/>

          <Button
            onClick={() => add.mutate()}
            loading={add.isPending}
            disabled={!selectedGame || !form.data_jogada}
            className="w-full"
          >
            Salvar entrada
          </Button>
        </div>
      </Modal>
    </div>
  );
}
