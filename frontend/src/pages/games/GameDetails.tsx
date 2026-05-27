/**
 * Detalhes do Jogo — v1.5
 * - Meia estrela (nota 1-10)
 * - Distribuição de notas em barras
 * - "X pessoas têm este jogo na biblioteca"
 * - Comentário opcional
 * - Likes nas reviews
 */

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Library, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { today, useLibraryMap } from '../../hooks';
import { Button, Stars, ReviewCard, Input, Skeleton, Modal } from '../../components/ui';
import { Jogo, StatusJogo } from '../../types';

// Barras de distribuição de notas
function RatingBars({ distribuicao, total }: { distribuicao: Record<number, number>; total: number }) {
  if (!total) return null;
  // Agrupa de 2 em 2 (1-2 = 0.5-1★, 3-4 = 1.5-2★ etc) em pares para mostrar estrelas inteiras
  const bars = [
    { label: '5★',   val: (distribuicao[10]||0) },
    { label: '4.5★', val: (distribuicao[9]||0)  },
    { label: '4★',   val: (distribuicao[8]||0)  },
    { label: '3.5★', val: (distribuicao[7]||0)  },
    { label: '3★',   val: (distribuicao[6]||0)  },
    { label: '2.5★', val: (distribuicao[5]||0)  },
    { label: '2★',   val: (distribuicao[4]||0)  },
    { label: '1.5★', val: (distribuicao[3]||0)  },
    { label: '1★',   val: (distribuicao[2]||0)  },
    { label: '0.5★', val: (distribuicao[1]||0)  },
  ];
  const max = Math.max(...bars.map(b => b.val), 1);
  return (
    <div className="surface rounded-2xl p-5">
      <h3 className="mb-3 text-sm font-black text-zinc-400 uppercase tracking-wider">Distribuição</h3>
      <div className="space-y-1.5">
        {bars.filter(b => b.val > 0 || bars.some(x => x.val > 0)).slice(0,6).map(b => (
          <div key={b.label} className="flex items-center gap-2 text-xs">
            <span className="w-9 text-right text-zinc-400 flex-shrink-0">{b.label}</span>
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-checkpoint-green rounded-full transition-all"
                style={{ width: total ? `${(b.val / max) * 100}%` : '0' }}
              />
            </div>
            <span className="w-6 text-zinc-500 flex-shrink-0">{b.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GameDetails() {
  const { id }    = useParams<{ id: string }>();
  const { user }  = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();
  const libMap    = useLibraryMap();

  const { data: game, isLoading, isError } = useQuery<Jogo>({
    queryKey: ['game', id],
    queryFn:  () => api.get('/games/' + id).then(r => r.data),
    retry: 1,
  });

  const libItem = game ? libMap.get(game.id_jogo) as StatusJogo | undefined : undefined;
  const mine    = useMemo(() => game?.avaliacoes?.find(r => r.id_usuario === user?.id_usuario), [game, user]);

  const [nota,       setNota]       = useState(10);
  const [comentario, setComentario] = useState('');
  const [dataJogada, setDataJogada] = useState(today());
  const [saving,     setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (mine) {
      setNota(mine.nota);
      setComentario(mine.comentario || '');
      setDataJogada(mine.data_jogada?.slice(0, 10) || today());
    } else {
      setNota(10); setComentario(''); setDataJogada(today());
    }
  }, [mine?.id_avaliacao]);

  async function saveReview(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await api.post('/reviews', { id_jogo: Number(id), nota, comentario: comentario || null, data_jogada: dataJogada });
      toast(mine ? 'Avaliação atualizada.' : 'Avaliação publicada!');
      qc.invalidateQueries({ queryKey: ['game', id] });
    } catch { toast('Erro ao salvar avaliação.', 'error'); }
    finally { setSaving(false); }
  }

  async function deleteReview() {
    if (!mine) return;
    try {
      await api.delete('/reviews/' + mine.id_avaliacao);
      toast('Avaliação excluída.');
      setConfirmDel(false);
      qc.invalidateQueries({ queryKey: ['game', id] });
    } catch { toast('Erro ao excluir.', 'error'); }
  }

  async function setStatus(status: string) {
    try {
      await api.post(`/library/games/${id}/status`, { status });
      toast('Biblioteca atualizada.');
      qc.invalidateQueries({ queryKey: ['library'] });
    } catch { toast('Erro ao atualizar.', 'error'); }
  }

  async function toggleFavorito() {
    try {
      if (libItem?.favorito) { await api.delete(`/library/games/${id}/favorite`); toast('Favorito removido.'); }
      else                   { await api.post(`/library/games/${id}/favorite`);   toast('Jogo favoritado!'); }
      qc.invalidateQueries({ queryKey: ['library'] });
    } catch { toast('Erro ao atualizar favorito.', 'error'); }
  }

  if (isLoading) return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <Skeleton className="aspect-[3/4] rounded-2xl" />
      <div className="space-y-4"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-5 w-1/3" /><Skeleton className="h-32 w-full" /></div>
    </div>
  );

  if (isError || !game) return (
    <div className="card rounded-3xl p-10 text-center">
      <h2 className="text-2xl font-black">Jogo não encontrado</h2>
      <p className="mt-2 text-zinc-400">Verifique o endereço ou volte ao catálogo.</p>
    </div>
  );

  const totalNaBiblioteca = game._count?.status_jogos || 0;
  const STATUS_OPTS: Array<'QUERO_JOGAR'|'JOGANDO'|'ZERADO'|'ABANDONADO'> = ['QUERO_JOGAR','JOGANDO','ZERADO','ABANDONADO'];

  return (
    <div className="space-y-8">
      {/* Hero com backdrop */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
        <img src={game.img_jogo} className="absolute inset-0 h-full w-full object-cover opacity-20 blur-xl scale-105" alt="" aria-hidden />
        <div className="relative grid gap-8 md:grid-cols-[240px_1fr]">
          <img src={game.img_jogo} className="rounded-2xl shadow-2xl w-full" alt={`Capa de ${game.nm_jogo}`} />
          <div>
            <p className="meta">{game.genero}</p>
            <h1 className="mt-2 text-4xl font-black leading-tight lg:text-5xl">{game.nm_jogo}</h1>
            <p className="mt-2 text-zinc-400">{game.plataforma} · {new Date(game.dt_jogo).getFullYear()} · {game.classificacao}</p>

            <div className="mt-4 flex flex-wrap items-center gap-5">
              <div>
                <p className="text-4xl font-black text-checkpoint-green">★ {game.media || '—'}</p>
                <p className="text-xs text-zinc-400">{game.total_avaliacoes || 0} avaliações</p>
              </div>
              {totalNaBiblioteca > 0 && (
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Users size={16} /><span className="text-sm">{totalNaBiblioteca} na biblioteca</span>
                </div>
              )}
            </div>

            {game.descricao && <p className="mt-4 max-w-2xl leading-7 text-zinc-300">{game.descricao}</p>}

            {user ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {STATUS_OPTS.map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold transition ${libItem?.status===s?'border-checkpoint-green bg-checkpoint-green/10 text-checkpoint-green':'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'}`}>
                    <Library size={14}/> {s.replace('_',' ')}
                  </button>
                ))}
                <button onClick={toggleFavorito}
                  className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold transition ${libItem?.favorito?'border-checkpoint-green bg-checkpoint-green text-black':'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'}`}>
                  <Heart size={14} fill={libItem?.favorito?'currentColor':'none'}/>{libItem?.favorito?'Favoritado':'Favoritar'}
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <Link to="/login" className="inline-block rounded-xl bg-checkpoint-green px-5 py-2.5 text-sm font-bold text-black hover:brightness-110 transition">
                  Entre para adicionar à biblioteca
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* Coluna esquerda: form de avaliação + distribuição */}
        <div className="space-y-4">
          {user ? (
            <form onSubmit={saveReview} className="surface rounded-2xl p-6 space-y-4">
              <h2 className="text-2xl font-black">{mine ? 'Minha avaliação' : 'Publicar avaliação'}</h2>
              <div>
                <p className="mb-2 text-sm text-zinc-300">Nota — {(nota/2).toFixed(1)} estrelas</p>
                <Stars value={nota} onChange={setNota} size={28} />
              </div>
              <Input label="Data que jogou" type="date" value={dataJogada} onChange={e => setDataJogada(e.target.value)} />
              <label className="block">
                <span className="mb-2 block text-sm text-zinc-300">Resenha <span className="text-zinc-500">(opcional)</span></span>
                <textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Escreva sua opinião..." maxLength={1000}
                  className="min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green transition-colors"/>
                <p className="mt-1 text-right text-xs text-zinc-500">{comentario.length}/1000</p>
              </label>
              <div className="flex gap-2">
                <Button loading={saving}>{mine ? 'Salvar edição' : 'Publicar'}</Button>
                {mine && <Button type="button" variant="danger" onClick={() => setConfirmDel(true)}>Excluir</Button>}
              </div>
            </form>
          ) : (
            <div className="surface rounded-2xl p-6 text-center space-y-3">
              <h2 className="text-xl font-black">Avalie este jogo</h2>
              <p className="text-zinc-400">Entre para publicar sua avaliação.</p>
              <Link to="/login" className="inline-block rounded-xl bg-checkpoint-green px-5 py-2.5 text-sm font-bold text-black hover:brightness-110 transition">Entrar</Link>
            </div>
          )}

          {game.distribuicao_notas && (
            <RatingBars distribuicao={game.distribuicao_notas} total={game.total_avaliacoes || 0} />
          )}
        </div>

        {/* Coluna direita: reviews */}
        <div>
          <h2 className="mb-4 text-2xl font-black">Avaliações da comunidade</h2>
          {!game.avaliacoes?.length ? (
            <div className="card rounded-2xl p-8 text-center text-zinc-400">Nenhuma avaliação ainda. Seja o primeiro!</div>
          ) : (
            <div className="space-y-4">
              {game.avaliacoes.map(r => <ReviewCard key={r.id_avaliacao} review={{ ...r, jogo: game }} />)}
            </div>
          )}
        </div>
      </div>

      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="Excluir avaliação">
        <p className="text-zinc-400 mb-6">Tem certeza que deseja excluir sua avaliação de <strong className="text-white">{game.nm_jogo}</strong>?</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDel(false)}>Cancelar</Button>
          <Button variant="danger" onClick={deleteReview}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
