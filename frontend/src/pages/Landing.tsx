/**
 * Landing — v1.6
 * Animações reveal apenas em seções abaixo do fold.
 * Hero, stats e CTA inicial sem reveal para garantir visibilidade.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Gamepad2, Users, Star, TrendingUp, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { useReveal } from '../hooks';
import { GameCard, ReviewCard } from '../components/ui';
import { DiscoverData, TrendingData } from '../types';

export default function Landing() {
  useReveal();
  const { user } = useAuth();

  const { data: stats }    = useQuery({ queryKey: ['stats'],            queryFn: () => api.get('/feed/stats').then(r => r.data),                                        staleTime: 60_000 });
  const { data: discover } = useQuery<DiscoverData>({ queryKey: ['feed','discover'], queryFn: () => api.get('/feed/discover').then(r => r.data),                        staleTime: 60_000 });
  const { data: trending } = useQuery<TrendingData>({ queryKey: ['trending','semana'], queryFn: () => api.get('/feed/trending', { params: { periodo: 'semana' } }).then(r => r.data), staleTime: 60_000 });

  return (
    <div className="space-y-16">
      {/* ── Hero — SEM reveal (visível imediatamente) ────── */}
      <section className="rounded-3xl overflow-hidden border border-zinc-900">
        <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-8 sm:p-14 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-checkpoint-green/30 bg-checkpoint-green/10 px-4 py-1.5 text-sm font-bold text-checkpoint-green">
            <span className="h-2 w-2 animate-pulse rounded-full bg-checkpoint-green"/>
            Sua rede social de jogos
          </div>
          <h1 className="text-5xl sm:text-7xl font-black leading-none tracking-tight">
            Checkpoint<span className="text-checkpoint-green">.</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-zinc-400">
            Registre o que jogou, descubra o que jogar e conecte-se com outros gamers.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {user ? (
              <Link to="/feed" className="rounded-xl bg-checkpoint-green px-8 py-3.5 font-black text-black hover:brightness-110 transition">
                Ver meu feed
              </Link>
            ) : (
              <Link to="/cadastro" className="rounded-xl bg-checkpoint-green px-8 py-3.5 font-black text-black hover:brightness-110 transition">
                Criar conta gratuita
              </Link>
            )}
            <Link to="/jogos" className="rounded-xl bg-zinc-800 px-8 py-3.5 font-black hover:bg-zinc-700 transition border border-zinc-700">
              Explorar jogos
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats — SEM reveal ───────────────────────────── */}
      {stats && (
        <section className="grid grid-cols-3 gap-4">
          {[
            { icon: <Gamepad2 className="text-checkpoint-green" size={22}/>, value: stats.jogos,      label: 'jogos cadastrados'      },
            { icon: <Users    className="text-checkpoint-green" size={22}/>, value: stats.usuarios,   label: 'jogadores registrados'  },
            { icon: <Star     className="text-checkpoint-green" size={22}/>, value: stats.avaliacoes, label: 'avaliações publicadas'  },
          ].map(({ icon, value, label }) => (
            <div key={label} className="card rounded-2xl p-5 text-center">
              <div className="flex justify-center mb-2">{icon}</div>
              <p className="text-3xl font-black">{value.toLocaleString('pt-BR')}</p>
              <p className="mt-1 text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </section>
      )}

      {/* ── Em alta — com reveal (abaixo do fold) ────────── */}
      {trending?.games && trending.games.length > 0 && (
        <section className="reveal space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-checkpoint-green"/>
              <h2 className="text-2xl font-black">Em alta esta semana</h2>
            </div>
            <Link to="/feed" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-checkpoint-green transition-colors">
              Ver tudo <ChevronRight size={14}/>
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {trending.games.slice(0, 6).map(g => <GameCard key={g.id_jogo} game={g}/>)}
          </div>
        </section>
      )}

      {/* ── Reviews populares ─────────────────────────────── */}
      {trending?.reviews && trending.reviews.length > 0 && (
        <section className="reveal space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Reviews populares</h2>
            <Link to="/feed" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-checkpoint-green transition-colors">
              Ver feed <ChevronRight size={14}/>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {trending.reviews.slice(0, 4).map(r => <ReviewCard key={r.id_avaliacao} review={r}/>)}
          </div>
        </section>
      )}

      {/* ── Catálogo recente ──────────────────────────────── */}
      {discover?.games && discover.games.length > 0 && (
        <section className="reveal space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Catálogo</h2>
            <Link to="/jogos" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-checkpoint-green transition-colors">
              Ver todos <ChevronRight size={14}/>
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {discover.games.slice(0, 8).map(g => <GameCard key={g.id_jogo} game={g}/>)}
          </div>
        </section>
      )}

      {/* ── CTA final ─────────────────────────────────────── */}
      <section className="reveal card rounded-3xl p-8 sm:p-12 text-center space-y-4">
        {user ? (
          <>
            <h2 className="text-4xl font-black">Continue explorando</h2>
            <p className="text-zinc-400">Veja o que está em alta, descubra novos jogos ou confira seu perfil.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/feed" className="rounded-xl bg-checkpoint-green px-8 py-3.5 font-black text-black hover:brightness-110 transition">Ir para o feed</Link>
              <Link to="/jogos" className="rounded-xl bg-zinc-800 px-8 py-3.5 font-black hover:bg-zinc-700 transition border border-zinc-700">Ver catálogo</Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-4xl font-black">Pronto para jogar?</h2>
            <p className="text-zinc-400">Crie sua conta e comece a registrar sua jornada gamer hoje.</p>
            <Link to="/cadastro" className="inline-block rounded-xl bg-checkpoint-green px-8 py-3.5 font-black text-black hover:brightness-110 transition">
              Começar agora — é grátis
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
