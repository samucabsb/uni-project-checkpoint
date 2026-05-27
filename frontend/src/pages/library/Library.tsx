/**
 * Biblioteca Pessoal — v1.5
 * Tabs: TODOS, por status, FAVORITOS, VITRINE
 * Vitrine: gerenciada via drag-and-drop simples (select)
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Header, GameCard, EmptyState, Skeleton, Modal, Button } from '../../components/ui';
import { StatusJogo } from '../../types';

const TABS = ['TODOS','QUERO_JOGAR','JOGANDO','ZERADO','ABANDONADO','FAVORITOS','VITRINE'] as const;
type Tab = typeof TABS[number];
const TAB_LABEL: Record<Tab, string> = {
  TODOS: 'Todos', QUERO_JOGAR: 'Quero Jogar', JOGANDO: 'Jogando',
  ZERADO: 'Zerado', ABANDONADO: 'Abandonado', FAVORITOS: 'Favoritos', VITRINE: 'Vitrine',
};

export default function Library() {
  const { toast } = useToast();
  const qc        = useQueryClient();
  const [tab, setTab] = useState<Tab>('TODOS');

  // Confirmação de remoção da Vitrine
  const [confirmRemove, setConfirmRemove] = useState<StatusJogo | null>(null);

  const { data: items = [], isLoading } = useQuery<StatusJogo[]>({
    queryKey: ['library'],
    queryFn:  () => api.get('/library').then(r => r.data),
  });

  const vitrineItems = items.filter(i => i.top_position !== null).sort((a,b) => (a.top_position||0) - (b.top_position||0));

  const filtered = tab === 'TODOS'     ? items
    : tab === 'FAVORITOS'  ? items.filter(i => i.favorito)
    : tab === 'VITRINE'    ? vitrineItems
    : items.filter(i => i.status === tab);

  async function addToVitrine(item: StatusJogo, posicao: number) {
    try {
      const outras = vitrineItems
        .filter(v => v.top_position !== posicao && v.jogo.id_jogo !== item.jogo.id_jogo)
        .map(v => ({ id_jogo: v.jogo.id_jogo, position: v.top_position as number }));
      await api.put('/library/vitrine', { items: [...outras, { id_jogo: item.jogo.id_jogo, position: posicao }] });
      toast(`Posição ${posicao} atualizada!`);
      qc.invalidateQueries({ queryKey: ['library'] });
    } catch { toast('Erro ao atualizar Vitrine.', 'error'); }
  }

  async function removeFromVitrine(item: StatusJogo) {
    try {
      const restantes = vitrineItems
        .filter(v => v.jogo.id_jogo !== item.jogo.id_jogo)
        .map(v => ({ id_jogo: v.jogo.id_jogo, position: v.top_position as number }));
      await api.put('/library/vitrine', { items: restantes });
      toast('Removido da Vitrine.');
      setConfirmRemove(null);
      qc.invalidateQueries({ queryKey: ['library'] });
    } catch { toast('Erro ao remover da Vitrine.', 'error'); }
  }

  if (isLoading) return (
    <div className="space-y-6">
      <Header title="Biblioteca" />
      <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({length:8}).map((_,i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <Header title="Biblioteca" text={`${items.length} jogos na sua coleção.`} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab===t?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
            {TAB_LABEL[t]}
            {t === 'VITRINE' && <span className="ml-1.5 text-xs opacity-70">({vitrineItems.length}/4)</span>}
          </button>
        ))}
      </div>

      {/* Vitrine: interface de gerenciamento */}
      {tab === 'VITRINE' && (
        <section className="surface rounded-2xl p-6">
          <h2 className="mb-4 text-xl font-black">Gerenciar Vitrine</h2>
          <p className="mb-4 text-sm text-zinc-400">Escolha até 4 jogos para exibir em destaque no seu perfil.</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1,2,3,4].map(pos => {
              const item = vitrineItems.find(v => v.top_position === pos);
              return (
                <div key={pos} className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400">Posição {pos}</p>
                  <div className="aspect-[3/4] relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
                    {item ? (
                      <>
                        <img src={item.jogo.img_jogo} className="h-full w-full object-cover" alt={item.jogo.nm_jogo}/>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs font-bold line-clamp-2">{item.jogo.nm_jogo}</p>
                        </div>
                        <button onClick={() => setConfirmRemove(item)}
                          className="absolute right-1.5 top-1.5 rounded-full bg-red-500/90 p-1 text-white hover:bg-red-500 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-600 font-black text-3xl">{pos}</div>
                    )}
                  </div>
                  <select
                    onChange={e => {
                      const chosen = items.find(i => i.id_status === Number(e.target.value));
                      if (chosen) addToVitrine(chosen, pos);
                      e.target.value = '';
                    }}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs outline-none focus:border-checkpoint-green"
                    defaultValue=""
                  >
                    <option value="" disabled>Escolher jogo…</option>
                    {items.filter(i => i.top_position !== pos).map(i => (
                      <option key={i.id_status} value={i.id_status}>{i.jogo.nm_jogo}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Grid de jogos */}
      {tab !== 'VITRINE' && (
        filtered.length === 0 ? (
          <EmptyState title="Nada por aqui" description="Adicione jogos ao catálogo para preencher esta seção." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((item: StatusJogo) => <GameCard key={item.id_status} game={item.jogo} />)}
          </div>
        )
      )}

      {/* Confirmação de remoção */}
      <Modal open={!!confirmRemove} onClose={() => setConfirmRemove(null)} title="Remover da Vitrine">
        <p className="text-zinc-400 mb-6">Remover <strong className="text-white">{confirmRemove?.jogo.nm_jogo}</strong> da Vitrine?</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmRemove(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => confirmRemove && removeFromVitrine(confirmRemove)}>Remover</Button>
        </div>
      </Modal>
    </div>
  );
}
