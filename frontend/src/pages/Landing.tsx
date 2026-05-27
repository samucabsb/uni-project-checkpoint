/**
 * Landing page — mostra conteúdo diferente para usuário logado vs visitante
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useReveal } from '../hooks';
import { GameCard, ReviewCard, Section } from '../components/ui';
import { DiscoverData } from '../types';

export default function Landing() {
  const { user } = useAuth();
  useReveal();

  const { data } = useQuery<DiscoverData>({
    queryKey: ['landing'],
    queryFn:  () => api.get('/feed/discover').then(r => r.data),
    staleTime: 60_000,
  });

  const jogos    = data?.games   || [];
  const reviews  = data?.reviews || [];

  return (
    <div className="space-y-14">
      {/* Hero — diferente para logado vs visitante */}
      <section className="reveal grid min-h-[62vh] items-center gap-10 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900 p-10 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <span className="rounded-full bg-checkpoint-green/10 px-4 py-2 text-sm font-bold text-checkpoint-green">
            Gaming Network
          </span>

          <h1 className="mt-6 max-w-4xl text-6xl font-black tracking-tight">
            {user
              ? `Bem-vindo de volta, @${user.nm_usuario}`
              : 'Registre, avalie e descubra jogos com a comunidade.'}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            {user
              ? 'Continue seu checkpoint: veja o feed, organize sua biblioteca ou descubra novos jogos.'
              : 'Checkpoint é uma rede social para acompanhar sua vida gamer, criar listas, favoritar jogos e seguir jogadores.'}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link to="/feed">
                  <button className="rounded-xl bg-checkpoint-green px-6 py-3 text-sm font-bold text-black hover:brightness-110 transition">
                    Ir para o Feed
                  </button>
                </Link>
                <Link to="/biblioteca">
                  <button className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-bold hover:bg-zinc-700 transition">
                    Minha Biblioteca
                  </button>
                </Link>
                <Link to="/jogos">
                  <button className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-bold hover:bg-zinc-700 transition">
                    Explorar Jogos
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/cadastro">
                  <button className="rounded-xl bg-checkpoint-green px-6 py-3 text-sm font-bold text-black hover:brightness-110 transition">
                    Criar conta grátis
                  </button>
                </Link>
                <Link to="/jogos">
                  <button className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-bold hover:bg-zinc-700 transition">
                    Explorar catálogo
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Grid de capas de jogos */}
        <div className="grid grid-cols-2 gap-4">
          {jogos.slice(0, 4).map(g => <GameCard key={g.id_jogo} game={g} />)}
        </div>
      </section>

      {/* Como funciona (só para visitantes) */}
      {!user && (
        <Section title="Como funciona">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              'Descubra jogos no catálogo',
              'Publique avaliações com estrelas',
              'Crie listas e favorite jogos',
              'Siga jogadores no feed',
            ].map((t, i) => (
              <div key={t} className="card rounded-2xl p-6">
                <b className="text-checkpoint-green text-2xl font-black">0{i + 1}</b>
                <h3 className="mt-4 text-lg font-black">{t}</h3>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Avaliações recentes */}
      {reviews.length > 0 && (
        <Section title="Avaliações recentes">
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.slice(0, 4).map(r => <ReviewCard key={r.id_avaliacao} review={r} />)}
          </div>
        </Section>
      )}
    </div>
  );
}
