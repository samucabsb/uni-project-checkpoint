/**
 * Biblioteca Pessoal
 * Tabs: Todos, por status, Favoritos, Vitrine (antigo Top 4)
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Header, GameCard, EmptyState, Skeleton } from '../../components/ui';
import { StatusJogo } from '../../types';

const TABS = ['TODOS', 'QUERO_JOGAR', 'JOGANDO', 'ZERADO', 'ABANDONADO', 'FAVORITOS', 'VITRINE'] as const;
type Tab = typeof TABS[number];

const TAB_LABEL: Record<Tab, string> = {
  TODOS:       'Todos',
  QUERO_JOGAR: 'Quero Jogar',
  JOGANDO:     'Jogando',
  ZERADO:      'Zerado',
  ABANDONADO:  'Abandonado',
  FAVORITOS:   'Favoritos',
  VITRINE:     'Vitrine',
};

export default function Library() {
  const { toast } = useToast();
  const qc        = useQueryClient();
  const [tab, setTab] = useState<Tab>('TODOS');

  const { data: items = [], isLoading } = useQuery<StatusJogo[]>({
    queryKey: ['library', tab],
    queryFn:  () => api.get('/library', { params: { status: tab } }).then(r => r.data),
  });

  async function addToVitrine(item: StatusJogo, posicao: number) {
    // Busca estado atual da Vitrine para não apagar outras posições
    const vitrine: StatusJogo[] = await api
      .get('/library', { params: { status: 'VITRINE' } })
      .then(r => r.data);

    // Filtra a posição que está sendo substituída (se houver)
    const outras = vitrine
      .filter(v => v.top_position !== posicao && v.jogo.id_jogo !== item.jogo.id_jogo)
      .map(v => ({ id_jogo: v.jogo.id_jogo, position: v.top_position as number }));

    await api.put('/library/vitrine', {
      items: [...outras, { id_jogo: item.jogo.id_jogo, position: posicao }],
    });

    toast(`Posição ${posicao} da Vitrine atualizada!`);
    qc.invalidateQueries({ queryKey: ['library'] });
  }

  async function removeFromVitrine(item: StatusJogo) {
    const vitrine: StatusJogo[] = await api
      .get('/library', { params: { status: 'VITRINE' } })
      .then(r => r.data);

    const restantes = vitrine
      .filter(v => v.jogo.id_jogo !== item.jogo.id_jogo)
      .map(v => ({ id_jogo: v.jogo.id_jogo, position: v.top_position as number }));

    await api.put('/library/vitrine', { items: restantes });
    toast('Removido da Vitrine.');
    qc.invalidateQueries({ queryKey: ['library'] });
  }

  async function removeFavorito(item: StatusJogo) {
    await api.delete(`/library/games/${item.jogo.id_jogo}/favorite`);
    toast('Favorito removido.');
    qc.invalidateQueries({ queryKey: ['library'] });
  }

  return (
    <div className="space-y-8">
      <Header
        title="Minha Biblioteca"
        text="Organize seus jogos por status e gerencie sua Vitrine."
      />

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(s => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === s
                ? 'bg-checkpoint-green text-black'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {TAB_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={`Nenhum jogo ${TAB_LABEL[tab].toLowerCase()}`}
          description={
            tab === 'TODOS'
              ? 'Adicione jogos à sua biblioteca pela página de cada jogo.'
              : tab === 'VITRINE'
              ? 'Acesse a aba Favoritos para adicionar jogos à sua Vitrine.'
              : undefined
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map(item => (
            <div key={item.id_status} className="space-y-2">
              <GameCard game={item.jogo} />

              {/* Ações na aba Favoritos: adicionar à Vitrine ou remover dos favoritos */}
              {tab === 'FAVORITOS' && (
                <div className="flex gap-1">
                  <select
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs font-semibold outline-none cursor-pointer"
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) addToVitrine(item, Number(e.target.value));
                    }}
                  >
                    <option value="" disabled>
                      {item.top_position ? `Vitrine #${item.top_position}` : 'Adicionar à Vitrine'}
                    </option>
                    {[1, 2, 3, 4].map(p => (
                      <option key={p} value={p}>
                        Posição {p}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeFavorito(item)}
                    title="Remover dos favoritos"
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 text-xs text-red-400 hover:bg-red-500/10 transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Ações na aba Vitrine: mostrar posição e remover */}
              {tab === 'VITRINE' && (
                <div className="flex items-center justify-between px-1">
                  <span className="rounded-lg bg-checkpoint-green px-2 py-1 text-xs font-black text-black">
                    #{item.top_position}
                  </span>
                  <button
                    onClick={() => removeFromVitrine(item)}
                    className="text-xs text-zinc-400 hover:text-red-400 transition"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
