/**
 * Página de detalhes do jogo — avaliação + biblioteca + reviews da comunidade
 */

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Library } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { today, useLibraryMap } from '../../hooks';
import { Button, Stars, ReviewCard, Input, Skeleton, Modal } from '../../components/ui';
import { Jogo, Avaliacao, StatusJogo } from '../../types';

export default function GameDetails() {
  const { id }   = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();
  const libMap    = useLibraryMap();

  const { data: game, isLoading, isError } = useQuery<Jogo>({
    queryKey: ['game', id],
    queryFn:  () => api.get('/games/' + id).then(r => r.data),
    retry:    1,
  });

  const libItem = game ? libMap.get(game.id_jogo) as StatusJogo | undefined : undefined;

  const mine = useMemo(
    () => game?.avaliacoes?.find(r => r.id_usuario === user?.id_usuario),
    [game, user],
  );

  const [nota,       setNota]       = useState(5);
  const [comentario, setComentario] = useState('');
  const [dataJogada, setDataJogada] = useState(today());
  const [saving,     setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // Pré-preenche formulário quando a avaliação já existe
  useEffect(() => {
    if (mine) {
      setNota(mine.nota);
      setComentario(mine.comentario);
      setDataJogada(mine.data_jogada?.slice(0, 10) || today());
    } else {
      setNota(5);
      setComentario('');
      setDataJogada(today());
    }
  }, [mine?.id_avaliacao]);

  async function saveReview(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await api.post('/reviews', { id_jogo: Number(id), nota, comentario, data_jogada: dataJogada });
      toast(mine ? 'Avaliação atualizada.' : 'Avaliação publicada!');
      qc.invalidateQueries({ queryKey: ['game', id] });
    } catch {
      toast('Erro ao salvar avaliação.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteReview() {
    if (!mine) return;
    await api.delete('/reviews/' + mine.id_avaliacao);
    toast('Avaliação excluída.');
    setConfirmDel(false);
    qc.invalidateQueries({ queryKey: ['game', id] });
  }

  async function setStatus(status: string) {
    await api.post(`/library/games/${id}/status`, { status });
    toast('Biblioteca atualizada.');
    qc.invalidateQueries({ queryKey: ['library'] });
  }

  async function toggleFavorito() {
    if (libItem?.favorito) {
      await api.delete(`/library/games/${id}/favorite`);
      toast('Favorito removido.');
    } else {
      await api.post(`/library/games/${id}/favorite`);
      toast('Jogo favoritado!');
    }
    qc.invalidateQueries({ queryKey: ['library'] });
  }

  if (isLoading) return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <Skeleton className="aspect-[3/4]" />
      <div className="space-y-4"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-5 w-1/3" /><Skeleton className="h-32 w-full" /></div>
    </div>
  );

  if (isError || !game) return (
    <div className="card rounded-3xl p-10 text-center">
      <h2 className="text-2xl font-black">Jogo não encontrado</h2>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Hero com backdrop */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
        <img src={game.img_jogo} className="absolute inset-0 h-full w-full object-cover opacity-20 blur-xl" alt="" />
        <div className="relative grid gap-8 md:grid-cols-[240px_1fr]">
          <img src={game.img_jogo} className="rounded-2xl shadow-2xl" alt={game.nm_jogo} />
          <div>
            <p className="meta">{game.genero}</p>
            <h1 className="mt-2 text-5xl font-black leading-tight">{game.nm_jogo}</h1>
            <p className="mt-2 text-zinc-400">
              {game.plataforma} · {new Date(game.dt_jogo).getFullYear()} · {game.classificacao}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <p className="text-4xl font-black text-checkpoint-green">★ {game.media || 0}</p>
              <p className="text-zinc-400 text-sm">{game.total_avaliacoes || 0} avaliações</p>
            </div>
            {game.descricao && <p className="mt-4 max-w-2xl leading-7 text-zinc-300">{game.descricao}</p>}

            {/* Ações da biblioteca */}
            {user && (
              <div className="mt-6 flex flex-wrap gap-2">
                {(['QUERO_JOGAR', 'JOGANDO', 'ZERADO', 'ABANDONADO'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold border transition ${
                      libItem?.status === s
                        ? 'border-checkpoint-green bg-checkpoint-green/10 text-checkpoint-green'
                        : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    <Library size={14} /> {s.replace('_', ' ')}
                  </button>
                ))}
                <button
                  onClick={toggleFavorito}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold border transition ${
                    libItem?.favorito
                      ? 'border-checkpoint-green bg-checkpoint-green text-black'
                      : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  <Heart size={14} fill={libItem?.favorito ? 'currentColor' : 'none'} />
                  {libItem?.favorito ? 'Favoritado' : 'Favoritar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Avaliação + Reviews */}
      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* Formulário de avaliação */}
        {user ? (
          <form onSubmit={saveReview} className="surface h-fit rounded-2xl p-6 space-y-4">
            <h2 className="text-2xl font-black">{mine ? 'Minha avaliação' : 'Publicar avaliação'}</h2>
            <Stars value={nota} onChange={setNota} size={26} />
            <Input label="Data em que jogou" type="date" value={dataJogada} onChange={e => setDataJogada(e.target.value)} />
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">Resenha</span>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Escreva sua opinião..."
                maxLength={1000}
                className="min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green"
              />
              <p className="text-right text-xs text-zinc-500 mt-1">{comentario.length}/1000</p>
            </label>
            <div className="flex gap-2">
              <Button loading={saving} disabled={!comentario.trim()}>
                {mine ? 'Salvar edição' : 'Publicar'}
              </Button>
              {mine && (
                <Button type="button" variant="danger" onClick={() => setConfirmDel(true)}>
                  Excluir
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="surface rounded-2xl p-6">
            <h2 className="text-xl font-black mb-2">Avalie este jogo</h2>
            <p className="text-zinc-400 mb-4">Entre na sua conta para publicar uma avaliação.</p>
            <a href="/login" className="rounded-xl bg-checkpoint-green px-5 py-2.5 text-sm font-bold text-black hover:brightness-110 transition inline-block">Entrar</a>
          </div>
        )}

        {/* Lista de avaliações */}
        <div>
          <h2 className="mb-4 text-2xl font-black">Avaliações da comunidade</h2>
          {!game.avaliacoes?.length ? (
            <div className="card rounded-2xl p-8 text-center text-zinc-400">Nenhuma avaliação ainda.</div>
          ) : (
            <div className="space-y-4">
              {game.avaliacoes.map(r => <ReviewCard key={r.id_avaliacao} review={{ ...r, jogo: game }} />)}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
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
