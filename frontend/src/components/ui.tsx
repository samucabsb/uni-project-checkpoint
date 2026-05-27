/**
 * Componentes UI — Checkpoint v1.5
 * Inclui: Button, Input, TextArea, Select, Stars (meia estrela),
 *         Avatar, Skeleton, Modal, EmptyState, Header, Section,
 *         GameCard, ReviewCard (com likes)
 */

import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ThumbsUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLibraryMap } from '../hooks';
import { Jogo, Avaliacao, StatusJogo } from '../types';

// ── Button ─────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}
const variantClasses: Record<Variant, string> = {
  primary:   'bg-checkpoint-green text-black hover:brightness-110',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
  danger:    'bg-red-500 text-white hover:bg-red-400',
  ghost:     'bg-transparent text-zinc-300 hover:bg-white/10',
};
export function Button({ variant='primary', loading=false, className='', children, ...props }: ButtonProps) {
  return (
    <button
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Carregando...</>
      ) : children}
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; }
export function Input({ label, className='', ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm text-zinc-300">{label}</span>}
      <input className={`w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green transition-colors ${className}`} {...props} />
    </label>
  );
}

// ── TextArea ───────────────────────────────────────────────
interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; }
export function TextArea({ label, className='', ...props }: TextAreaProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm text-zinc-300">{label}</span>}
      <textarea className={`min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green transition-colors ${className}`} {...props} />
    </label>
  );
}

