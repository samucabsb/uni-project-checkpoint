/**
 * Componentes UI — Checkpoint v1.6
 * Melhorias: onError em imagens, mobile-friendly GameCard,
 *            aria-labels, Modal com Esc, Stars refinadas
 */

import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLibraryMap } from '../hooks';
import { Jogo, Avaliacao, StatusJogo } from '../types';

// ── Button ─────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; loading?: boolean;
}
const VC: Record<Variant, string> = {
  primary:   'bg-checkpoint-green text-black hover:brightness-110',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
  danger:    'bg-red-500 text-white hover:bg-red-400',
  ghost:     'bg-transparent text-zinc-300 hover:bg-white/10',
};
export function Button({ variant='primary', loading=false, className='', children, ...props }: ButtonProps) {
  return (
    <button disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-60 ${VC[variant]} ${className}`}
      {...props}>
      {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>Carregando…</> : children}
    </button>
  );
}

export function Input({ label, className='', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm text-zinc-300">{label}</span>}
      <input className={`w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green transition-colors ${className}`} {...props}/>
    </label>
  );
}

export function TextArea({ label, className='', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm text-zinc-300">{label}</span>}
      <textarea className={`min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green transition-colors ${className}`} {...props}/>
    </label>
  );
}


// ── PasswordInput — campo de senha com toggle show/hide ──
export function PasswordInput({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm text-zinc-300">{label}</span>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={`w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 pr-11 outline-none focus:border-checkpoint-green transition-colors ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors"
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
    </label>
  );
}

