import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Heart, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useReveal } from '../../hooks';
import { Header, Button, Modal, Input, TextArea, EmptyState, Skeleton, Avatar } from '../../components/ui';
import { Lista } from '../../types';

export function Lists() {
  useReveal();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ nm_lista: '', descricao: '', publica: true });

  const { data: listas=[], isLoading } = useQuery<Lista[]>({
    queryKey: ['lists', search],
    queryFn:  () => api.get('/lists', { params: { search } }).then(r => r.data),
    staleTime: 30_000,
  });

  async function handleLike(lista: Lista) {
    if (!isAuthenticated) return toast('Faça login para curtir.', 'info');
    try {
      if (lista.ja_curtiu) { await api.delete(`/lists/${lista.id_lista}/like`); }
      else                  { await api.post(`/lists/${lista.id_lista}/like`); }
      qc.invalidateQueries({ queryKey: ['lists'] });
    } catch { toast('Erro ao curtir.', 'error'); }
  }

  async function createLista() {
    if (!form.nm_lista.trim()) return toast('Nome é obrigatório.', 'error');
    try {
      await api.post('/lists', form);
      toast('Lista criada!');
      qc.invalidateQueries({ queryKey: ['lists'] });
      setModal(false); setForm({ nm_lista: '', descricao: '', publica: true });
    } catch { toast('Erro ao criar lista.', 'error'); }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        <Header title="Listas" text="Coleções curadas por jogadores da comunidade."/>
        {isAuthenticated && (
          <div className="sm:ml-auto flex-shrink-0">
            <Button onClick={() => setModal(true)} className="flex items-center gap-2 whitespace-nowrap">
              <Plus size={16}/> Nova lista
            </Button>
          </div>
        )}
      </div>

      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar listas por nome ou jogador…" className="max-w-sm"/>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i=><Skeleton key={i} className="h-40 rounded-2xl"/>)}
        </div>
      ) : !listas.length ? (
        <EmptyState title="Nenhuma lista encontrada" description={search ? 'Tente outro termo.' : 'Seja o primeiro a criar uma lista.'}
          action={isAuthenticated ? <Button onClick={() => setModal(true)} className="flex items-center gap-2"><Plus size={16}/> Criar lista</Button> : undefined}/>
      ) : (
        <div className="reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listas.map(l => {
            const isOwner = user?.id_usuario === l.id_usuario;
            return (
              <div key={l.id_lista} className="card card-hover rounded-2xl overflow-hidden flex flex-col">
                {/* Capas */}
                <div className="flex h-24 bg-zinc-950">
                  {(l.jogos?.slice(0,4) || []).map(({ jogo }, i) => (
                    <div key={i} className="flex-1 overflow-hidden">
                      <img src={jogo.img_jogo} alt={jogo.nm_jogo}
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/80x96/18181f/00e187?text=?`; }}
                        className="h-full w-full object-cover"/>
                    </div>
                  ))}
                  {(l.jogos?.length || 0) < 4 && Array.from({ length: 4 - (l.jogos?.length || 0) }).map((_, i) => (
                    <div key={i} className="flex-1 bg-zinc-900"/>
                  ))}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/listas/${l.id_lista}`} className="font-black hover:text-checkpoint-green transition-colors line-clamp-2 leading-snug">
                      {l.nm_lista}
                    </Link>
                    {!l.publica && <Lock size={14} className="flex-shrink-0 text-zinc-500 mt-0.5" aria-label="Lista privada"/>}
                  </div>

                  {l.descricao && <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{l.descricao}</p>}

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <Link to={`/usuarios/${l.id_usuario}`} className="flex items-center gap-1.5 min-w-0">
                      <Avatar src={l.usuario?.img_usuario} name={l.usuario?.nm_usuario} size="sm"/>
                      <span className="text-xs text-zinc-400 truncate">@{l.usuario?.nm_usuario}</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600">{l.jogos?.length||0} jogos</span>
                      {!isOwner && (
                        <button onClick={() => handleLike(l)} aria-label={l.ja_curtiu ? 'Descurtir lista' : 'Curtir lista'}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition ${l.ja_curtiu ? 'text-checkpoint-green' : 'text-zinc-500 hover:text-white'}`}>
                          <Heart size={13} fill={l.ja_curtiu ? 'currentColor' : 'none'}/>
                          {(l.likes_count||0) > 0 && l.likes_count}
                        </button>
                      )}
                      {isOwner && (l.likes_count||0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <Heart size={12}/> {l.likes_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nova lista">
        <div className="space-y-4">
          <Input label="Nome *" value={form.nm_lista} onChange={e => setForm(f => ({...f, nm_lista: e.target.value}))} placeholder="Ex: RPGs essenciais"/>
          <TextArea label="Descrição (opcional)" value={form.descricao} onChange={e => setForm(f => ({...f, descricao: e.target.value}))} placeholder="Sobre o que é esta lista?"/>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.publica} onChange={e => setForm(f => ({...f, publica: e.target.checked}))} className="h-4 w-4 accent-checkpoint-green rounded"/>
            <span className="text-sm text-zinc-300">Lista pública (visível para todos)</span>
          </label>
          <Button onClick={createLista} className="w-full">Criar lista</Button>
        </div>
      </Modal>
    </div>
  );
}
