/**
 * Feed — v1.6
 * Timeline de atividades sociais + discover + trending
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, X, Users, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import { Header, ReviewCard, GameCard, EmptyState, Section, Avatar, Skeleton } from '../../components/ui';
import { Atividade, DiscoverData, TrendingData, UsuarioCard } from '../../types';

// ── Card de atividade ─────────────────────────────────────
function activityMessage(a: Atividade): { text: string; link?: string } {
  switch (a.tipo) {
    case 'AVALIOU_JOGO':
      return { text: `avaliou ${a.jogo?.nm_jogo || '?'} com ★ ${a.avaliacao ? (a.avaliacao.nota / 2).toFixed(1) : '?'}`, link: a.id_jogo ? `/jogos/${a.id_jogo}` : undefined };
    case 'CURTIU_REVIEW':
      return { text: `curtiu uma avaliação`, link: a.id_avaliacao ? `/reviews/${a.id_avaliacao}` : undefined };
    case 'CRIOU_LISTA':
      return { text: `criou a lista "${a.lista?.nm_lista || '?'}"`, link: a.id_lista ? `/listas/${a.id_lista}` : undefined };
    case 'ADICIONOU_JOGO_LISTA':
      return { text: `adicionou ${a.jogo?.nm_jogo || '?'} à lista "${a.lista?.nm_lista || '?'}"`, link: a.id_lista ? `/listas/${a.id_lista}` : undefined };
    case 'FAVORITOU_JOGO':
      return { text: `favoritou ${a.jogo?.nm_jogo || '?'}`, link: a.id_jogo ? `/jogos/${a.id_jogo}` : undefined };
    case 'MUDOU_STATUS':
      const statusLabel: Record<string, string> = { QUERO_JOGAR: 'quer jogar', JOGANDO: 'começou a jogar', ZERADO: 'zerou', ABANDONADO: 'abandonou' };
      return { text: `${statusLabel[a.dados_extras || ''] || 'mudou status de'} ${a.jogo?.nm_jogo || '?'}`, link: a.id_jogo ? `/jogos/${a.id_jogo}` : undefined };
    case 'SEGUIU_USUARIO':
      return { text: `começou a seguir @${a.usuario_alvo?.nm_usuario || '?'}`, link: a.id_usuario_alvo ? `/usuarios/${a.id_usuario_alvo}` : undefined };
    case 'CURTIU_LISTA':
      return { text: `curtiu a lista "${a.lista?.nm_lista || '?'}"`, link: a.id_lista ? `/listas/${a.id_lista}` : undefined };
    default:
      return { text: 'realizou uma ação' };
  }
}

function ActivityCard({ a }: { a: Atividade }) {
  const { text, link } = activityMessage(a);
  const timeAgo = formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR });

  const jogo = a.jogo;

  return (
    <article className="card flex items-start gap-3 rounded-2xl p-4">
      <Link to={`/usuarios/${a.id_usuario}`} className="flex-shrink-0">
        <Avatar src={a.usuario?.img_usuario} name={a.usuario?.nm_usuario} size="sm"/>
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed">
          <Link to={`/usuarios/${a.id_usuario}`} className="font-bold hover:text-checkpoint-green transition-colors">
            @{a.usuario?.nm_usuario}
          </Link>{' '}
          {link ? (
            <Link to={link} className="text-zinc-300 hover:text-checkpoint-green transition-colors">{text}</Link>
          ) : (
            <span className="text-zinc-300">{text}</span>
          )}
        </p>
        <p className="mt-1 text-xs text-zinc-600">{timeAgo}</p>
      </div>
      {jogo && (
        <Link to={`/jogos/${jogo.id_jogo}`} className="flex-shrink-0">
          <img src={jogo.img_jogo} alt={jogo.nm_jogo}
            onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/40x56/18181f/00e187?text=?`; }}
            className="h-14 w-10 rounded object-cover"/>
        </Link>
      )}
    </article>
  );
}

// ── Busca de usuários ─────────────────────────────────────
function UserSearch() {
  const [q, setQ]       = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef         = useRef<HTMLDivElement>(null);
  const debounced       = useDebounce(q, 300);

  const { data: results=[] } = useQuery<UsuarioCard[]>({
    queryKey: ['user-search-feed', debounced],
    queryFn:  () => api.get('/users/search', { params: { q: debounced } }).then(r => r.data),
    enabled:  debounced.length >= 2,
  });

  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 focus-within:border-checkpoint-green transition-colors">
        <Search size={16} className="text-zinc-500 flex-shrink-0"/>
        <input value={q} onFocus={() => debounced.length>=2 && setOpen(true)}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={e => e.key==='Escape' && (setOpen(false), setQ(''))}
          placeholder="Buscar jogadores por nome…"
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500"/>
        {q && <button onClick={() => { setQ(''); setOpen(false); }} aria-label="Limpar"><X size={14} className="text-zinc-500 hover:text-white"/></button>}
      </div>
      {open && debounced.length>=2 && (
        <div className="dropdown absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          {!results.length ? (
            <p className="p-4 text-sm text-zinc-400">Nenhum jogador encontrado.</p>
          ) : results.map(u => (
            <Link key={u.id_usuario} to={`/usuarios/${u.id_usuario}`} onClick={() => { setOpen(false); setQ(''); }}
              className="flex items-center gap-3 p-3 hover:bg-zinc-900 transition-colors">
              <Avatar src={u.img_usuario} name={u.nm_usuario} size="sm"/>
              <div>
                <p className="font-bold text-sm">@{u.nm_usuario}</p>
                <p className="text-xs text-zinc-400">{u._count?.avaliacoes||0} avaliações · {u._count?.seguidores||0} seguidores</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Trending ──────────────────────────────────────────────
function TrendingSection() {
  const [periodo, setPeriodo] = useState<'semana'|'mes'|'todos'>('semana');
  const { data: t } = useQuery<TrendingData>({
    queryKey: ['trending', periodo],
    queryFn:  () => api.get('/feed/trending', { params: { periodo } }).then(r => r.data),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <TrendingUp size={20} className="text-checkpoint-green"/>
        <h2 className="text-2xl font-black">Em alta</h2>
        <div className="ml-auto flex gap-1">
          {(['semana','mes','todos'] as const).map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${periodo===p?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {p==='semana'?'Semana':p==='mes'?'Mês':'Todos'}
            </button>
          ))}
        </div>
      </div>

      {t?.games && t.games.length > 0 && (
        <div>
          <p className="meta mb-3">Jogos mais avaliados</p>
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {t.games.map(g => <GameCard key={g.id_jogo} game={g}/>)}
          </div>
        </div>
      )}

      {t?.reviews && t.reviews.length > 0 && (
        <div>
          <p className="meta mb-3">Reviews mais curtidas</p>
          <div className="grid gap-4 md:grid-cols-2">
            {t.reviews.slice(0,4).map(r => <ReviewCard key={r.id_avaliacao} review={r}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feed principal ────────────────────────────────────────
export default function Feed() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<'mine'|'following'|'discover'|'trending'>(isAuthenticated ? 'following' : 'discover');

  const following = useQuery<Atividade[]>({
    queryKey: ['feed','following'],
    queryFn:  () => api.get('/feed/following').then(r => r.data),
    enabled:  isAuthenticated,
  });

  const mine = useQuery<Atividade[]>({
    queryKey: ['feed','mine'],
    queryFn:  () => api.get('/feed/me').then(r => r.data),
    enabled:  isAuthenticated,
  });

  const discover = useQuery<DiscoverData>({
    queryKey: ['feed','discover'],
    queryFn:  () => api.get('/feed/discover').then(r => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-8">
      <Header title="Feed" text="Acompanhe a comunidade Checkpoint."/>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {isAuthenticated && (
          <>
            <button onClick={() => setTab('mine')}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab==='mine'?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
              Minhas atividades
            </button>
            <button onClick={() => setTab('following')}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab==='following'?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
              Seguindo
            </button>
          </>
        )}
        <button onClick={() => setTab('discover')}
          className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab==='discover'?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
          Descobrir
        </button>
        <button onClick={() => setTab('trending')}
          className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab==='trending'?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
          <TrendingUp size={14}/> Em alta
        </button>
      </div>

      {/* Minhas atividades */}
      {tab === 'mine' && (
        <>
          {mine.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-20 rounded-2xl"/>)}</div>
          ) : !mine.data?.length ? (
            <EmptyState title="Nenhuma atividade ainda"
              description="Suas ações aparecem aqui: avaliações, favoritos, listas criadas e mais."
              action={<button onClick={() => setTab('discover')} className="rounded-xl bg-checkpoint-green px-5 py-2.5 text-sm font-bold text-black">Explorar</button>}/>
          ) : (
            <div className="space-y-3">
              {mine.data.map(a => <ActivityCard key={a.id_atividade} a={a}/>)}
            </div>
          )}
        </>
      )}

      {/* Timeline de atividades (seguindo) */}
      {tab === 'following' && (
        <>
          {following.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-20 rounded-2xl"/>)}</div>
          ) : !following.data?.length ? (
            <EmptyState title="Nenhuma atividade ainda"
              description="Siga outros jogadores para ver o que estão fazendo."
              action={<button onClick={() => setTab('discover')} className="rounded-xl bg-checkpoint-green px-5 py-2.5 text-sm font-bold text-black">Descobrir jogadores</button>}/>
          ) : (
            <div className="space-y-3">
              {following.data.map(a => <ActivityCard key={a.id_atividade} a={a}/>)}
            </div>
          )}
        </>
      )}

      {/* Descobrir */}
      {tab === 'discover' && (
        <div className="space-y-10">
          <div className="surface rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users size={18} className="text-checkpoint-green"/>
              <h2 className="text-lg font-black">Encontrar jogadores</h2>
            </div>
            <UserSearch/>
          </div>

          {(discover.data?.users?.length ?? 0) > 0 && (
            <Section title="Jogadores ativos">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {discover.data!.users.slice(0,8).map(u => (
                  <Link key={u.id_usuario} to={`/usuarios/${u.id_usuario}`} className="card card-hover flex items-center gap-3 rounded-2xl p-4">
                    <Avatar src={u.img_usuario} name={u.nm_usuario} size="md"/>
                    <div className="min-w-0">
                      <p className="font-bold truncate">@{u.nm_usuario}</p>
                      <p className="text-xs text-zinc-500">{u._count?.avaliacoes||0} av. · {u._count?.seguidores||0} seg.</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {(discover.data?.reviews?.length ?? 0) > 0 && (
            <Section title="Avaliações recentes">
              <div className="grid gap-4 md:grid-cols-2">
                {discover.data!.reviews.slice(0,6).map(r => <ReviewCard key={r.id_avaliacao} review={r}/>)}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Em alta */}
      {tab === 'trending' && <TrendingSection/>}
    </div>
  );
}
