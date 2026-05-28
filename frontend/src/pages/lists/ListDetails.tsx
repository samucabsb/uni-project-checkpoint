import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Plus, Trash2, ArrowUp, ArrowDown, Lock, Pencil, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lista } from '../../types';
import { Avatar, Button, Stars, Modal, Input, Skeleton } from '../../components/ui';

export function ListDetails() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const key = ['list', id];

  const [addModal, setAddModal]     = useState(false);
  const [editModal, setEditModal]   = useState(false);
  const [gameSearch, setGameSearch] = useState('');
  const [gameResults, setGameResults] = useState<{ id_jogo: number; nm_jogo: string; img_jogo: string }[]>([]);
  const [editForm, setEditForm]   = useState({ nm_lista: '', descricao: '', publica: true });
  const [likeState, setLikeState] = useState<{ count: number; curtiu: boolean } | null>(null);
  const [orderMode, setOrderMode] = useState(false);

  const { data: lista, isLoading } = useQuery<Lista>({
    queryKey: key,
    queryFn:  () => api.get<Lista>(`/lists/${id}`).then(r => r.data),
    enabled:  !!id,
  });

  // Sync edit form when lista loads
  useEffect(() => {
    if (lista) setEditForm({ nm_lista: lista.nm_lista, descricao: lista.descricao||'', publica: lista.publica });
  }, [lista]);

  const likeCount = likeState?.count  ?? (lista?.likes_count  || 0);
  const jaCurtiu  = likeState?.curtiu ?? (lista?.ja_curtiu    || false);
  const isOwner   = user?.id_usuario  === lista?.id_usuario;

  async function toggleLike() {
    if (!isAuthenticated) return toast('Faça login para curtir.', 'info');
    if (isOwner) return;
    try {
      if (jaCurtiu) { const r = await api.delete(`/lists/${id}/like`); setLikeState({ count: r.data.likes_count, curtiu: false }); }
      else           { const r = await api.post(`/lists/${id}/like`);  setLikeState({ count: r.data.likes_count, curtiu: true });  }
    } catch { toast('Erro ao curtir.', 'error'); }
  }

  async function searchGames(q: string) {
    setGameSearch(q);
    if (q.length < 2) { setGameResults([]); return; }
    try { const r = await api.get('/games/search', { params: { q } }); setGameResults(r.data); }
    catch {}
  }

  const addGame = useMutation({
    mutationFn: (id_jogo: number) => api.post(`/lists/${id}/games`, { id_jogo }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); setAddModal(false); setGameSearch(''); setGameResults([]); toast('Jogo adicionado!'); },
    onError:   () => toast('Erro ao adicionar.', 'error'),
  });

  const removeGame = useMutation({
    mutationFn: (id_jogo: number) => api.delete(`/lists/${id}/games/${id_jogo}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast('Jogo removido.'); },
    onError:   () => toast('Erro ao remover.', 'error'),
  });

  const editLista = useMutation({
    mutationFn: () => api.put(`/lists/${id}`, editForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); setEditModal(false); toast('Lista atualizada!'); },
    onError:   () => toast('Erro ao atualizar.', 'error'),
  });

  async function deleteLista() {
    if (!confirm('Excluir esta lista permanentemente?')) return;
    try { await api.delete(`/lists/${id}`); toast('Lista excluída.'); navigate('/listas'); }
    catch { toast('Erro ao excluir.', 'error'); }
  }

  async function moveGame(id_jogo: number, dir: 'up' | 'down') {
    if (!lista?.jogos) return;
    const arr = [...lista.jogos].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    const idx = arr.findIndex(j => j.jogo.id_jogo === id_jogo);
    if ((dir==='up' && idx<=0) || (dir==='down' && idx>=arr.length-1)) return;
    const swap = dir==='up' ? idx-1 : idx+1;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    const order = arr.map((j, i) => ({ id_jogo: j.jogo.id_jogo, position: i+1 }));
    try { await api.put(`/lists/${id}/games/order`, { order }); qc.invalidateQueries({ queryKey: key }); }
    catch { toast('Erro ao reordenar.', 'error'); }
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32 rounded-2xl"/><Skeleton className="h-64 rounded-2xl"/></div>;
  if (!lista) return <p className="text-zinc-400">Lista não encontrada.</p>;

  const jogosOrdenados = [...(lista.jogos||[])].sort((a,b) => (a.position??999)-(b.position??999));

  return (
    <div className="space-y-6">
      <div className="card rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-black">{lista.nm_lista}</h1>
              {!lista.publica && <Lock size={16} className="text-zinc-500" aria-label="Lista privada"/>}
            </div>
            {lista.descricao && <p className="mt-2 text-zinc-400">{lista.descricao}</p>}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <Link to={`/usuarios/${lista.id_usuario}`} className="flex items-center gap-2">
                <Avatar src={lista.usuario?.img_usuario} name={lista.usuario?.nm_usuario} size="sm"/>
                <span className="text-sm font-bold text-zinc-300">@{lista.usuario?.nm_usuario}</span>
              </Link>
              <span className="text-sm text-zinc-500">{jogosOrdenados.length} jogo{jogosOrdenados.length!==1?'s':''}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {!isOwner && (
              <button onClick={toggleLike} aria-label={jaCurtiu?'Descurtir':'Curtir lista'}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${jaCurtiu?'bg-checkpoint-green/10 text-checkpoint-green':'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                <Heart size={15} fill={jaCurtiu?'currentColor':'none'}/>{jaCurtiu?'Curtida':'Curtir'}{likeCount>0&&<span className="opacity-70">{likeCount}</span>}
              </button>
            )}
            {isOwner && likeCount>0 && <span className="flex items-center gap-1.5 text-sm text-zinc-500"><Heart size={14}/>{likeCount}</span>}
            {isOwner && (
              <>
                <button onClick={() => setOrderMode(v=>!v)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition ${orderMode?'bg-checkpoint-green text-black':'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                  {orderMode?<><Check size={14}/> Pronto</>:'Ordenar'}
                </button>
                <button onClick={() => setEditModal(true)} aria-label="Editar" className="rounded-xl bg-zinc-800 p-2.5 hover:bg-zinc-700 transition"><Pencil size={15}/></button>
                <button onClick={() => setAddModal(true)}  aria-label="Adicionar jogo" className="rounded-xl bg-checkpoint-green p-2.5 text-black hover:brightness-110 transition"><Plus size={15}/></button>
                <button onClick={deleteLista}              aria-label="Excluir lista"  className="rounded-xl bg-zinc-800 p-2.5 text-zinc-400 hover:bg-red-900/30 hover:text-red-400 transition"><Trash2 size={15}/></button>
              </>
            )}
          </div>
        </div>
      </div>

      {!jogosOrdenados.length ? (
        <div className="card rounded-2xl p-10 text-center">
          <p className="text-zinc-400">{isOwner?'Adicione jogos clicando em +.':'Esta lista ainda não tem jogos.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jogosOrdenados.map(({ jogo }, idx) => (
            <div key={jogo.id_jogo} className="card flex items-center gap-4 rounded-2xl p-3">
              {orderMode && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveGame(jogo.id_jogo,'up')}   disabled={idx===0}                     aria-label="Mover para cima"  className="rounded p-1 disabled:opacity-30 hover:bg-zinc-700 transition"><ArrowUp size={14}/></button>
                  <button onClick={() => moveGame(jogo.id_jogo,'down')} disabled={idx===jogosOrdenados.length-1} aria-label="Mover para baixo" className="rounded p-1 disabled:opacity-30 hover:bg-zinc-700 transition"><ArrowDown size={14}/></button>
                </div>
              )}
              <span className="w-6 flex-shrink-0 text-center text-sm font-black text-zinc-600">{idx+1}</span>
              <img src={jogo.img_jogo} alt={jogo.nm_jogo} onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/48x64/18181f/00e187?text=?';}} className="h-16 w-12 flex-shrink-0 rounded-lg object-cover"/>
              <div className="flex-1 min-w-0">
                <Link to={`/jogos/${jogo.id_jogo}`} className="font-bold hover:text-checkpoint-green transition-colors line-clamp-1">{jogo.nm_jogo}</Link>
                <div className="flex items-center gap-2 mt-0.5">
                  {jogo.genero && <p className="text-xs text-zinc-500 truncate">{jogo.genero}</p>}
                  {jogo.media  && <><span className="text-zinc-700">·</span><Stars value={jogo.media*2} size={11}/><span className="text-xs text-checkpoint-green font-bold">{jogo.media}</span></>}
                </div>
              </div>
              {isOwner && !orderMode && (
                <button onClick={() => removeGame.mutate(jogo.id_jogo)} aria-label={`Remover ${jogo.nm_jogo}`} className="flex-shrink-0 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={15}/></button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={addModal} onClose={() => { setAddModal(false); setGameSearch(''); setGameResults([]); }} title="Adicionar jogo">
        <div className="space-y-3">
          <Input value={gameSearch} onChange={e => searchGames(e.target.value)} placeholder="Buscar jogo…" autoFocus/>
          {gameResults.length>0 && (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-800 divide-y divide-zinc-800/50">
              {gameResults.map(g => (
                <button key={g.id_jogo} onClick={() => addGame.mutate(g.id_jogo)}
                  className="flex w-full items-center gap-3 p-3 hover:bg-zinc-800 transition-colors">
                  <img src={g.img_jogo} alt={g.nm_jogo} onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/36x48/18181f/00e187?text=?';}} className="h-12 w-9 rounded object-cover flex-shrink-0"/>
                  <span className="text-sm font-bold">{g.nm_jogo}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar lista">
        <div className="space-y-4">
          <Input label="Nome" value={editForm.nm_lista} onChange={e => setEditForm(f => ({...f, nm_lista: e.target.value}))}/>
          <Input label="Descrição" value={editForm.descricao} onChange={e => setEditForm(f => ({...f, descricao: e.target.value}))}/>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={editForm.publica} onChange={e => setEditForm(f => ({...f, publica: e.target.checked}))} className="h-4 w-4 accent-checkpoint-green rounded"/>
            <span className="text-sm text-zinc-300">Lista pública</span>
          </label>
          <Button onClick={() => editLista.mutate()} loading={editLista.isPending} className="w-full">Salvar</Button>
        </div>
      </Modal>
    </div>
  );
}
