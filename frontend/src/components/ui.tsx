/**
 * Componentes de UI reutilizáveis do Checkpoint v1.3
 * Button, Input, TextArea, Select, Stars, Avatar, Skeleton, Modal, GameCard, ReviewCard
 */

import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
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
export function Button({ variant = 'primary', loading = false, className = '', children, ...props }: ButtonProps) {
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
export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm text-zinc-300">{label}</span>}
      <input
        className={`w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green ${className}`}
        {...props}
      />
    </label>
  );
}

// ── TextArea ───────────────────────────────────────────────
interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; }
export function TextArea({ label, className = '', ...props }: TextAreaProps) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm text-zinc-300">{label}</span>}
      <textarea
        className={`min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green ${className}`}
        {...props}
      />
    </label>
  );
}

// ── Select ─────────────────────────────────────────────────
export function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm text-zinc-300">{label}</span>}
      <select
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-checkpoint-green"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

// ── Stars ──────────────────────────────────────────────────
export function Stars({ value, onChange, size = 18 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-1 text-checkpoint-green">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className="transition hover:scale-125 disabled:cursor-default"
        >
          <Star size={size} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────
// BUG CORRIGIDO: fallback quando img_usuario é null
export function Avatar({ src, name, size = 'md' }: { src?: string | null; name?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'h-8 w-8', md: 'h-11 w-11', lg: 'h-24 w-24' }[size];
  const fallback  = `https://api.dicebear.com/8.x/adventurer/svg?seed=${name || 'user'}`;
  return (
    <img
      src={src || fallback}
      onError={e => { (e.target as HTMLImageElement).src = fallback; }}
      className={`${sizeClass} rounded-full bg-zinc-800 object-cover ring-1 ring-white/10`}
      alt={name || 'avatar'}
    />
  );
}

// ── Skeleton ───────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800 ${className}`} />;
}

export function GameCardSkeleton() {
  return (
    <div className="card rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────
// Substitui confirm() do browser por um modal próprio
export function Modal({ open, onClose, title, children }: {
  open:     boolean;
  onClose:  () => void;
  title?:   string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative surface rounded-3xl w-full max-w-md shadow-2xl">
        {title && (
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h2 className="text-xl font-black">{title}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl leading-none">&times;</button>
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

// ── Header de página ───────────────────────────────────────
export function Header({ title, text }: { title: string; text?: string }) {
  return (
    <section className="surface rounded-3xl p-8">
      <p className="meta">Checkpoint</p>
      <h1 className="mt-2 text-5xl font-black">{title}</h1>
      {text && <p className="mt-3 text-zinc-400">{text}</p>}
    </section>
  );
}

// ── Section ────────────────────────────────────────────────
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="reveal">
      <h2 className="mb-5 text-3xl font-black">{title}</h2>
      {children}
    </section>
  );
}

// ── GameCard com favorito (coração verde) ──────────────────
export function GameCard({ game }: { game: Jogo }) {
  const { isAuthenticated } = useAuth();
  const { toast }  = useToast();
  const qc         = useQueryClient();
  const libMap     = useLibraryMap();
  const item       = libMap.get(game.id_jogo) as StatusJogo | undefined;

  async function handleStatus(status: string) {
    if (!isAuthenticated) return toast('Faça login para usar a biblioteca.', 'info');
    await api.post(`/library/games/${game.id_jogo}/status`, { status });
    toast('Biblioteca atualizada.');
    qc.invalidateQueries({ queryKey: ['library'] });
  }

  async function handleFavorito() {
    if (!isAuthenticated) return toast('Faça login para favoritar.', 'info');
    if (item?.favorito) {
      await api.delete(`/library/games/${game.id_jogo}/favorite`);
      toast('Favorito removido.');
    } else {
      await api.post(`/library/games/${game.id_jogo}/favorite`);
      toast('Jogo favoritado!');
    }
    qc.invalidateQueries({ queryKey: ['library'] });
  }

  return (
    <div className="group card card-hover relative overflow-hidden rounded-2xl">
      {/* Coração verde no canto: aparece quando é favorito */}
      {item?.favorito && (
        <span className="pop absolute right-3 top-3 z-10 rounded-full bg-checkpoint-green p-2 text-black shadow-lg">
          <Heart size={14} fill="currentColor" />
        </span>
      )}

      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
        <img
          src={game.img_jogo}
          alt={game.nm_jogo}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Overlay de hover com ações rápidas */}
        <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-black/80 p-4 opacity-0 transition group-hover:opacity-100">
          <p className="font-bold text-checkpoint-green text-sm">★ {game.media || 0}</p>
          <Link
            to={`/jogos/${game.id_jogo}`}
            className="rounded-xl bg-checkpoint-green px-3 py-2 text-center text-sm font-bold text-black"
          >
            Ver jogo
          </Link>
          <button
            onClick={() => handleStatus('QUERO_JOGAR')}
            className="rounded-xl bg-zinc-700 px-3 py-2 text-sm font-bold hover:bg-zinc-600"
          >
            Quero jogar
          </button>
          <button
            onClick={handleFavorito}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${
              item?.favorito ? 'bg-checkpoint-green text-black' : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
          >
            <Heart size={14} fill={item?.favorito ? 'currentColor' : 'none'} />
            {item?.favorito ? 'Remover favorito' : 'Favoritar'}
          </button>
        </div>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-black leading-snug">{game.nm_jogo}</h3>
        {game.genero && <p className="mt-0.5 text-xs text-zinc-400">{game.genero}</p>}
      </div>
    </div>
  );
}

// ── ReviewCard ─────────────────────────────────────────────
export function ReviewCard({ review }: { review: Avaliacao }) {
  return (
    <article className="card rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-3">
        <Link to={`/usuarios/${review.usuario?.id_usuario}`} className="flex-shrink-0">
          <Avatar src={review.usuario?.img_usuario} name={review.usuario?.nm_usuario} size="sm" />
        </Link>
        <div className="min-w-0">
          <Link to={`/usuarios/${review.usuario?.id_usuario}`} className="font-bold hover:text-checkpoint-green transition-colors">
            @{review.usuario?.nm_usuario}
          </Link>
          {review.jogo && (
            <p className="truncate text-sm text-zinc-400">
              avaliou{' '}
              <Link to={`/jogos/${review.jogo.id_jogo}`} className="text-zinc-100 hover:text-checkpoint-green">
                {review.jogo.nm_jogo}
              </Link>
            </p>
          )}
        </div>
      </div>
      <Stars value={review.nota} />
      <p className="mt-3 text-sm leading-relaxed text-zinc-300 line-clamp-3">{review.comentario}</p>
    </article>
  );
}
