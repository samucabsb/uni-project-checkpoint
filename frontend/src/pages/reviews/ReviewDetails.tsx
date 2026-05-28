import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, ThumbsUp, Send, Trash2, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Avaliacao, Comentario } from '../../types';
import { Avatar, Stars, Button, TextArea, Skeleton } from '../../components/ui';

export default function ReviewDetails() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [texto, setTexto] = useState('');

  const { data: review, isLoading } = useQuery<Avaliacao>({
    queryKey: ['review', id],
    queryFn:  () => api.get(`/reviews/${id}`).then(r => r.data),
    enabled:  !!id,
  });

  const { data: comentarios=[] } = useQuery<Comentario[]>({
    queryKey: ['review-comments', id],
    queryFn:  () => api.get(`/reviews/${id}/comments`).then(r => r.data),
    enabled:  !!id,
  });

  const [likes, setLikes]   = useState<number | null>(null);
  const [curtiu, setCurtiu] = useState<boolean | null>(null);
  const likeCount = likes  ?? (review?.likes_count  || 0);
  const jaCurtiu  = curtiu ?? (review?.ja_curtiu     || false);
  const isMine    = user?.id_usuario === review?.id_usuario;

  async function toggleLike() {
    if (!isAuthenticated) return toast('Faça login para curtir.', 'info');
    if (isMine) return toast('Você não pode curtir sua própria avaliação.', 'info');
    try {
      if (jaCurtiu) { const r = await api.delete(`/reviews/${id}/like`); setLikes(r.data.likes_count); setCurtiu(false); }
      else           { const r = await api.post(`/reviews/${id}/like`);  setLikes(r.data.likes_count); setCurtiu(true);  }
    } catch { toast('Erro ao curtir.', 'error'); }
  }

  const addComment = useMutation({
    mutationFn: () => api.post(`/reviews/${id}/comments`, { texto }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['review-comments', id] }); setTexto(''); toast('Comentário adicionado!'); },
    onError:   () => toast('Erro ao comentar.', 'error'),
  });

  const delComment = useMutation({
    mutationFn: (cid: number) => api.delete(`/reviews/comments/${cid}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['review-comments', id] }); toast('Comentário excluído.'); },
    onError:   () => toast('Erro ao excluir.', 'error'),
  });

  async function deleteReview() {
    if (!confirm('Excluir esta avaliação?')) return;
    try { await api.delete(`/reviews/${id}`); toast('Avaliação excluída.'); navigate(-1); }
    catch { toast('Erro ao excluir.', 'error'); }
  }

  if (isLoading) return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Skeleton className="h-8 w-32"/><Skeleton className="h-48 rounded-2xl"/><Skeleton className="h-32 rounded-2xl"/>
    </div>
  );
  if (!review) return <div className="py-16 text-center"><p className="text-zinc-400">Avaliação não encontrada.</p><Button className="mt-4" onClick={() => navigate(-1)}>Voltar</Button></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft size={16}/> Voltar
      </button>

      <article className="card rounded-3xl overflow-hidden">
        {review.jogo && (
          <Link to={`/jogos/${review.jogo.id_jogo}`}
            className="flex items-center gap-4 border-b border-zinc-800 p-5 hover:bg-zinc-800/30 transition-colors">
            <img src={review.jogo.img_jogo} alt={review.jogo.nm_jogo}
              onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/60x80/18181f/00e187?text=${encodeURIComponent(review.jogo!.nm_jogo.slice(0,2))}`; }}
              className="h-20 w-14 rounded-lg object-cover flex-shrink-0"/>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Avaliação de</p>
              <h2 className="text-xl font-black">{review.jogo.nm_jogo}</h2>
              {review.jogo.genero && <p className="text-sm text-zinc-400">{review.jogo.genero}</p>}
            </div>
          </Link>
        )}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Link to={`/usuarios/${review.usuario?.id_usuario}`}><Avatar src={review.usuario?.img_usuario} name={review.usuario?.nm_usuario}/></Link>
            <div>
              <Link to={`/usuarios/${review.usuario?.id_usuario}`} className="font-bold hover:text-checkpoint-green transition-colors">@{review.usuario?.nm_usuario}</Link>
              <p className="text-xs text-zinc-500">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR })}</p>
            </div>
            {isMine && <button onClick={deleteReview} aria-label="Excluir" className="ml-auto text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>}
          </div>
          <div className="flex items-center gap-3">
            <Stars value={review.nota} size={22}/>
            <span className="text-2xl font-black text-checkpoint-green">{(review.nota/2).toFixed(1)}</span>
          </div>
          {review.data_jogada && <p className="text-xs text-zinc-500">Jogado em {new Date(review.data_jogada).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p>}
          {review.comentario && <p className="text-base leading-relaxed text-zinc-200">{review.comentario}</p>}
          <div className="flex items-center gap-3 border-t border-zinc-800 pt-4">
            <button onClick={toggleLike} disabled={isMine} aria-label={jaCurtiu?'Descurtir':'Curtir'}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${jaCurtiu?'bg-checkpoint-green/10 text-checkpoint-green':'bg-zinc-800 text-zinc-400 hover:text-white disabled:cursor-default'}`}>
              <ThumbsUp size={16} fill={jaCurtiu?'currentColor':'none'}/>{jaCurtiu?'Curtido':'Curtir'}{likeCount>0&&<span className="opacity-60">{likeCount}</span>}
            </button>
            <div className="flex items-center gap-1.5 text-sm text-zinc-500"><MessageSquare size={14}/>{comentarios.length} comentário{comentarios.length!==1?'s':''}</div>
          </div>
        </div>
      </article>

      <section className="space-y-4">
        <h3 className="text-xl font-black">Comentários</h3>
        {isAuthenticated && (
          <div className="card rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar src={user?.img_usuario} name={user?.nm_usuario} size="sm"/>
              <TextArea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Adicione um comentário…" className="flex-1 min-h-20 text-sm"/>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => addComment.mutate()} loading={addComment.isPending} disabled={!texto.trim()} className="flex items-center gap-2">
                <Send size={14}/> Comentar
              </Button>
            </div>
          </div>
        )}
        {!comentarios.length ? (
          <p className="py-8 text-center text-zinc-500">{isAuthenticated?'Seja o primeiro a comentar!':'Nenhum comentário ainda.'}</p>
        ) : comentarios.map(c => (
          <div key={c.id_comentario} className="card flex items-start gap-3 rounded-2xl p-4">
            <Link to={`/usuarios/${c.id_usuario}`} className="flex-shrink-0"><Avatar src={c.usuario?.img_usuario} name={c.usuario?.nm_usuario} size="sm"/></Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <Link to={`/usuarios/${c.id_usuario}`} className="font-bold text-sm hover:text-checkpoint-green transition-colors">@{c.usuario?.nm_usuario}</Link>
                <span className="text-xs text-zinc-600">{formatDistanceToNow(new Date(c.created_at),{addSuffix:true,locale:ptBR})}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-300 leading-relaxed">{c.texto}</p>
            </div>
            {(user?.id_usuario===c.id_usuario||user?.tipo_usuario==='ADMIN') && (
              <button onClick={() => delComment.mutate(c.id_comentario)} aria-label="Excluir" className="flex-shrink-0 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
