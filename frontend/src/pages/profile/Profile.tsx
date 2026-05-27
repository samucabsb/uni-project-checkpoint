/**
 * Perfil do Usuário — v1.5
 * - PÚBLICO: não exige login (auth opcional para seguir/isFollowing)
 * - Vitrine (Top 4) em destaque no topo
 * - Estatísticas da biblioteca
 * - Modal de seguidores/seguindo clicáveis
 * - Aba Visão Geral, Reviews, Listas, Biblioteca
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus, Pencil, Check, X as XIcon, Search } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Avatar, Button, GameCard, ReviewCard, Stars, Skeleton, Modal, Input } from '../../components/ui';
import { Usuario, StatusJogo, Lista, UsuarioCard } from '../../types';

type Tab = 'visao_geral' | 'reviews' | 'listas' | 'biblioteca';
const TAB_LABEL: Record<Tab, string> = {
  visao_geral: 'Visão Geral',
  reviews:     'Avaliações',
  listas:      'Listas',
  biblioteca:  'Biblioteca',
};
const STATUS_TAB = ['TODOS','QUERO_JOGAR','JOGANDO','ZERADO','ABANDONADO','FAVORITOS'] as const;

// Modal: lista de seguidores ou seguindo
function UserListModal({ open, onClose, title, endpoint }: {
  open: boolean; onClose: ()=>void; title: string; endpoint: string;
}) {
  const [q, setQ] = useState('');
  const { data: users = [], isLoading } = useQuery<UsuarioCard[]>({
    queryKey: ['follow-list', endpoint],
    queryFn:  () => api.get(endpoint).then(r => r.data),
    enabled:  open,
  });
  const filtered = users.filter(u => u.nm_usuario.toLowerCase().includes(q.toLowerCase()));

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <Input placeholder="Filtrar..." value={q} onChange={e => setQ(e.target.value)} className="mb-4" />
      <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="flex items-center gap-3"><div className="h-11 w-11 animate-pulse rounded-full bg-zinc-800" /><div className="h-4 flex-1 animate-pulse rounded bg-zinc-800"/></div>)
        ) : !filtered.length ? (
          <p className="text-center text-zinc-400 py-4">Nenhum resultado</p>
        ) : filtered.map(u => (
          <Link key={u.id_usuario} to={`/usuarios/${u.id_usuario}`} onClick={onClose}
            className="flex items-center gap-3 rounded-xl p-2 hover:bg-zinc-900 transition-colors">
            <Avatar src={u.img_usuario} name={u.nm_usuario} size="sm" />
            <div>
              <p className="font-bold text-sm">@{u.nm_usuario}</p>
              <p className="text-xs text-zinc-400">{u._count?.avaliacoes||0} avaliações</p>
            </div>
          </Link>
        ))}
      </div>
    </Modal>
  );
}

// Vitrine: 4 slots do jogo favoritos do usuário
function Vitrine({ items }: { items: StatusJogo[] }) {
  if (!items.length) return (
    <p className="text-sm text-zinc-500 italic">Nenhum jogo na Vitrine ainda.</p>
  );
  return (
    <div className="grid grid-cols-4 gap-3">
      {[1,2,3,4].map(pos => {
        const item = items.find(i => i.top_position === pos);
        return item ? (
          <Link key={pos} to={`/jogos/${item.jogo.id_jogo}`} className="group">
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-zinc-900 relative">
              <img src={item.jogo.img_jogo} alt={item.jogo.nm_jogo}
                className="h-full w-full object-cover transition group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                <p className="text-xs font-bold line-clamp-2">{item.jogo.nm_jogo}</p>
              </div>
            </div>
          </Link>
        ) : (
          <div key={pos} className="aspect-[3/4] rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 flex items-center justify-center text-zinc-600 text-2xl">
            {pos}
          </div>
        );
      })}
    </div>
  );
}

// Slot de vitrine editável (owner view)
function VitrineEditor({
  items, library, onAdd, onRemove
}: {
  items: StatusJogo[];
  library: StatusJogo[];
  onAdd: (item: StatusJogo, pos: number) => void;
  onRemove: (pos: number) => void;
}) {
  const [searchVal, setSearchVal] = useState('');
  const [targetPos, setTargetPos] = useState<number|null>(null);

  const eligible = library.filter(l =>
    l.nm_usuario !== undefined || true  // todos da biblioteca
  ).filter(l => l.jogo.nm_jogo.toLowerCase().includes(searchVal.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(pos => {
          const item = items.find(i => i.top_position === pos);
          return (
            <div key={pos} className="relative group">
              <div
                onClick={() => setTargetPos(pos)}
                className={`aspect-[3/4] overflow-hidden rounded-xl border-2 cursor-pointer transition ${targetPos===pos?'border-checkpoint-green':'border-dashed border-zinc-700'} bg-zinc-950/50 relative`}
              >
                {item ? (
                  <>
                    <img src={item.jogo.img_jogo} className="h-full w-full object-cover" alt="" />
                    <button onClick={e=>{e.stopPropagation();onRemove(pos);}}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition">
                      <XIcon size={10}/>
                    </button>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-600 text-3xl font-black">{pos}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {targetPos && (
        <div className="surface rounded-xl p-4">
          <p className="mb-2 text-sm font-bold text-zinc-300">Escolher jogo para posição {targetPos}:</p>
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-zinc-400"/>
            <input value={searchVal} onChange={e=>setSearchVal(e.target.value)} placeholder="Buscar na biblioteca..." className="flex-1 bg-transparent text-sm outline-none"/>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {eligible.slice(0,10).map(l => (
              <button key={l.id_status} onClick={()=>{ onAdd(l, targetPos); setTargetPos(null); setSearchVal(''); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-zinc-800 transition">
                <img src={l.jogo.img_jogo} className="h-10 w-7 rounded object-cover flex-shrink-0"/>
                <span className="text-sm truncate">{l.jogo.nm_jogo}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { id }    = useParams<{ id: string }>();
  const { user, refreshMe } = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();

  const [tab, setTab]         = useState<Tab>('visao_geral');
  const [statusTab, setStatusTab] = useState<string>('TODOS');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ nm_usuario: '', bio_usuario: '', img_usuario: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [following, setFollowing]   = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [savingVitrine, setSavingVitrine] = useState(false);

  const { data: perfil, isLoading } = useQuery<Usuario>({
    queryKey: ['profile', id],
    queryFn:  () => api.get('/users/' + id).then(r => r.data),
  });

  const { data: library = [] } = useQuery<StatusJogo[]>({
    queryKey: ['library'],
    queryFn:  () => api.get('/library').then(r => r.data),
    enabled:  user?.id_usuario === Number(id),
  });

  const isOwner = user?.id_usuario === Number(id);
  const isAdmin = user?.tipo_usuario === 'ADMIN';

  useEffect(() => {
    if (perfil) {
      setFollowing(perfil.isFollowing || false);
      if (isOwner) setEditForm({
        nm_usuario:  perfil.nm_usuario,
        bio_usuario: perfil.bio_usuario || '',
        img_usuario: perfil.img_usuario || '',
      });
    }
  }, [perfil?.id_usuario]);

  async function toggleFollow() {
    if (!user) { toast('Faça login para seguir.', 'info'); return; }
    try {
      if (following) { await api.delete(`/users/${id}/follow`); toast('Deixou de seguir.'); }
      else           { await api.post(`/users/${id}/follow`);   toast('Agora você está seguindo!'); }
      setFollowing(f => !f);
      qc.invalidateQueries({ queryKey: ['profile', id] });
    } catch { toast('Erro ao atualizar.', 'error'); }
  }

  async function saveProfile() {
    setSavingEdit(true);
    try {
      await api.put('/users/' + id, editForm);
      toast('Perfil atualizado!');
      setEditMode(false);
      await refreshMe();
      qc.invalidateQueries({ queryKey: ['profile', id] });
    } catch { toast('Erro ao salvar perfil.', 'error'); }
    finally { setSavingEdit(false); }
  }

  async function addToVitrine(item: StatusJogo, pos: number) {
    setSavingVitrine(true);
    try {
      const vitrine = (library).filter(l => l.top_position !== null && l.top_position !== pos && l.jogo.id_jogo !== item.jogo.id_jogo)
        .map(v => ({ id_jogo: v.jogo.id_jogo, position: v.top_position as number }));
      await api.put('/library/vitrine', { items: [...vitrine, { id_jogo: item.jogo.id_jogo, position: pos }] });
      toast(`Posição ${pos} atualizada!`);
      qc.invalidateQueries({ queryKey: ['library'] });
      qc.invalidateQueries({ queryKey: ['profile', id] });
    } catch { toast('Erro ao atualizar Vitrine.', 'error'); }
    finally { setSavingVitrine(false); }
  }

  async function removeFromVitrine(pos: number) {
    setSavingVitrine(true);
    try {
      const vitrine = (library).filter(l => l.top_position !== null && l.top_position !== pos)
        .map(v => ({ id_jogo: v.jogo.id_jogo, position: v.top_position as number }));
      await api.put('/library/vitrine', { items: vitrine });
      toast('Removido da Vitrine.');
      qc.invalidateQueries({ queryKey: ['library'] });
      qc.invalidateQueries({ queryKey: ['profile', id] });
    } catch { toast('Erro ao remover da Vitrine.', 'error'); }
    finally { setSavingVitrine(false); }
  }

  if (isLoading) return (
    <div className="space-y-6">
      <div className="surface rounded-3xl p-8 flex gap-6 items-center">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-3 flex-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72" /></div>
      </div>
    </div>
  );

  if (!perfil) return <div className="card rounded-3xl p-10 text-center"><h2 className="text-2xl font-black">Usuário não encontrado</h2></div>;

  const vitrine        = (isOwner ? library : perfil.status_jogos || []).filter(s => s.top_position !== null);
  const libItems       = isOwner ? library : (perfil.status_jogos || []);
  const filteredLib    = statusTab === 'TODOS'    ? libItems
    : statusTab === 'FAVORITOS' ? libItems.filter(l => l.favorito)
    : libItems.filter(l => l.status === statusTab);

  const stats = perfil.estatisticas;

  return (
    <div className="space-y-8">
      {/* Header do perfil */}
      <section className="surface rounded-3xl p-8">
        {editMode ? (
          <div className="space-y-4">
            <h2 className="text-xl font-black">Editar perfil</h2>
            <Input label="Username" value={editForm.nm_usuario} onChange={e => setEditForm(f=>({...f,nm_usuario:e.target.value}))} />
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">Bio</span>
              <textarea value={editForm.bio_usuario} onChange={e => setEditForm(f=>({...f,bio_usuario:e.target.value}))} maxLength={200}
                className="min-h-20 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green transition-colors"/>
              <p className="mt-1 text-right text-xs text-zinc-500">{editForm.bio_usuario.length}/200</p>
            </label>
            <Input label="URL do Avatar" type="url" placeholder="https://..." value={editForm.img_usuario} onChange={e => setEditForm(f=>({...f,img_usuario:e.target.value}))} />
            {editForm.img_usuario && (
              <div className="flex items-center gap-3">
                <img src={editForm.img_usuario} className="h-12 w-12 rounded-full object-cover border border-zinc-700" alt="Preview" onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
                <span className="text-xs text-zinc-400">Preview</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button loading={savingEdit} onClick={saveProfile}><Check size={16}/>Salvar</Button>
              <Button variant="secondary" onClick={()=>setEditMode(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-6">
            <Avatar src={perfil.img_usuario} name={perfil.nm_usuario} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black">@{perfil.nm_usuario}</h1>
                {perfil.tipo_usuario === 'ADMIN' && (
                  <span className="rounded-full bg-checkpoint-green/10 px-3 py-1 text-xs font-bold text-checkpoint-green">ADMIN</span>
                )}
              </div>
              {perfil.bio_usuario && <p className="mt-2 text-zinc-400">{perfil.bio_usuario}</p>}

              {/* Contadores — clicáveis */}
              <div className="mt-3 flex flex-wrap gap-5">
                <button onClick={() => setShowFollowers(true)} className="text-sm hover:text-checkpoint-green transition-colors">
                  <strong>{perfil._count?.seguidores || 0}</strong> <span className="text-zinc-400">seguidores</span>
                </button>
                <button onClick={() => setShowFollowing(true)} className="text-sm hover:text-checkpoint-green transition-colors">
                  <strong>{perfil._count?.seguindo || 0}</strong> <span className="text-zinc-400">seguindo</span>
                </button>
                <span className="text-sm">
                  <strong>{perfil._count?.avaliacoes || 0}</strong> <span className="text-zinc-400">avaliações</span>
                </span>
              </div>

              {/* Estatísticas da biblioteca */}
              {stats && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {[
                    { l:'Zerados',     v: stats.zerados      },
                    { l:'Jogando',     v: stats.jogando      },
                    { l:'Quero jogar', v: stats.quero_jogar  },
                    { l:'Favoritos',   v: stats.favoritos    },
                  ].map(({ l, v }) => (
                    <div key={l} className="card rounded-xl px-3 py-2 text-center">
                      <p className="text-lg font-black text-checkpoint-green">{v}</p>
                      <p className="text-xs text-zinc-400">{l}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {isOwner ? (
                <Button variant="secondary" onClick={() => setEditMode(true)}><Pencil size={14}/>Editar</Button>
              ) : user && (
                <Button variant={following ? 'secondary' : 'primary'} onClick={toggleFollow}>
                  {following ? <><UserMinus size={14}/>Deixar de seguir</> : <><UserPlus size={14}/>Seguir</>}
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Vitrine */}
      <section className="surface rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black">Vitrine</h2>
          {savingVitrine && <span className="text-xs text-zinc-400 animate-pulse">Salvando…</span>}
        </div>
        {isOwner ? (
          <VitrineEditor
            items={vitrine}
            library={library}
            onAdd={addToVitrine}
            onRemove={pos => removeFromVitrine(pos)}
          />
        ) : (
          <Vitrine items={vitrine} />
        )}
      </section>

      {/* Abas */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(TAB_LABEL) as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab===t?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {/* Visão Geral */}
      {tab === 'visao_geral' && (
        <div className="space-y-6">
          {(perfil.avaliacoes?.length || 0) > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-black">Avaliações recentes</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {perfil.avaliacoes!.slice(0,4).map(r => <ReviewCard key={r.id_avaliacao} review={r} />)}
              </div>
            </div>
          )}
          {(perfil.listas?.filter(l=>l.publica).length||0) > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-black">Listas</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {perfil.listas!.filter(l=>l.publica).slice(0,4).map(l => (
                  <Link key={l.id_lista} to={`/listas/${l.id_lista}`} className="card card-hover rounded-2xl p-4">
                    <p className="font-black hover:text-checkpoint-green transition-colors">{l.nm_lista}</p>
                    <p className="mt-1 text-xs text-zinc-500">{l.jogos?.length||0} jogos</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reviews */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          {!perfil.avaliacoes?.length ? (
            <div className="card rounded-3xl p-10 text-center text-zinc-400">Nenhuma avaliação publicada.</div>
          ) : perfil.avaliacoes.map(r => <ReviewCard key={r.id_avaliacao} review={r} />)}
        </div>
      )}

      {/* Listas */}
      {tab === 'listas' && (
        <div className="grid gap-4 md:grid-cols-2">
          {!perfil.listas?.length ? (
            <div className="card rounded-3xl p-10 text-center text-zinc-400 md:col-span-2">Nenhuma lista criada.</div>
          ) : perfil.listas.filter(l => isOwner || l.publica).map((l: Lista) => (
            <Link key={l.id_lista} to={`/listas/${l.id_lista}`} className="card card-hover rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-black hover:text-checkpoint-green transition-colors">{l.nm_lista}</h3>
                {!l.publica && <span className="text-xs text-zinc-500 border border-zinc-700 rounded px-2 py-0.5">Privada</span>}
              </div>
              <p className="mt-1 text-xs text-zinc-500">{l.jogos?.length||0} jogos</p>
              {l.jogos && l.jogos.length > 0 && (
                <div className="mt-3 flex gap-1.5">
                  {l.jogos.slice(0,5).map(({jogo}) => (
                    <img key={jogo.id_jogo} src={jogo.img_jogo} className="h-16 w-11 rounded object-cover" alt={jogo.nm_jogo}/>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Biblioteca */}
      {tab === 'biblioteca' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_TAB.map(s => (
              <button key={s} onClick={() => setStatusTab(s)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${statusTab===s?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                {s.replace('_',' ')}
              </button>
            ))}
          </div>
          {!filteredLib.length ? (
            <div className="card rounded-3xl p-10 text-center text-zinc-400">Nenhum jogo aqui.</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredLib.map((s: StatusJogo) => <GameCard key={s.id_status} game={s.jogo} />)}
            </div>
          )}
        </div>
      )}

      {/* Modais seguidores/seguindo */}
      <UserListModal open={showFollowers} onClose={() => setShowFollowers(false)}
        title={`Seguidores de @${perfil.nm_usuario}`}
        endpoint={`/users/${id}/followers`} />
      <UserListModal open={showFollowing} onClose={() => setShowFollowing(false)}
        title={`Quem @${perfil.nm_usuario} segue`}
        endpoint={`/users/${id}/following`} />
    </div>
  );
}
