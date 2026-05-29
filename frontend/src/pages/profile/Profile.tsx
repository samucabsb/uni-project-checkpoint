/**
 * Perfil — v1.7
 * Usa VitrineSection, EditProfileModal e componentes modularizados
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus, Trophy, Gamepad, Clock, Heart, Pencil } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Usuario } from '../../types';
import { Avatar, Stars, ReviewCard, Skeleton, Button } from '../../components/ui';
import { VitrineSection } from '../../components/vitrine/VitrineSection';
import { EditProfileModal } from '../../components/profile/EditProfileModal';

type Tab = 'visao' | 'avaliacoes' | 'listas' | 'diario';

export default function Profile() {
  const { id }    = useParams<{ id: string }>();
  const { user }  = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();

  const [tab, setTab]               = useState<Tab>('visao');
  const [followState, setFollowState] = useState<{ following: boolean; count: number } | null>(null);
  const [editOpen, setEditOpen]     = useState(false);

  const profileKey = ['profile', id];
  const { data: perfil, isLoading } = useQuery<Usuario>({
    queryKey: profileKey,
    queryFn:  () => api.get(`/users/${id}`).then(r => r.data),
    enabled:  !!id,
  });

  const isMe        = user?.id_usuario === Number(id);
  const isFollowing = followState?.following ?? (perfil?.isFollowing ?? false);
  const seguidores  = followState?.count     ?? (perfil?._count?.seguidores ?? 0);

  async function toggleFollow() {
    if (!user) return toast('Faça login para seguir.', 'info');
    try {
      if (isFollowing) {
        await api.delete(`/users/${id}/unfollow`);
        setFollowState({ following: false, count: seguidores - 1 });
        toast('Deixou de seguir.');
      } else {
        await api.post(`/users/${id}/follow`);
        setFollowState({ following: true, count: seguidores + 1 });
        toast('Seguindo!');
      }
      qc.invalidateQueries({ queryKey: profileKey });
    } catch { toast('Erro ao seguir.', 'error'); }
  }

  if (isLoading) return (
    <div className="space-y-5">
      <Skeleton className="h-48 rounded-3xl"/>
      <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i=><Skeleton key={i} className="aspect-[2/3] rounded-2xl"/>)}</div>
      <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i=><Skeleton key={i} className="h-24 rounded-2xl"/>)}</div>
    </div>
  );
  if (!perfil) return <p className="text-zinc-400">Usuário não encontrado.</p>;

  const vitrine      = (perfil.status_jogos || []).filter(s => s.top_position !== null).sort((a,b) => (a.top_position ?? 99) - (b.top_position ?? 99));
  const estatisticas = perfil.estatisticas  || { zerados: 0, jogando: 0, quero_jogar: 0, favoritos: 0 };
  const totalAvs     = perfil._count?.avaliacoes || 0;
  const seguindo     = perfil._count?.seguindo ?? 0;
  const avgNota      = totalAvs > 0 && (perfil.avaliacoes?.length ?? 0) > 0
    ? (perfil.avaliacoes!.reduce((s, a) => s + a.nota, 0) / perfil.avaliacoes!.length / 2).toFixed(1)
    : null;

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="card rounded-3xl p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar src={perfil.img_usuario} name={perfil.nm_usuario} size="lg"/>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-black">@{perfil.nm_usuario}</h1>
                {perfil.tipo_usuario === 'ADMIN' && (
                  <span className="mt-1 inline-block rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs font-bold text-yellow-400">Admin</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isMe && (
                  <button onClick={() => setEditOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-bold hover:bg-zinc-700 transition">
                    <Pencil size={13}/> Editar perfil
                  </button>
                )}
                {!isMe && (
                  <button onClick={toggleFollow} aria-label={isFollowing?'Deixar de seguir':'Seguir'}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${isFollowing ? 'bg-zinc-800 text-zinc-300 hover:bg-red-900/20 hover:text-red-400' : 'bg-checkpoint-green text-black'}`}>
                    {isFollowing ? <><UserMinus size={14}/> Seguindo</> : <><UserPlus size={14}/> Seguir</>}
                  </button>
                )}
              </div>
            </div>
            {perfil.bio_usuario && <p className="mt-2 text-sm text-zinc-400">{perfil.bio_usuario}</p>}
            <div className="mt-3 flex flex-wrap gap-5 text-sm">
              <span><b className="font-black">{totalAvs}</b> <span className="text-zinc-400">avaliações</span></span>
              <span><b className="font-black">{seguidores}</b> <span className="text-zinc-400">seguidores</span></span>
              <span><b className="font-black">{seguindo}</b> <span className="text-zinc-400">seguindo</span></span>
              {avgNota && <span><b className="font-black text-checkpoint-green">★ {avgNota}</b> <span className="text-zinc-400">média</span></span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Vitrine ─────────────────────────────────────────── */}
      <VitrineSection vitrine={vitrine} isOwner={isMe} profileId={Number(id)}/>

      {/* ── Estatísticas ────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Trophy size={16}/>, label: 'Zerados',     val: estatisticas.zerados     },
          { icon: <Gamepad size={16}/>,label: 'Jogando',     val: estatisticas.jogando     },
          { icon: <Clock size={16}/>,  label: 'Quero jogar', val: estatisticas.quero_jogar },
          { icon: <Heart size={16}/>,  label: 'Favoritos',   val: estatisticas.favoritos   },
        ].map(({ icon, label, val }) => (
          <div key={label} className="card rounded-2xl p-4 text-center">
            <div className="flex justify-center text-checkpoint-green mb-2">{icon}</div>
            <p className="text-2xl font-black">{val}</p>
            <p className="text-xs text-zinc-500 mt-1">{label}</p>
          </div>
        ))}
      </section>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {([['visao','Visão geral'],['avaliacoes','Avaliações'],['listas','Listas'],['diario','Diário']] as [Tab,string][]).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab===t?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'visao' && (
        <div className="space-y-6">
          {(perfil.avaliacoes?.length||0) > 0 && (
            <div>
              <h3 className="mb-3 font-black">Últimas avaliações</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {perfil.avaliacoes!.slice(0,4).map(a => <ReviewCard key={a.id_avaliacao} review={a}/>)}
              </div>
              {(perfil.avaliacoes?.length||0) > 4 && (
                <button onClick={() => setTab('avaliacoes')} className="mt-3 text-sm text-zinc-500 hover:text-white transition-colors">Ver todas →</button>
              )}
            </div>
          )}
          {(perfil.listas?.length||0) > 0 && (
            <div>
              <h3 className="mb-3 font-black">Listas recentes</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {perfil.listas!.slice(0,2).map(l => (
                  <Link key={l.id_lista} to={`/listas/${l.id_lista}`} className="card card-hover flex items-center gap-3 rounded-2xl p-4">
                    <div className="flex h-12 w-12 flex-shrink-0 gap-0.5 overflow-hidden rounded-xl">
                      {(l.jogos?.slice(0,2)||[]).map(({jogo},i) => (
                        <img key={i} src={jogo.img_jogo} alt="" onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/24x48/18181f/00e187?text=?';}} className="h-full flex-1 object-cover object-top"/>
                      ))}
                      {(l.jogos?.length||0)<2 && <div className="h-full flex-1 bg-zinc-800"/>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{l.nm_lista}</p>
                      <p className="text-xs text-zinc-500">{l.jogos?.length||0} jogos</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {(perfil.avaliacoes?.length||0)===0 && (perfil.listas?.length||0)===0 && (
            <div className="card rounded-2xl p-10 text-center"><p className="text-zinc-400">Nenhuma atividade registrada ainda.</p></div>
          )}
        </div>
      )}

      {tab === 'avaliacoes' && (
        <div>
          {!(perfil.avaliacoes?.length) ? <p className="text-zinc-400">Nenhuma avaliação.</p> : (
            <div className="grid gap-4 md:grid-cols-2">
              {perfil.avaliacoes!.map(a => <ReviewCard key={a.id_avaliacao} review={a}/>)}
            </div>
          )}
        </div>
      )}

      {tab === 'listas' && (
        <div>
          {!(perfil.listas?.length) ? <p className="text-zinc-400">Nenhuma lista.</p> : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {perfil.listas!.map(l => (
                <Link key={l.id_lista} to={`/listas/${l.id_lista}`} className="card card-hover rounded-2xl overflow-hidden">
                  <div className="flex h-20 bg-zinc-950">
                    {(l.jogos?.slice(0,4)||[]).map(({jogo},i) => (
                      <div key={i} className="flex-1 overflow-hidden"><img src={jogo.img_jogo} alt="" onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/80x80/18181f/00e187?text=?';}} className="h-full w-full object-cover object-top"/></div>
                    ))}
                    {(l.jogos?.length||0)<4 && Array.from({length:4-(l.jogos?.length||0)}).map((_,i)=><div key={i} className="flex-1 bg-zinc-900"/>)}
                  </div>
                  <div className="p-3">
                    <p className="font-bold line-clamp-1">{l.nm_lista}</p>
                    <p className="text-xs text-zinc-500">{l.jogos?.length||0} jogos · {l.likes_count||0} ♥</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'diario' && <DiarioPublico userId={Number(id)} isMe={isMe}/>}

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        userId={Number(id)}
        current={{ bio: perfil.bio_usuario, img: perfil.img_usuario }}
      />
    </div>
  );
}

function DiarioPublico({ userId, isMe }: { userId: number; isMe: boolean }) {
  const { data: entries=[] } = useQuery({
    queryKey: ['diary-user', userId],
    queryFn:  () => api.get(`/diary/user/${userId}`).then(r => r.data),
  });

  if (!entries.length) return (
    <p className="text-zinc-400">
      {isMe ? <Link to="/diario" className="hover:text-checkpoint-green transition-colors">Ir para o diário →</Link> : 'Nenhuma entrada no diário.'}
    </p>
  );

  return (
    <div className="space-y-3">
      {entries.slice(0,8).map((e: { id_diario: number; data_jogada: string; jogo: { id_jogo: number; nm_jogo: string; img_jogo: string }; nota?: number; comentario?: string }) => (
        <div key={e.id_diario} className="card flex items-center gap-4 rounded-2xl p-3">
          <img src={e.jogo.img_jogo} alt={e.jogo.nm_jogo} onError={ev=>{(ev.target as HTMLImageElement).src='https://placehold.co/36x48/18181f/00e187?text=?';}} className="h-14 w-10 rounded-lg object-cover object-top flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <Link to={`/jogos/${e.jogo.id_jogo}`} className="font-bold text-sm hover:text-checkpoint-green transition-colors line-clamp-1">{e.jogo.nm_jogo}</Link>
            <p className="text-xs text-zinc-500">{new Date(e.data_jogada).toLocaleDateString('pt-BR')}</p>
          </div>
          {e.nota && <div className="flex-shrink-0"><Stars value={e.nota} size={12}/></div>}
        </div>
      ))}
    </div>
  );
}
