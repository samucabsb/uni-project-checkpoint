/**
 * Perfil do usuário
 * v1.4: Gestão da Vitrine (dono pode adicionar/remover/reordenar)
 * v1.4: Contadores de seguidores/seguindo clicáveis
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X as XIcon } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks';
import { Avatar, Button, GameCard, ReviewCard, Input, Skeleton } from '../../components/ui';
import { Usuario, StatusJogo, Lista, Jogo } from '../../types';

const AVATARES = ['knight','mage','robot','ninja','racer','explorer','samurai','space','dragon','pilot']
  .map(seed => `https://api.dicebear.com/8.x/adventurer/svg?seed=${seed}`);

type Tab = 'overview' | 'JOGANDO' | 'QUERO_JOGAR' | 'ZERADO' | 'FAVORITOS' | 'reviews' | 'lists';

const TAB_LABEL: Record<Tab, string> = {
  overview:    'Visão Geral',
  JOGANDO:     'Jogando',
  QUERO_JOGAR: 'Quero Jogar',
  ZERADO:      'Zerado',
  FAVORITOS:   'Favoritos',
  reviews:     'Avaliações',
  lists:       'Listas',
};

// ── Slot da Vitrine ───────────────────────────────────────
function VitrineSlot({
  position,
  item,
  isOwner,
  onAdd,
  onRemove,
}: {
  position:  number;
  item?:     StatusJogo;
  isOwner:   boolean;
  onAdd:     (position: number) => void;
  onRemove:  (item: StatusJogo) => void;
}) {
  if (item) {
    return (
      <div className="relative group">
        <Link to={`/jogos/${item.id_jogo}`}>
          <div className="aspect-[3/4] overflow-hidden rounded-xl border border-zinc-800">
            <img
              src={item.jogo.img_jogo}
              alt={item.jogo.nm_jogo}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          <p className="mt-1 text-xs font-bold truncate text-zinc-300 group-hover:text-checkpoint-green transition-colors">
            {item.jogo.nm_jogo}
          </p>
        </Link>
        {isOwner && (
          <button
            onClick={() => onRemove(item)}
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
            title="Remover da Vitrine"
          >
            <XIcon size={10} />
          </button>
        )}
      </div>
    );
  }

  if (isOwner) {
    return (
      <button
        onClick={() => onAdd(position)}
        className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-checkpoint-green hover:text-checkpoint-green transition-colors"
        title={`Adicionar jogo na posição ${position}`}
      >
        <Plus size={20} />
        <span className="text-xs font-bold">#{position}</span>
      </button>
    );
  }

  return (
    <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center">
      <span className="text-xs text-zinc-600">#{position}</span>
    </div>
  );
}

// ── Busca inline para adicionar jogo à Vitrine ────────────
function VitrineSearch({
  position,
  onSelect,
  onClose,
}: {
  position: number;
  onSelect: (jogo: Jogo, position: number) => void;
  onClose:  () => void;
}) {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 300);

  const { data: results = [] } = useQuery<Jogo[]>({
    queryKey: ['vitrine-search', debounced],
    queryFn:  () => api.get('/games/search', { params: { q: debounced } }).then(r => r.data),
    enabled:  debounced.length >= 2,
  });

  return (
    <div className="surface rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-black text-sm">Escolher jogo para posição #{position}</p>
        <button onClick={onClose} className="text-zinc-400 hover:text-white">
          <XIcon size={16} />
        </button>
      </div>
      <Input
        placeholder="Buscar jogo..."
        value={q}
        onChange={e => setQ(e.target.value)}
        autoFocus
      />
      {debounced.length >= 2 && (
        <div className="mt-2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          {results.length === 0 ? (
            <p className="p-3 text-sm text-zinc-400">Nenhum resultado.</p>
          ) : (
            results.map(g => (
              <button
                key={g.id_jogo}
                onClick={() => { onSelect(g, position); onClose(); }}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-zinc-900 transition"
              >
                <img src={g.img_jogo} className="h-10 w-7 rounded object-cover flex-shrink-0" alt="" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{g.nm_jogo}</p>
                  <p className="text-xs text-zinc-400">{g.genero}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Perfil principal ──────────────────────────────────────
export default function Profile() {
  const { id }              = useParams<{ id: string }>();
  const { user, refreshMe } = useAuth();
  const { toast }           = useToast();
  const qc                  = useQueryClient();

  const [tab,            setTab]           = useState<Tab>('overview');
  const [editing,        setEditing]       = useState(false);
  const [form,           setForm]          = useState({ nm_usuario: '', email_usuario: '', bio_usuario: '', img_usuario: '' });
  const [saving,         setSaving]        = useState(false);
  const [addingPosition, setAddingPosition] = useState<number | null>(null);

  const { data: profile, isLoading } = useQuery<Usuario>({
    queryKey: ['profile', id],
    queryFn:  () => api.get('/users/' + id).then(r => r.data),
  });

  // Pré-preenche formulário quando o perfil carrega
  useEffect(() => {
    if (profile) {
      setForm({
        nm_usuario:    profile.nm_usuario,
        email_usuario: profile.email_usuario,
        bio_usuario:   profile.bio_usuario  || '',
        img_usuario:   profile.img_usuario  || '',
      });
    }
  }, [profile?.id_usuario, profile?.img_usuario]);

  const isOwner = user?.id_usuario === Number(id);

  // Slots da Vitrine: array de 4 posições (index 0 = posição 1)
  const vitrineMap = new Map<number, StatusJogo>(
    (profile?.status_jogos || [])
      .filter(s => s.top_position !== null)
      .map(s => [s.top_position as number, s]),
  );

  // ── Vitrine: adicionar jogo ───────────────────────────
  async function handleAddToVitrine(jogo: Jogo, position: number) {
    const slots = Array.from(vitrineMap.entries())
      .filter(([pos]) => pos !== position)
      .map(([pos, s]) => ({ id_jogo: s.jogo.id_jogo, position: pos }));

    try {
      await api.put('/library/vitrine', {
        items: [...slots, { id_jogo: jogo.id_jogo, position }],
      });
      toast(`"${jogo.nm_jogo}" adicionado à Vitrine na posição ${position}!`);
      qc.invalidateQueries({ queryKey: ['profile', id] });
      qc.invalidateQueries({ queryKey: ['library'] });
    } catch {
      toast('Erro ao atualizar Vitrine.', 'error');
    }
  }

  // ── Vitrine: remover jogo ─────────────────────────────
  async function handleRemoveFromVitrine(item: StatusJogo) {
    const restantes = Array.from(vitrineMap.entries())
      .filter(([, s]) => s.jogo.id_jogo !== item.jogo.id_jogo)
      .map(([pos, s]) => ({ id_jogo: s.jogo.id_jogo, position: pos }));

    try {
      await api.put('/library/vitrine', { items: restantes });
      toast('Jogo removido da Vitrine.');
      qc.invalidateQueries({ queryKey: ['profile', id] });
      qc.invalidateQueries({ queryKey: ['library'] });
    } catch {
      toast('Erro ao atualizar Vitrine.', 'error');
    }
  }

  // ── Follow / Unfollow ─────────────────────────────────
  async function toggleFollow() {
    try {
      if (profile?.isFollowing) {
        await api.delete(`/users/${id}/follow`);
        toast('Você deixou de seguir.');
      } else {
        await api.post(`/users/${id}/follow`);
        toast('Agora você está seguindo!');
      }
      qc.invalidateQueries({ queryKey: ['profile', id] });
    } catch {
      toast('Erro ao atualizar seguimento.', 'error');
    }
  }

  // ── Salvar edição de perfil ───────────────────────────
  async function saveProfile() {
    setSaving(true);
    try {
      await api.put('/users/' + id, form);
      toast('Perfil atualizado!');
      setEditing(false);
      await refreshMe();
      qc.invalidateQueries({ queryKey: ['profile', id] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg || 'Erro ao atualizar perfil.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return (
    <div className="space-y-8">
      <div className="surface rounded-3xl p-8 flex gap-5">
        <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="space-y-8">
      {/* ── Header do perfil ──────────────────────────── */}
      <section className="surface rounded-3xl p-8">
        <div className="flex flex-wrap justify-between gap-6">
          <div className="flex gap-5 items-start">
            <Avatar src={profile.img_usuario} name={profile.nm_usuario} size="lg" />
            <div>
              <h1 className="text-4xl font-black md:text-5xl">@{profile.nm_usuario}</h1>
              {profile.bio_usuario && (
                <p className="mt-2 max-w-xl text-zinc-400">{profile.bio_usuario}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-500">
                <span>{profile._count?.avaliacoes || 0} avaliações</span>
                <span>{profile._count?.listas || 0} listas</span>
                <span className="text-zinc-300">{profile._count?.seguidores || 0} seguidores</span>
                <span>{profile._count?.seguindo || 0} seguindo</span>
              </div>
            </div>
          </div>
          {isOwner ? (
            <Button variant="secondary" onClick={() => setEditing(v => !v)}>
              {editing ? 'Cancelar edição' : 'Editar perfil'}
            </Button>
          ) : (
            <Button
              onClick={toggleFollow}
              variant={profile.isFollowing ? 'secondary' : 'primary'}
            >
              {profile.isFollowing ? 'Deixar de seguir' : 'Seguir'}
            </Button>
          )}
        </div>

        {/* ── Vitrine ──────────────────────────────────── */}
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <p className="meta">Vitrine</p>
            {isOwner && !addingPosition && (
              <span className="text-xs text-zinc-500">clique em + para adicionar</span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3 max-w-xs">
            {[1, 2, 3, 4].map(pos => (
              <VitrineSlot
                key={pos}
                position={pos}
                item={vitrineMap.get(pos)}
                isOwner={isOwner}
                onAdd={p => { setAddingPosition(p); }}
                onRemove={handleRemoveFromVitrine}
              />
            ))}
          </div>

          {/* Busca inline para adicionar à Vitrine */}
          {addingPosition && isOwner && (
            <div className="mt-4 max-w-sm">
              <VitrineSearch
                position={addingPosition}
                onSelect={handleAddToVitrine}
                onClose={() => setAddingPosition(null)}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Formulário de edição ──────────────────────── */}
      {editing && isOwner && (
        <div className="surface rounded-2xl p-6 space-y-5">
          <h2 className="text-2xl font-black">Editar Perfil</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Usuário"
              value={form.nm_usuario}
              onChange={e => setForm(f => ({ ...f, nm_usuario: e.target.value }))}
            />
            <Input
              label="E-mail"
              type="email"
              value={form.email_usuario}
              onChange={e => setForm(f => ({ ...f, email_usuario: e.target.value }))}
            />
          </div>
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-300">Bio</span>
            <textarea
              value={form.bio_usuario}
              onChange={e => setForm(f => ({ ...f, bio_usuario: e.target.value }))}
              maxLength={200}
              placeholder="Conte um pouco sobre você..."
              className="min-h-20 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-checkpoint-green"
            />
            <p className="mt-1 text-right text-xs text-zinc-500">{form.bio_usuario.length}/200</p>
          </label>

          {/* Seletor de avatar */}
          <div>
            <p className="mb-3 text-sm font-bold text-zinc-300">Escolher avatar</p>
            <div className="grid grid-cols-5 gap-3">
              {AVATARES.map(src => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, img_usuario: src }))}
                  className={`rounded-2xl border-2 p-1.5 transition ${
                    form.img_usuario === src
                      ? 'border-checkpoint-green'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <Avatar src={src} name="avatar" size="md" />
                </button>
              ))}
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-zinc-500">Ou cole uma URL personalizada:</span>
              <Input
                placeholder="https://..."
                value={form.img_usuario}
                onChange={e => setForm(f => ({ ...f, img_usuario: e.target.value }))}
              />
            </label>
          </div>

          <div className="flex gap-3">
            <Button loading={saving} onClick={saveProfile}>Salvar</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* ── Abas ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABEL) as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === t
                ? 'bg-checkpoint-green text-black'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {/* ── Conteúdo das abas ─────────────────────────── */}

      {tab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          {(profile.avaliacoes || []).slice(0, 4).map(r => (
            <ReviewCard key={r.id_avaliacao} review={{ ...r, usuario: profile }} />
          ))}
          {!profile.avaliacoes?.length && (
            <p className="col-span-2 text-center text-zinc-400 py-8">Nenhuma avaliação publicada.</p>
          )}
        </div>
      )}

      {(['JOGANDO', 'QUERO_JOGAR', 'ZERADO'] as Tab[]).includes(tab) && (
        <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(profile.status_jogos || [])
            .filter((s: StatusJogo) => s.status === tab)
            .map((s: StatusJogo) => <GameCard key={s.id_jogo} game={s.jogo} />)
          }
        </div>
      )}

      {tab === 'FAVORITOS' && (
        <div className="grid gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(profile.status_jogos || [])
            .filter((s: StatusJogo) => s.favorito)
            .map((s: StatusJogo) => <GameCard key={s.id_jogo} game={s.jogo} />)
          }
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-4">
          {(profile.avaliacoes || []).map(r => (
            <ReviewCard key={r.id_avaliacao} review={{ ...r, usuario: profile }} />
          ))}
          {!profile.avaliacoes?.length && (
            <p className="text-center text-zinc-400 py-8">Nenhuma avaliação publicada.</p>
          )}
        </div>
      )}

      {tab === 'lists' && (
        <div className="grid gap-4 md:grid-cols-2">
          {(profile.listas || []).map((l: Lista) => (
            <Link
              key={l.id_lista}
              to={`/listas/${l.id_lista}`}
              className="card card-hover rounded-2xl p-5 block"
            >
              <h3 className="font-black hover:text-checkpoint-green transition-colors">{l.nm_lista}</h3>
              {l.descricao && <p className="mt-1 text-sm text-zinc-400">{l.descricao}</p>}
              {/* Capas dos jogos na lista */}
              {l.jogos && l.jogos.length > 0 && (
                <div className="mt-3 flex gap-1.5">
                  {l.jogos.slice(0, 5).map(({ jogo }) => (
                    <img
                      key={jogo.id_jogo}
                      src={jogo.img_jogo}
                      alt={jogo.nm_jogo}
                      className="h-12 w-9 rounded object-cover"
                    />
                  ))}
                </div>
              )}
            </Link>
          ))}
          {!profile.listas?.length && (
            <p className="col-span-2 text-center text-zinc-400 py-8">Nenhuma lista criada.</p>
          )}
        </div>
      )}
    </div>
  );
}
