/**
 * Feed — Seguindo e Descobrir
 * v1.4: Descobrir agora inclui busca de usuários e seção "Jogadores da comunidade"
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import {
  Header, ReviewCard, GameCard, EmptyState, Section, Avatar, Skeleton,
} from '../../components/ui';
import { Avaliacao, DiscoverData, UsuarioCard } from '../../types';

// ── UserCard ──────────────────────────────────────────────
function UserCard({ user }: { user: UsuarioCard }) {
  return (
    <Link
      to={`/usuarios/${user.id_usuario}`}
      className="card card-hover flex items-center gap-3 rounded-2xl p-4"
    >
      <Avatar src={user.img_usuario} name={user.nm_usuario} size="md" />
      <div className="min-w-0">
        <p className="font-bold truncate hover:text-checkpoint-green transition-colors">
          @{user.nm_usuario}
        </p>
        {user.bio_usuario ? (
          <p className="text-xs text-zinc-400 truncate">{user.bio_usuario}</p>
        ) : (
          <p className="text-xs text-zinc-500">
            {user._count?.avaliacoes || 0} avaliações · {user._count?.seguidores || 0} seguidores
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Busca de usuários no Descobrir ────────────────────────
function UserSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounced  = useDebounce(query, 300);

  const { data: results = [] } = useQuery<UsuarioCard[]>({
    queryKey: ['user-search', debounced],
    queryFn:  () => api.get('/users/search', { params: { q: debounced } }).then(r => r.data),
    enabled:  debounced.length >= 2,
  });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 focus-within:border-checkpoint-green transition-colors">
        <Search size={16} className="text-zinc-500 flex-shrink-0" />
        <input
          value={query}
          onFocus={() => debounced.length >= 2 && setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Buscar jogadores por nome..."
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="text-zinc-500 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {open && debounced.length >= 2 && (
        <div className="dropdown absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-zinc-400">Nenhum jogador encontrado para "{debounced}"</p>
          ) : (
            results.map(u => (
              <Link
                key={u.id_usuario}
                to={`/usuarios/${u.id_usuario}`}
                onClick={() => { setOpen(false); setQuery(''); }}
                className="flex items-center gap-3 p-3 hover:bg-zinc-900 transition-colors"
              >
                <Avatar src={u.img_usuario} name={u.nm_usuario} size="sm" />
                <div className="min-w-0">
                  <p className="font-bold text-sm">@{u.nm_usuario}</p>
                  <p className="text-xs text-zinc-400">
                    {u._count?.avaliacoes || 0} avaliações · {u._count?.seguidores || 0} seguidores
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Feed principal ────────────────────────────────────────
type Tab = 'following' | 'discover';

export default function Feed() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>(isAuthenticated ? 'following' : 'discover');

  const following = useQuery<Avaliacao[]>({
    queryKey: ['feed', 'following'],
    queryFn:  () => api.get('/feed/following').then(r => r.data),
    enabled:  isAuthenticated,
  });

  const discover = useQuery<DiscoverData>({
    queryKey: ['feed', 'discover'],
    queryFn:  () => api.get('/feed/discover').then(r => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-8">
      <Header title="Feed" text="Acompanhe a comunidade Checkpoint." />

      {/* Abas */}
      <div className="flex gap-2">
        {isAuthenticated && (
          <button
            onClick={() => setTab('following')}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              tab === 'following' ? 'bg-checkpoint-green text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Seguindo
          </button>
        )}
        <button
          onClick={() => setTab('discover')}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            tab === 'discover' ? 'bg-checkpoint-green text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          Descobrir
        </button>
      </div>

      {/* ── Aba: Seguindo ──────────────────────────────── */}
      {tab === 'following' && (
        <div>
          {following.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : !following.data?.length ? (
            <EmptyState
              title="Nenhuma atividade ainda"
              description="Siga outros jogadores para ver suas avaliações aqui."
              action={
                <button
                  onClick={() => setTab('discover')}
                  className="rounded-xl bg-checkpoint-green px-5 py-2.5 text-sm font-bold text-black hover:brightness-110 transition"
                >
                  Descobrir jogadores
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {following.data.map(r => (
                <ReviewCard key={r.id_avaliacao} review={r} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Aba: Descobrir ─────────────────────────────── */}
      {tab === 'discover' && (
        <div className="space-y-10">
          {/* Busca de usuários */}
          <div className="surface rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users size={18} className="text-checkpoint-green" />
              <h2 className="text-lg font-black">Encontrar jogadores</h2>
            </div>
            <UserSearch />
          </div>

          {/* Jogadores ativos */}
          {(discover.data?.users?.length ?? 0) > 0 && (
            <Section title="Jogadores da comunidade">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {discover.data!.users.slice(0, 8).map(u => (
                  <UserCard key={u.id_usuario} user={u} />
                ))}
              </div>
            </Section>
          )}

          {/* Avaliações recentes */}
          {(discover.data?.reviews?.length ?? 0) > 0 && (
            <Section title="Avaliações recentes">
              <div className="grid gap-4 md:grid-cols-2">
                {discover.data!.reviews.slice(0, 6).map(r => (
                  <ReviewCard key={r.id_avaliacao} review={r} />
                ))}
              </div>
            </Section>
          )}

          {/* Novidades no catálogo */}
          {(discover.data?.games?.length ?? 0) > 0 && (
            <Section title="Novidades no catálogo">
              <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {discover.data!.games.slice(0, 10).map(g => (
                  <GameCard key={g.id_jogo} game={g} />
                ))}
              </div>
            </Section>
          )}

          {/* Estado vazio (banco sem dados) */}
          {!discover.isLoading &&
            !discover.data?.reviews?.length &&
            !discover.data?.games?.length && (
              <EmptyState
                title="Nenhuma atividade ainda"
                description="Seja o primeiro a avaliar um jogo!"
              />
            )}
        </div>
      )}
    </div>
  );
}