// ── Stars com meia estrela ─────────────────────────────────
// nota é escala 1-10 (1=0.5★, 10=5★)
// display: divide por 2 para mostrar 0.5-5.0
export function Stars({
  value,      // 1-10 (interno)
  onChange,   // se fornecido, torna interativo
  size = 18,
}: {
  value:     number;
  onChange?: (n: number) => void;
  size?:     number;
}) {
  const [hover, setHover] = useState(-1);
  const display = hover > 0 ? hover : value;

  return (
    <div
      className="flex gap-0.5"
      onMouseLeave={() => setHover(-1)}
      aria-label={`${(value / 2).toFixed(1)} estrelas`}
    >
      {[1, 2, 3, 4, 5].map(star => {
        const halfVal = star * 2 - 1;  // 1,3,5,7,9
        const fullVal = star * 2;       // 2,4,6,8,10
        const filled  = display >= fullVal;
        const half    = !filled && display >= halfVal;

        return (
          <span key={star} className="relative" style={{ width: size, height: size }}>
            {/* Ícone base */}
            <Star
              size={size}
              className="text-checkpoint-green"
              fill={filled ? 'currentColor' : 'none'}
              style={half ? { clipPath: 'inset(0 50% 0 0)', position: 'absolute', fill: 'currentColor' } : undefined}
            />
            {half && (
              <Star size={size} className="text-checkpoint-green absolute inset-0" fill="none" />
            )}

            {/* Zona clicável — metade esquerda (meia estrela) */}
            {onChange && (
              <button
                type="button"
                aria-label={`${halfVal / 2} estrelas`}
                onMouseEnter={() => setHover(halfVal)}
                onClick={() => onChange(halfVal)}
                className="absolute left-0 top-0 h-full w-1/2 cursor-pointer"
              />
            )}
            {/* Zona clicável — metade direita (estrela cheia) */}
            {onChange && (
              <button
                type="button"
                aria-label={`${fullVal / 2} estrelas`}
                onMouseEnter={() => setHover(fullVal)}
                onClick={() => onChange(fullVal)}
                className="absolute right-0 top-0 h-full w-1/2 cursor-pointer"
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────
export function Avatar({ src, name, size='md' }: { src?: string | null; name?: string | null; size?: 'sm'|'md'|'lg' }) {
  const sizes   = { sm: 'h-8 w-8', md: 'h-11 w-11', lg: 'h-24 w-24' };
  const fallback = `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(name || 'user')}`;
  return (
    <img
      src={src || fallback}
      onError={e => { (e.target as HTMLImageElement).src = fallback; }}
      className={`${sizes[size]} flex-shrink-0 rounded-full bg-zinc-800 object-cover ring-1 ring-white/10`}
      alt={name ? `Avatar de ${name}` : 'Avatar'}
      loading="lazy"
    />
  );
}

// ── Skeleton ───────────────────────────────────────────────
export function Skeleton({ className='' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800 ${className}`} />;
}
export function GameCardSkeleton() {
  return (
    <div className="card rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: ()=>void; title?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative surface w-full max-w-md rounded-3xl shadow-2xl">
        {title && (
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h2 className="text-xl font-black">{title}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl leading-none" aria-label="Fechar">&times;</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="card rounded-3xl p-10 text-center">
      <h3 className="text-2xl font-black">{title}</h3>
      {description && <p className="mt-2 text-zinc-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Header({ title, text }: { title: string; text?: string }) {
  return (
    <section className="surface rounded-3xl p-8">
      <p className="meta">Checkpoint</p>
      <h1 className="mt-2 text-5xl font-black">{title}</h1>
      {text && <p className="mt-3 text-zinc-400">{text}</p>}
    </section>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="reveal">
      <h2 className="mb-5 text-3xl font-black">{title}</h2>
      {children}
    </section>
  );
}

// ── GameCard ───────────────────────────────────────────────
export function GameCard({ game }: { game: Jogo }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();
  const libMap    = useLibraryMap();
  const item      = libMap.get(game.id_jogo) as StatusJogo | undefined;

  async function handleStatus(status: string) {
    if (!isAuthenticated) return toast('Faça login para usar a biblioteca.', 'info');
    try {
      await api.post(`/library/games/${game.id_jogo}/status`, { status });
      toast('Biblioteca atualizada.');
      qc.invalidateQueries({ queryKey: ['library'] });
    } catch { toast('Erro ao atualizar biblioteca.', 'error'); }
  }

  async function handleFavorito() {
    if (!isAuthenticated) return toast('Faça login para favoritar.', 'info');
    try {
      if (item?.favorito) {
        await api.delete(`/library/games/${game.id_jogo}/favorite`);
        toast('Favorito removido.');
      } else {
        await api.post(`/library/games/${game.id_jogo}/favorite`);
        toast('Jogo favoritado!');
      }
      qc.invalidateQueries({ queryKey: ['library'] });
    } catch { toast('Erro ao atualizar favorito.', 'error'); }
  }

  return (
    <div className="group card card-hover relative overflow-hidden rounded-2xl">
      {item?.favorito && (
        <span className="pop absolute right-3 top-3 z-10 rounded-full bg-checkpoint-green p-1.5 text-black shadow-lg">
          <Heart size={12} fill="currentColor" />
        </span>
      )}

      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
        <img src={game.img_jogo} alt={game.nm_jogo} loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />

        <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
          <p className="text-xs font-bold text-checkpoint-green">★ {game.media || '—'}</p>
          <Link to={`/jogos/${game.id_jogo}`}
            className="rounded-xl bg-checkpoint-green px-3 py-2 text-center text-xs font-bold text-black">
            Ver jogo
          </Link>
          <button onClick={() => handleStatus('QUERO_JOGAR')}
            className="rounded-xl bg-zinc-800/90 px-3 py-2 text-xs font-bold hover:bg-zinc-700 transition">
            Quero jogar
          </button>
          <button onClick={handleFavorito}
            className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${item?.favorito ? 'bg-checkpoint-green text-black' : 'bg-zinc-800/90 hover:bg-zinc-700'}`}>
            <Heart size={12} fill={item?.favorito ? 'currentColor' : 'none'} />
            {item?.favorito ? 'Favoritado' : 'Favoritar'}
          </button>
        </div>
      </div>

      <Link to={`/jogos/${game.id_jogo}`} className="block p-3 hover:bg-zinc-800/30 transition">
        <h3 className="line-clamp-2 text-sm font-black leading-snug">{game.nm_jogo}</h3>
        {game.genero && <p className="mt-0.5 text-xs text-zinc-400">{game.genero}</p>}
      </Link>
    </div>
  );
}

// ── ReviewCard com likes ───────────────────────────────────
export function ReviewCard({ review, showLike = true }: { review: Avaliacao; showLike?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc        = useQueryClient();
  const [likes, setLikes] = useState(review.likes_count || 0);
  const [curtiu, setCurtiu] = useState(review.ja_curtiu || false);
  const isMine = user?.id_usuario === review.id_usuario;

  async function toggleLike() {
    if (!isAuthenticated) return toast('Faça login para curtir.', 'info');
    if (isMine) return toast('Você não pode curtir sua própria avaliação.', 'info');
    try {
      if (curtiu) {
        const r = await api.delete(`/reviews/${review.id_avaliacao}/like`);
        setLikes(r.data.likes_count);
        setCurtiu(false);
      } else {
        const r = await api.post(`/reviews/${review.id_avaliacao}/like`);
        setLikes(r.data.likes_count);
        setCurtiu(true);
      }
    } catch { toast('Erro ao curtir.', 'error'); }
  }

  return (
    <article className="card rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-3">
        <Link to={`/usuarios/${review.usuario?.id_usuario}`} className="flex-shrink-0">
          <Avatar src={review.usuario?.img_usuario} name={review.usuario?.nm_usuario} size="sm" />
        </Link>
        <div className="min-w-0">
          <Link to={`/usuarios/${review.usuario?.id_usuario}`}
            className="font-bold hover:text-checkpoint-green transition-colors">
            @{review.usuario?.nm_usuario}
          </Link>
          {review.jogo && (
            <p className="truncate text-sm text-zinc-400">
              avaliou{' '}
              <Link to={`/jogos/${review.jogo.id_jogo}`} className="text-zinc-100 hover:text-checkpoint-green transition-colors">
                {review.jogo.nm_jogo}
              </Link>
            </p>
          )}
        </div>
      </div>

      <Stars value={review.nota} size={16} />

      {review.comentario && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-300 line-clamp-3">{review.comentario}</p>
      )}

      {showLike && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={toggleLike}
            disabled={isMine}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
              curtiu
                ? 'bg-checkpoint-green/10 text-checkpoint-green'
                : 'text-zinc-500 hover:text-zinc-300 disabled:cursor-default'
            }`}
            title={isMine ? 'Não pode curtir a própria avaliação' : curtiu ? 'Descurtir' : 'Curtir'}
          >
            <ThumbsUp size={12} fill={curtiu ? 'currentColor' : 'none'} />
            {likes > 0 && <span>{likes}</span>}
          </button>
        </div>
      )}
    </article>
  );
}