// ── Stars com meia estrela ─────────────────────────────────
export function Stars({ value, onChange, size=18 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  const [hover, setHover] = useState(-1);
  const display = hover > 0 ? hover : value;
  const stars = Number((display / 2).toFixed(1));

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(-1)}
      aria-label={`${stars} estrelas`} role={onChange ? 'radiogroup' : 'img'}>
      {[1, 2, 3, 4, 5].map(star => {
        const halfVal = star * 2 - 1;
        const fullVal = star * 2;
        const filled  = display >= fullVal;
        const half    = !filled && display >= halfVal;

        return (
          <span key={star} className="relative inline-block" style={{ width: size, height: size }}>
            {/* Ícone visual */}
            {filled ? (
              <Star size={size} className="text-checkpoint-green" fill="currentColor" />
            ) : half ? (
              <>
                <Star size={size} className="text-checkpoint-green" fill="none" />
                <Star size={size} className="text-checkpoint-green absolute inset-0"
                  fill="currentColor" style={{ clipPath: 'inset(0 50% 0 0)' }} />
              </>
            ) : (
              <Star size={size} className="text-zinc-700" fill="none" />
            )}

            {/* Zonas clicáveis */}
            {onChange && (
              <>
                <button type="button" aria-label={`${halfVal/2} estrelas`}
                  onMouseEnter={() => setHover(halfVal)} onClick={() => onChange(halfVal)}
                  className="absolute left-0 top-0 h-full w-1/2 cursor-pointer" />
                <button type="button" aria-label={`${fullVal/2} estrelas`}
                  onMouseEnter={() => setHover(fullVal)} onClick={() => onChange(fullVal)}
                  className="absolute right-0 top-0 h-full w-1/2 cursor-pointer" />
              </>
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
    <img src={src || fallback} onError={e => { (e.target as HTMLImageElement).src = fallback; }}
      className={`${sizes[size]} flex-shrink-0 rounded-full bg-zinc-800 object-cover ring-1 ring-white/10`}
      alt={name ? `Avatar de ${name}` : 'Avatar'} loading="lazy"/>
  );
}

// Placeholder para imagem de jogo quebrada
function gameImgFallback(nm_jogo: string) {
  return `https://placehold.co/300x400/18181f/00e187?text=${encodeURIComponent(nm_jogo.slice(0, 12))}`;
}

// ── Skeleton ───────────────────────────────────────────────
export function Skeleton({ className='' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800 ${className}`}/>;
}
export function GameCardSkeleton() {
  return (
    <div className="card rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[3/4] rounded-none" />
      <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4"/><Skeleton className="h-3 w-1/2"/></div>
    </div>
  );
}

// ── Modal com Esc ─────────────────────────────────────────
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: ()=>void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
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

export function Section({ title, children, animate = true }: { title: string; children: ReactNode; animate?: boolean }) {
  return (
    <section className={animate ? 'reveal' : ''}>
      <h2 className="mb-5 text-3xl font-black">{title}</h2>
      {children}
    </section>
  );
}

// ── GameCard — mobile-friendly ────────────────────────────
// Link sempre visível embaixo; ações rápidas no hover/focus para desktop
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
      if (item?.favorito) { await api.delete(`/library/games/${game.id_jogo}/favorite`); toast('Favorito removido.'); }
      else                { await api.post(`/library/games/${game.id_jogo}/favorite`);   toast('Favoritado!'); }
      qc.invalidateQueries({ queryKey: ['library'] });
    } catch { toast('Erro ao atualizar.', 'error'); }
  }

  return (
    <div className="group card card-hover relative overflow-hidden rounded-2xl">
      {item?.favorito && (
        <span className="pop absolute right-3 top-3 z-10 rounded-full bg-checkpoint-green p-1.5 text-black shadow-lg">
          <Heart size={12} fill="currentColor" aria-hidden="true"/>
        </span>
      )}

      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
        <img src={game.img_jogo} alt={`Capa de ${game.nm_jogo}`} loading="lazy"
          onError={e => { (e.target as HTMLImageElement).src = gameImgFallback(game.nm_jogo); }}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>

        {/* Overlay — hover desktop */}
        <div className="absolute inset-0 flex flex-col justify-end gap-1.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <p className="text-xs font-bold text-checkpoint-green">★ {game.media || '—'}</p>
          <Link to={`/jogos/${game.id_jogo}`}
            className="rounded-xl bg-checkpoint-green px-3 py-2 text-center text-xs font-bold text-black">
            Ver jogo
          </Link>
          <button onClick={() => handleStatus('QUERO_JOGAR')}
            className="rounded-xl bg-zinc-800/90 px-3 py-2 text-xs font-bold hover:bg-zinc-700 transition">
            Quero jogar
          </button>
          <button onClick={handleFavorito} aria-label={item?.favorito ? 'Remover favorito' : 'Favoritar'}
            className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${item?.favorito ? 'bg-checkpoint-green text-black' : 'bg-zinc-800/90 hover:bg-zinc-700'}`}>
            <Heart size={12} fill={item?.favorito ? 'currentColor' : 'none'}/>
            {item?.favorito ? 'Favoritado' : 'Favoritar'}
          </button>
        </div>
      </div>

      {/* Info sempre visível — funciona no mobile sem hover */}
      <Link to={`/jogos/${game.id_jogo}`} className="block p-3 hover:bg-zinc-800/30 transition-colors">
        <h3 className="line-clamp-2 text-sm font-black leading-snug">{game.nm_jogo}</h3>
        <div className="mt-0.5 flex items-center justify-between">
          {game.genero && <p className="text-xs text-zinc-400 truncate">{game.genero}</p>}
          {game.media && <p className="text-xs font-bold text-checkpoint-green flex-shrink-0">★ {game.media}</p>}
        </div>
      </Link>
    </div>
  );
}

// ── ReviewCard — com LIKE e DISLIKE ──────────────────────
export function ReviewCard({ review, showGame=true }: {
  review: Avaliacao; showGame?: boolean;
}) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const isMine = user?.id_usuario === review.id_usuario;

  const [likes,    setLikes]    = useState(review.likes_count    || 0);
  const [dislikes, setDislikes] = useState(review.dislikes_count || 0);
  const [minhaReacao, setMinhaReacao] = useState<'LIKE'|'DISLIKE'|null>(
    review.minha_reacao ?? (review.ja_curtiu ? 'LIKE' : null)
  );

  async function react(tipo: 'LIKE' | 'DISLIKE') {
    if (!isAuthenticated) return toast('Faça login para reagir.', 'info');
    if (isMine)           return toast('Você não pode reagir à sua própria avaliação.', 'info');
    try {
      const r = await api.post(`/reviews/${review.id_avaliacao}/react`, { tipo });
      setLikes(r.data.likes_count);
      setDislikes(r.data.dislikes_count);
      setMinhaReacao(r.data.minha_reacao);
    } catch { toast('Erro ao reagir.', 'error'); }
  }

  return (
    <article className="card rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-3">
        <Link to={`/usuarios/${review.usuario?.id_usuario}`} className="flex-shrink-0">
          <Avatar src={review.usuario?.img_usuario} name={review.usuario?.nm_usuario} size="sm"/>
        </Link>
        <div className="min-w-0">
          <Link to={`/usuarios/${review.usuario?.id_usuario}`} className="font-bold hover:text-checkpoint-green transition-colors">
            @{review.usuario?.nm_usuario}
          </Link>
          {showGame && review.jogo && (
            <p className="truncate text-sm text-zinc-400">
              avaliou{' '}
              <Link to={`/jogos/${review.jogo.id_jogo}`} className="text-zinc-100 hover:text-checkpoint-green transition-colors">
                {review.jogo.nm_jogo}
              </Link>
            </p>
          )}
        </div>
        <Link to={`/reviews/${review.id_avaliacao}`} className="ml-auto flex-shrink-0 text-xs text-zinc-600 hover:text-zinc-400 transition-colors" title="Ver avaliação completa">
          #
        </Link>
      </div>

      <Stars value={review.nota} size={16}/>

      {review.comentario && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-300 line-clamp-3">{review.comentario}</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {/* Like */}
        <button onClick={() => react('LIKE')} disabled={isMine}
          aria-label={minhaReacao === 'LIKE' ? 'Remover like' : 'Curtir'}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition disabled:cursor-default ${minhaReacao === 'LIKE' ? 'bg-checkpoint-green/10 text-checkpoint-green' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <ThumbsUp size={12} fill={minhaReacao === 'LIKE' ? 'currentColor' : 'none'}/>
          {likes > 0 && <span>{likes}</span>}
        </button>
        {/* Dislike */}
        <button onClick={() => react('DISLIKE')} disabled={isMine}
          aria-label={minhaReacao === 'DISLIKE' ? 'Remover dislike' : 'Não curtir'}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition disabled:cursor-default ${minhaReacao === 'DISLIKE' ? 'bg-red-500/10 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <ThumbsDown size={12} fill={minhaReacao === 'DISLIKE' ? 'currentColor' : 'none'}/>
          {dislikes > 0 && <span>{dislikes}</span>}
        </button>
        {(review.comments_count || 0) > 0 && (
          <Link to={`/reviews/${review.id_avaliacao}`}
            className="ml-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            {review.comments_count} comentário{review.comments_count !== 1 ? 's' : ''}
          </Link>
        )}
      </div>
    </article>
  );
}
