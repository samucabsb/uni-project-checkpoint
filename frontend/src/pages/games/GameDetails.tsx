import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Check, Clock, BookOpen, List } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLibraryMap } from '../../hooks';
import { Jogo, Avaliacao, StatusJogo, StatusJogoEnum } from '../../types';
import { Stars, Button, Modal, TextArea, ReviewCard, Skeleton } from '../../components/ui';

const STATUS_OPTIONS: { value: StatusJogoEnum; label: string; icon: React.ReactNode }[] = [
  { value: 'ZERADO',      label: 'Zerado',      icon: <Check size={13}/>    },
  { value: 'JOGANDO',     label: 'Jogando',     icon: <BookOpen size={13}/> },
  { value: 'QUERO_JOGAR', label: 'Quero jogar', icon: <Clock size={13}/>    },
  { value: 'ABANDONADO',  label: 'Abandonado',  icon: <span/>               },
];

function plural(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`;
}

export default function GameDetails() {
  const { id }   = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc       = useQueryClient();
  const libMap   = useLibraryMap();
  const item     = libMap.get(Number(id)) as StatusJogo | undefined;

  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm]   = useState({ nota: 0, comentario: '', data_jogada: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewTab, setReviewTab] = useState<'popular' | 'recentes'>('recentes');

  const { data: jogo, isLoading } = useQuery<Jogo>({
    queryKey: ['game', id],
    queryFn:  () => api.get(`/games/${id}`).then(r => r.data),
    enabled:  !!id,
  });

  async function handleStatus(status: StatusJogoEnum) {
    if (!isAuthenticated) return toast('Faça login para usar a biblioteca.', 'info');
    try {
      await api.post(`/library/games/${id}/status`, { status });
      qc.invalidateQueries({ queryKey: ['library'] });
      toast('Biblioteca atualizada.');
    } catch { toast('Erro ao atualizar.', 'error'); }
  }

  async function handleFavorito() {
    if (!isAuthenticated) return toast('Faça login para favoritar.', 'info');
    try {
      if (item?.favorito) { await api.delete(`/library/games/${id}/favorite`); toast('Favorito removido.'); }
      else                { await api.post(`/library/games/${id}/favorite`);   toast('Favoritado!'); }
      qc.invalidateQueries({ queryKey: ['library'] });
    } catch { toast('Erro ao atualizar.', 'error'); }
  }

  async function submitReview() {
    if (!reviewForm.nota) return toast('Selecione uma nota.', 'error');
    setReviewLoading(true);
    try {
      await api.post('/reviews', {
        id_jogo:     Number(id),
        nota:        reviewForm.nota,
        comentario:  reviewForm.comentario || null,
        data_jogada: reviewForm.data_jogada || null,
      });
      qc.invalidateQueries({ queryKey: ['game', id] });
      toast('Avaliação salva!');
      setReviewModal(false);
    } catch { toast('Erro ao salvar avaliação.', 'error'); }
    finally { setReviewLoading(false); }
  }

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-72 rounded-3xl"/>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48 rounded-2xl"/>
          <Skeleton className="h-32 rounded-2xl"/>
        </div>
        <Skeleton className="h-48 rounded-2xl"/>
      </div>
    </div>
  );

  if (!jogo) return (
    <div className="py-16 text-center">
      <p className="text-zinc-400">Jogo não encontrado.</p>
    </div>
  );

  const minhaReview = isAuthenticated
    ? jogo.avaliacoes?.find(a => a.id_usuario === user?.id_usuario)
    : null;

  const reviewsOrdenadas = reviewTab === 'popular'
    ? [...(jogo.avaliacoes || [])].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    : [...(jogo.avaliacoes || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const dist    = jogo.distribuicao_notas || {};
  const maxDist = Math.max(...Object.values(dist), 1);
  const totalAv = jogo.total_avaliacoes || 0;

  return (
    <div className="space-y-8">
      {/* Hero — capa + info principal */}
      <div className="card rounded-3xl overflow-hidden">
        {/* Banner com capa ao fundo */}
        <div className="relative h-52 sm:h-64 overflow-hidden bg-zinc-950">
          <img
            src={jogo.img_jogo}
            alt=""
            aria-hidden="true"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            className="absolute inset-0 h-full w-full object-cover blur-sm scale-110 opacity-30 select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"/>
          {/* Título no banner para telas menores */}
          <div className="absolute bottom-4 left-48 right-4 hidden sm:block">
            <p className="text-xs font-bold uppercase tracking-widest text-checkpoint-green">
              {jogo.genero || 'Jogo'}
            </p>
          </div>
        </div>

        {/* Info principal */}
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start -mt-2">
          {/* Capa do jogo */}
          <img
            src={jogo.img_jogo}
            alt={`Capa de ${jogo.nm_jogo}`}
            onError={e => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/140x200/18181f/00e187?text=${encodeURIComponent(jogo.nm_jogo.slice(0, 2))}`;
            }}
            className="-mt-16 h-44 w-32 flex-shrink-0 self-start rounded-2xl object-cover shadow-2xl ring-2 ring-white/10"
          />

          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">{jogo.nm_jogo}</h1>

            {/* Tags */}
            <div className="mt-2 flex flex-wrap gap-2">
              {jogo.genero        && <Tag>{jogo.genero}</Tag>}
              {jogo.plataforma    && <Tag>{jogo.plataforma}</Tag>}
              {jogo.classificacao && <Tag>{jogo.classificacao}</Tag>}
            </div>

            {/* Média */}
            {totalAv > 0 ? (
              <div className="mt-3 flex items-center gap-3">
                <Stars value={(jogo.media || 0) * 2} size={18}/>
                <span className="text-2xl font-black text-checkpoint-green">{jogo.media}</span>
                <span className="text-sm text-zinc-500">
                  {plural(totalAv, 'avaliação', 'avaliações')}
                </span>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Sem avaliações ainda.</p>
            )}

            {jogo.descricao && (
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 line-clamp-3">{jogo.descricao}</p>
            )}

            {/* Botões de ação */}
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => handleStatus(value)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition ${
                    item?.status === value
                      ? 'bg-checkpoint-green text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {icon}{label}
                </button>
              ))}
              <button
                onClick={handleFavorito}
                aria-label={item?.favorito ? 'Remover favorito' : 'Favoritar'}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  item?.favorito
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <Heart size={14} fill={item?.favorito ? 'currentColor' : 'none'}/>
                {item?.favorito ? 'Favoritado' : 'Favoritar'}
              </button>
            </div>
          </div>

          {/* Sua avaliação */}
          <div className="flex-shrink-0">
            {minhaReview ? (
              <div className="card rounded-2xl p-4 text-center min-w-[120px]">
                <p className="text-xs text-zinc-500 mb-1">Sua nota</p>
                <p className="text-4xl font-black text-checkpoint-green">
                  {(minhaReview.nota / 2).toFixed(1)}
                </p>
                <Stars value={minhaReview.nota} size={14}/>
                <button
                  onClick={() => {
                    setReviewForm({ nota: minhaReview.nota, comentario: minhaReview.comentario || '', data_jogada: '' });
                    setReviewModal(true);
                  }}
                  className="mt-2 text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Editar
                </button>
              </div>
            ) : isAuthenticated ? (
              <Button onClick={() => setReviewModal(true)} className="flex items-center gap-2 whitespace-nowrap">
                ★ Avaliar
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Distribuição de notas */}
          {totalAv > 0 && (
            <div className="card rounded-2xl p-5">
              <h2 className="mb-4 font-black">Distribuição de notas</h2>
              <div className="space-y-1.5">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(nota => (
                  <div key={nota} className="flex items-center gap-2">
                    <span className="w-7 text-right text-xs text-zinc-500">{(nota / 2).toFixed(1)}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-checkpoint-green rounded-full transition-all"
                        style={{ width: `${((dist[nota] || 0) / maxDist) * 100}%` }}
                      />
                    </div>
                    <span className="w-5 text-xs text-zinc-600 text-right">{dist[nota] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avaliações */}
          {(jogo.avaliacoes?.length || 0) > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-2xl font-black">Avaliações</h2>
                <div className="flex gap-1">
                  {(['recentes', 'popular'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setReviewTab(t)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        reviewTab === t
                          ? 'bg-checkpoint-green text-black'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {t === 'recentes' ? 'Recentes' : 'Mais curtidas'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {reviewsOrdenadas.slice(0, 6).map(a => (
                  <ReviewCard key={a.id_avaliacao} review={a} showGame={false}/>
                ))}
                {(jogo.avaliacoes?.length || 0) > 6 && (
                  <p className="text-center text-sm text-zinc-500">
                    e mais {(jogo.avaliacoes?.length || 0) - 6} avaliações
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sem avaliações */}
          {totalAv === 0 && (
            <div className="card rounded-2xl p-8 text-center">
              <p className="font-black text-lg">Seja o primeiro a avaliar!</p>
              <p className="mt-1 text-sm text-zinc-400">Nenhuma avaliação ainda para {jogo.nm_jogo}.</p>
              {isAuthenticated && (
                <Button onClick={() => setReviewModal(true)} className="mt-4">★ Avaliar agora</Button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Informações */}
          <div className="card rounded-2xl p-5 space-y-3">
            <h3 className="font-black">Informações</h3>
            {jogo.dt_jogo && (
              <InfoRow label="Lançamento" value={
                new Date(jogo.dt_jogo).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
              }/>
            )}
            {jogo.plataforma    && <InfoRow label="Plataformas"   value={jogo.plataforma}/>}
            {jogo.genero        && <InfoRow label="Gênero"        value={jogo.genero}/>}
            {jogo.classificacao && <InfoRow label="Classificação" value={jogo.classificacao}/>}
            {(jogo._count?.status_jogos || 0) > 0 && (
              <InfoRow label="Na biblioteca de" value={plural(jogo._count!.status_jogos!, 'jogador', 'jogadores')}/>
            )}
          </div>

          {/* Listas que contêm */}
          {(jogo.listas_com_jogo?.length || 0) > 0 && (
            <div className="card rounded-2xl p-5">
              <h3 className="mb-3 font-black flex items-center gap-2">
                <List size={16} className="text-checkpoint-green"/> Em listas
              </h3>
              <div className="space-y-2">
                {jogo.listas_com_jogo!.map(l => (
                  <Link
                    key={l.id_lista}
                    to={`/listas/${l.id_lista}`}
                    className="flex items-center justify-between rounded-xl bg-zinc-900 px-3 py-2 hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-sm font-bold truncate">{l.nm_lista}</span>
                    <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">@{l.usuario?.nm_usuario}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: avaliar */}
      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title={minhaReview ? 'Editar avaliação' : 'Avaliar jogo'}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-zinc-300">Sua nota</p>
            <div className="flex items-center gap-3">
              <Stars value={reviewForm.nota} onChange={n => setReviewForm(f => ({ ...f, nota: n }))} size={28}/>
              {reviewForm.nota > 0 && (
                <span className="text-2xl font-black text-checkpoint-green">
                  {(reviewForm.nota / 2).toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <TextArea
            label="Comentário (opcional)"
            value={reviewForm.comentario}
            onChange={e => setReviewForm(f => ({ ...f, comentario: e.target.value }))}
            placeholder="O que você achou?"
          />
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Data que jogou (opcional)</label>
            <input
              type="date"
              value={reviewForm.data_jogada}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setReviewForm(f => ({ ...f, data_jogada: e.target.value }))}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green transition-colors"
            />
          </div>
          <Button
            onClick={submitReview}
            loading={reviewLoading}
            disabled={!reviewForm.nota}
            className="w-full"
          >
            {minhaReview ? 'Atualizar avaliação' : 'Publicar avaliação'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-300">{children}</span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-zinc-500 flex-shrink-0">{label}</span>
      <span className="text-xs font-bold text-right">{value}</span>
    </div>
  );
}
