import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useReveal } from '../hooks';
import { GameCard, ReviewCard, Section } from '../components/ui';
import { DiscoverData } from '../types';

function fmt(n: number) { return n.toLocaleString('pt-BR'); }

export default function Landing() {
  const { user } = useAuth();
  useReveal();

  const { data: discover } = useQuery<DiscoverData>({ queryKey: ['landing'], queryFn: () => api.get('/feed/discover').then(r => r.data), staleTime: 60_000 });
  const { data: stats }    = useQuery<{jogos:number;usuarios:number;avaliacoes:number}>({ queryKey: ['stats'], queryFn: () => api.get('/feed/stats').then(r => r.data), staleTime: 300_000 });

  const jogos   = discover?.games   || [];
  const reviews = discover?.reviews || [];

  return (
    <div className="space-y-16">
      <section className="reveal grid min-h-[60vh] items-center gap-10 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900 p-8 lg:p-12 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <span className="inline-block rounded-full bg-checkpoint-green/10 px-4 py-2 text-sm font-bold text-checkpoint-green">Gaming Network</span>
          <h1 className="mt-5 max-w-2xl text-5xl font-black leading-tight tracking-tight lg:text-6xl">
            {user ? `Bem‑vindo de volta, @${user.nm_usuario}` : 'Registre, avalie e descubra jogos com a comunidade.'}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">
            {user
              ? 'Continue seu checkpoint: veja o feed, organize sua biblioteca ou descubra novos jogos.'
              : 'Checkpoint é uma rede social para acompanhar sua vida gamer, criar listas, favoritar jogos e seguir outros jogadores.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link to="/feed"><button className="rounded-xl bg-checkpoint-green px-6 py-3 text-sm font-bold text-black hover:brightness-110 transition">Ir para o Feed</button></Link>
                <Link to="/biblioteca"><button className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-bold hover:bg-zinc-700 transition">Minha Biblioteca</button></Link>
              </>
            ) : (
              <>
                <Link to="/cadastro"><button className="rounded-xl bg-checkpoint-green px-6 py-3 text-sm font-bold text-black hover:brightness-110 transition">Criar conta grátis</button></Link>
                <Link to="/jogos"><button className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-bold hover:bg-zinc-700 transition">Explorar catálogo</button></Link>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {jogos.slice(0,4).map(g => <GameCard key={g.id_jogo} game={g} />)}
        </div>
      </section>

      {stats && (
        <section className="reveal grid grid-cols-3 gap-4 text-center">
          {[
            { v: stats.jogos,       l: 'jogos no catálogo' },
            { v: stats.usuarios,    l: 'membros'           },
            { v: stats.avaliacoes,  l: 'avaliações'        },
          ].map(({ v, l }) => (
            <div key={l} className="surface rounded-2xl py-6 px-4">
              <p className="text-3xl font-black text-checkpoint-green">{fmt(v)}</p>
              <p className="mt-1 text-sm text-zinc-400">{l}</p>
            </div>
          ))}
        </section>
      )}

      {!user && (
        <Section title="Como funciona">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              { n:'01', t:'Descubra jogos',    d:'Explore um catálogo curado com avaliações da comunidade.' },
              { n:'02', t:'Avalie e registre', d:'Publique resenhas com meia estrela e organize por status.' },
              { n:'03', t:'Crie listas',       d:'Monte coleções temáticas e compartilhe com jogadores.' },
              { n:'04', t:'Siga jogadores',    d:'Acompanhe o feed de quem você segue em tempo real.' },
            ].map(({ n, t, d }) => (
              <div key={n} className="card rounded-2xl p-6">
                <b className="text-2xl font-black text-checkpoint-green">{n}</b>
                <h3 className="mt-4 text-base font-black">{t}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {reviews.length > 0 && (
        <Section title="Avaliações recentes">
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.slice(0,4).map(r => <ReviewCard key={r.id_avaliacao} review={r} />)}
          </div>
        </Section>
      )}
    </div>
  );
}
