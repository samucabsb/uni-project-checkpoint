/**
 * Feed social — Checkpoint v1.8
 * Abas: Minhas atividades | Seguindo | Descobrir | Em alta
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Star, Gamepad2, List, Heart, UserPlus, BookOpen,
  TrendingUp, Compass, Users,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Atividade, DiscoverData, TrendingData } from '../../types';
import { Avatar, GameCard, ReviewCard, Skeleton, EmptyState } from '../../components/ui';

type Tab = 'me' | 'following' | 'discover' | 'trending';

const PERIODO_OPTS = [
  { v: 'semana', l: 'Esta semana' },
  { v: 'mes',    l: 'Este mês'    },
  { v: 'todos',  l: 'Todos'       },
] as const;

const STATUS_LABEL: Record<string, string> = {
  QUERO_JOGAR: 'Quero jogar',
  JOGANDO:     'Jogando',
  ZERADO:      'Zerado',
  ABANDONADO:  'Abandonado',
};

// ── Ícone por tipo de atividade ────────────────────────────
function AtividadeIcon({ tipo }: { tipo: string }) {
  const cls = 'flex-shrink-0 text-checkpoint-green';
  switch (tipo) {
    case 'AVALIOU_JOGO':         return <Star     size={14} className={cls} />;
    case 'CURTIU_REVIEW':        return <Heart    size={14} className={cls} />;
    case 'CURTIU_LISTA':         return <Heart    size={14} className={cls} />;
    case 'FAVORITOU_JOGO':       return <Heart    size={14} className={cls} fill="currentColor" />;
    case 'CRIOU_LISTA':          return <List     size={14} className={cls} />;
    case 'ADICIONOU_JOGO_LISTA': return <List     size={14} className={cls} />;
    case 'MUDOU_STATUS':         return <Gamepad2 size={14} className={cls} />;
    case 'SEGUIU_USUARIO':       return <UserPlus size={14} className={cls} />;
    default:                     return <Star     size={14} className={cls} />;
  }
}

// ── Texto descritivo por tipo de atividade ─────────────────
function AtividadeText({ a }: { a: Atividade }) {
  const lnk = (to: string, label: string) => (
    <Link to={to} className="font-semibold hover:text-checkpoint-green transition-colors">
      {label}
    </Link>
  );

  switch (a.tipo) {
    case 'AVALIOU_JOGO':
      return <><b>avaliou</b> {a.jogo && lnk(`/jogos/${a.id_jogo}`, a.jogo.nm_jogo)}</>;
    case 'CURTIU_REVIEW':
      return (
        <>
          <b>curtiu</b> uma avaliação
          {a.avaliacao?.jogo && <> de {lnk(`/jogos/${a.avaliacao.jogo.id_jogo}`, a.avaliacao.jogo.nm_jogo)}</>}
        </>
      );
    case 'CRIOU_LISTA':
      return <><b>criou a lista</b> {a.lista && lnk(`/listas/${a.id_lista}`, a.lista.nm_lista)}</>;
    case 'ADICIONOU_JOGO_LISTA':
      return (
        <>
          <b>adicionou</b>{' '}
          {a.jogo && lnk(`/jogos/${a.id_jogo}`, a.jogo.nm_jogo)}{' '}
          à lista{' '}
          {a.lista && lnk(`/listas/${a.id_lista}`, a.lista.nm_lista)}
        </>
      );
    case 'FAVORITOU_JOGO':
      return <><b>favoritou</b> {a.jogo && lnk(`/jogos/${a.id_jogo}`, a.jogo.nm_jogo)}</>;
    case 'MUDOU_STATUS':
      return (
        <>
          <b>marcou</b>{' '}
          {a.jogo && lnk(`/jogos/${a.id_jogo}`, a.jogo.nm_jogo)}{' '}
          como <b>{STATUS_LABEL[a.dados_extras || ''] || a.dados_extras}</b>
        </>
      );
    case 'SEGUIU_USUARIO':
      return (
        <>
          <b>começou a seguir</b>{' '}
          {a.usuario_alvo && lnk(`/usuarios/${a.id_usuario_alvo}`, `@${a.usuario_alvo.nm_usuario}`)}
        </>
      );
    case 'CURTIU_LISTA':
      return <><b>curtiu a lista</b> {a.lista && lnk(`/listas/${a.id_lista}`, a.lista.nm_lista)}</>;
    default:
      return <b>{a.tipo}</b>;
  }
}

// ── Card de atividade ──────────────────────────────────────
function AtividadeCard({ a }: { a: Atividade }) {
  return (
    <div className="card flex items-start gap-3 rounded-2xl p-4">
      <Link to={`/usuarios/${a.id_usuario}`} className="flex-shrink-0">
        <Avatar src={a.usuario?.img_usuario} name={a.usuario?.nm_usuario} size="sm" />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <AtividadeIcon tipo={a.tipo} />
          <span className="text-sm leading-relaxed">
            <Link
              to={`/usuarios/${a.id_usuario}`}
              className="font-bold hover:text-checkpoint-green transition-colors"
            >
              @{a.usuario?.nm_usuario}
            </Link>{' '}
            <AtividadeText a={a} />
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-600">
          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
        </p>

        {/* Snippet do comentário da avaliação */}
        {a.tipo === 'AVALIOU_JOGO' && a.avaliacao?.comentario && (
          <p className="mt-2 border-l-2 border-checkpoint-green/40 pl-3 text-sm text-zinc-400 line-clamp-2">
            {a.avaliacao.comentario}
          </p>
        )}
      </div>

      {/* Thumbnail do jogo */}
      {a.jogo?.img_jogo && a.tipo !== 'SEGUIU_USUARIO' && (
        <Link to={`/jogos/${a.id_jogo}`} className="flex-shrink-0">
          <img
            src={a.jogo.img_jogo}
            alt={a.jogo.nm_jogo}
            onError={e => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/36x48/18181f/00e187?text=${encodeURIComponent((a.jogo?.nm_jogo || '?').slice(0, 2))}`;
            }}
            className="h-14 w-10 rounded-lg object-cover object-top"
          />
        </Link>
      )}
    </div>
  );
}

// ── Lista de atividades com loading/empty state ────────────
function AtividadeList({
  data,
  isLoading,
  emptyTitle,
  emptyDesc,
}: {
  data: Atividade[];
  isLoading: boolean;
  emptyTitle: string;
  emptyDesc: string;
}) {
  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  if (!data.length)
    return <EmptyState title={emptyTitle} description={emptyDesc} />;
  return (
    <div className="space-y-3">
      {data.map(a => (
        <AtividadeCard key={a.id_atividade} a={a} />
      ))}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────
export default function Feed() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>(isAuthenticated ? 'me' : 'discover');
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'todos'>('semana');

  const myFeed = useQuery<Atividade[]>({
    queryKey: ['feed', 'me'],
    queryFn:  () => api.get('/feed/me').then(r => r.data),
    enabled:  isAuthenticated && tab === 'me',
  });

  const followingFeed = useQuery<Atividade[]>({
    queryKey: ['feed', 'following'],
    queryFn:  () => api.get('/feed/following').then(r => r.data),
    enabled:  isAuthenticated && tab === 'following',
  });

  const discover = useQuery<DiscoverData>({
    queryKey: ['feed', 'discover'],
    queryFn:  () => api.get('/feed/discover').then(r => r.data),
    enabled:  tab === 'discover',
    staleTime: 60_000,
  });

  const trending = useQuery<TrendingData>({
    queryKey: ['trending', periodo],
    queryFn:  () => api.get('/feed/trending', { params: { periodo } }).then(r => r.data),
    enabled:  tab === 'trending',
    staleTime: 60_000,
  });

  type TabDef = { id: Tab; label: string; icon: React.ReactNode; authRequired?: boolean };
  const TABS: TabDef[] = [
    { id: 'me',        label: 'Minhas atividades', icon: <BookOpen  size={14} />, authRequired: true },
    { id: 'following', label: 'Seguindo',           icon: <Users     size={14} />, authRequired: true },
    { id: 'discover',  label: 'Descobrir',          icon: <Compass   size={14} /> },
    { id: 'trending',  label: 'Em alta',            icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="surface rounded-3xl p-6 sm:p-8">
        <p className="meta">Checkpoint</p>
        <h1 className="mt-2 text-4xl font-black">Feed</h1>
        <p className="mt-2 text-zinc-400">
          Acompanhe a comunidade gamer em tempo real.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.filter(t => !t.authRequired || isAuthenticated).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === t.id
                ? 'bg-checkpoint-green text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Minhas atividades ─────────────────────────────── */}
      {tab === 'me' && (
        <AtividadeList
          data={myFeed.data || []}
          isLoading={myFeed.isLoading}
          emptyTitle="Nenhuma atividade ainda"
          emptyDesc="Avalie um jogo, crie uma lista ou siga alguém para ver suas atividades aqui."
        />
      )}

      {/* ── Seguindo ──────────────────────────────────────── */}
      {tab === 'following' && (
        <AtividadeList
          data={followingFeed.data || []}
          isLoading={followingFeed.isLoading}
          emptyTitle="Nada por aqui"
          emptyDesc="Siga outros jogadores para ver o que eles estão fazendo."
        />
      )}

      {/* ── Descobrir ─────────────────────────────────────── */}
      {tab === 'discover' && (
        discover.isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Avaliações recentes */}
            {(discover.data?.reviews?.length || 0) > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-black">Avaliações recentes</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {discover.data!.reviews.slice(0, 6).map(r => (
                    <ReviewCard key={r.id_avaliacao} review={r} />
                  ))}
                </div>
              </section>
            )}

            {/* Jogos no catálogo */}
            {(discover.data?.games?.length || 0) > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-black">No catálogo</h2>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {discover.data!.games.slice(0, 8).map(g => (
                    <GameCard key={g.id_jogo} game={g} />
                  ))}
                </div>
              </section>
            )}

            {/* Jogadores ativos */}
            {(discover.data?.users?.length || 0) > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-black">Jogadores ativos</h2>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {discover.data!.users.slice(0, 6).map(u => (
                    <Link
                      key={u.id_usuario}
                      to={`/usuarios/${u.id_usuario}`}
                      className="card card-hover flex items-center gap-3 rounded-2xl p-4"
                    >
                      <Avatar src={u.img_usuario} name={u.nm_usuario} />
                      <div className="min-w-0">
                        <p className="font-bold truncate">@{u.nm_usuario}</p>
                        {u.bio_usuario && (
                          <p className="text-xs text-zinc-500 truncate">{u.bio_usuario}</p>
                        )}
                        <p className="text-xs text-zinc-600">
                          {u._count?.avaliacoes || 0} avaliações ·{' '}
                          {u._count?.seguidores || 0} seguidores
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {!discover.data?.reviews?.length &&
              !discover.data?.games?.length &&
              !discover.data?.users?.length && (
                <EmptyState
                  title="Nada para descobrir"
                  description="A comunidade ainda está começando. Seja o primeiro a avaliar!"
                />
              )}
          </div>
        )
      )}

      {/* ── Em alta ───────────────────────────────────────── */}
      {tab === 'trending' && (
        <div className="space-y-6">
          {/* Seletor de período */}
          <div className="flex gap-2 flex-wrap">
            {PERIODO_OPTS.map(p => (
              <button
                key={p.v}
                onClick={() => setPeriodo(p.v)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  periodo === p.v
                    ? 'bg-checkpoint-green text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {p.l}
              </button>
            ))}
          </div>

          {trending.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {/* Jogos em alta */}
              {(trending.data?.games?.length || 0) > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-black">🎮 Jogos em alta</h2>
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {trending.data!.games.map(g => (
                      <GameCard key={g.id_jogo} game={g} />
                    ))}
                  </div>
                </section>
              )}

              {/* Reviews populares */}
              {(trending.data?.reviews?.length || 0) > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-black">⭐ Reviews mais curtidas</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {trending.data!.reviews.map(r => (
                      <ReviewCard key={r.id_avaliacao} review={r} />
                    ))}
                  </div>
                </section>
              )}

              {/* Listas populares */}
              {(trending.data?.lists?.length || 0) > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-black">📋 Listas populares</h2>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {trending.data!.lists.map(l => (
                      <Link
                        key={l.id_lista}
                        to={`/listas/${l.id_lista}`}
                        className="card card-hover rounded-2xl overflow-hidden"
                      >
                        <div className="flex h-20 bg-zinc-950">
                          {(l.jogos?.slice(0, 4) || []).map(({ jogo }, i) => (
                            <div key={i} className="flex-1 overflow-hidden">
                              <img
                                src={jogo.img_jogo}
                                alt=""
                                onError={e => {
                                  (e.target as HTMLImageElement).src =
                                    'https://placehold.co/80x80/18181f/00e187?text=?';
                                }}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                          {(l.jogos?.length || 0) < 4 &&
                            Array.from({ length: 4 - (l.jogos?.length || 0) }).map((_, i) => (
                              <div key={i} className="flex-1 bg-zinc-900" />
                            ))}
                        </div>
                        <div className="p-3">
                          <p className="font-bold line-clamp-1">{l.nm_lista}</p>
                          <p className="text-xs text-zinc-500">
                            @{l.usuario?.nm_usuario} · ♥ {l.likes_count || 0}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {!trending.data?.games?.length &&
                !trending.data?.reviews?.length &&
                !trending.data?.lists?.length && (
                  <EmptyState
                    title="Nada em alta"
                    description={
                      periodo === 'semana'
                        ? 'Nenhuma atividade esta semana ainda.'
                        : periodo === 'mes'
                        ? 'Nenhuma atividade este mês ainda.'
                        : 'Nenhuma atividade registrada.'
                    }
                  />
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
