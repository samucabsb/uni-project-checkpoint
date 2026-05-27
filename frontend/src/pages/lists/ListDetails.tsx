/**
 * Detalhes de uma lista — adicionar/remover jogos diretamente na página da lista
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks';
import { Header, GameCard, EmptyState, Skeleton, Input } from '../../components/ui';
import { Lista, Jogo } from '../../types';

export function ListDetails() {
  const { id }    = useParams<{ id: string }>();
  const { user }  = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const debounced = useDebounce(searchQuery, 300);

  const { data: lista, isLoading } = useQuery<Lista>({
    queryKey: ['list', id],
    queryFn:  () => api.get('/lists/' + id).then(r => r.data),
  });

  // Busca de jogos para adicionar à lista
  const { data: searchResults = [] } = useQuery<Jogo[]>({
    queryKey: ['list-search', debounced],
    queryFn:  () => api.get('/games/search', { params: { q: debounced } }).then(r => r.data),
    enabled:  debounced.length >= 2,
  });

  const canEdit = user?.tipo_usuario === 'ADMIN' || user?.id_usuario === lista?.id_usuario;

  async function addGame(jogo: Jogo) {
    try {
      await api.post(`/lists/${id}/games`, { id_jogo: jogo.id_jogo });
      toast(`"${jogo.nm_jogo}" adicionado à lista!`);
      setSearchQuery('');
      qc.invalidateQueries({ queryKey: ['list', id] });
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao adicionar.', 'error');
    }
  }

  async function removeGame(jogoId: number) {
    await api.delete(`/lists/${id}/games/${jogoId}`);
    toast('Jogo removido da lista.');
    qc.invalidateQueries({ queryKey: ['list', id] });
  }

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-3xl" />
      <div className="grid gap-6 md:grid-cols-5">
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
      </div>
    </div>
  );

  if (!lista) return <EmptyState title="Lista não encontrada" />;

  return (
    <div className="space-y-8">
      <Header title={lista.nm_lista} text={lista.descricao || 'Lista da comunidade Checkpoint'} />

      {/* Busca para adicionar jogos (só para o dono ou admin) */}
      {canEdit && (
        <div className="surface rounded-2xl p-5">
          <h2 className="mb-3 text-xl font-black">Adicionar jogo à lista</h2>
          <div className="relative">
            <Input
              placeholder="Buscar jogo para adicionar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {debounced.length >= 2 && (
              <div className="dropdown absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                {searchResults.length === 0 ? (
                  <p className="p-4 text-sm text-zinc-400">Nenhum resultado.</p>
                ) : (
                  searchResults.map(g => {
                    const jaEsta = lista.jogos?.some(lj => lj.jogo.id_jogo === g.id_jogo);
                    return (
                      <button
                        key={g.id_jogo}
                        disabled={jaEsta}
                        onClick={() => !jaEsta && addGame(g)}
                        className={`flex w-full items-center gap-3 p-3 text-left transition ${
                          jaEsta ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-900'
                        }`}
                      >
                        <img src={g.img_jogo} className="h-12 w-9 rounded object-cover flex-shrink-0" alt="" />
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{g.nm_jogo}</p>
                          <p className="text-xs text-zinc-400">{jaEsta ? 'Já na lista' : `★ ${g.media} · ${g.genero}`}</p>
                        </div>
                        {!jaEsta && (
                          <span className="ml-auto text-xs font-bold text-checkpoint-green">+ Adicionar</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid de jogos da lista */}
      {!lista.jogos?.length ? (
        <EmptyState title="Lista vazia" description={canEdit ? 'Use a busca acima para adicionar jogos.' : 'Esta lista ainda não tem jogos.'} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {lista.jogos.map(({ jogo }) => (
            <div key={jogo.id_jogo}>
              <GameCard game={jogo} />
              {canEdit && (
                <button
                  onClick={() => removeGame(jogo.id_jogo)}
                  className="mt-2 w-full rounded-xl border border-zinc-700 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
