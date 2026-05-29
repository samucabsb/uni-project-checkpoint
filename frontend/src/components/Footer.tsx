import { Link } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-zinc-900 bg-black/60">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 text-lg font-black">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-checkpoint-green text-black">
                <Gamepad2 size={18} />
              </span>
              Checkpoint
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
              Registre sua jornada gamer. Avalie, organize e descubra jogos com outros jogadores.
            </p>
          </div>
          <div>
            <p className="meta mb-4">Navegar</p>
            <ul className="space-y-2">
              {[{l:'Feed',to:'/feed'},{l:'Catálogo',to:'/jogos'},{l:'Listas',to:'/listas'},{l:'Biblioteca',to:'/biblioteca'}].map(({l,to}) => (
                <li key={to}><Link to={to} className="text-sm text-zinc-400 hover:text-checkpoint-green transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="meta mb-4">Projeto</p>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>UNIEURO — Projeto Integrador</li>
              <li>Samuel · Vinícius · Ana Júlia</li>
              <li>Prof. Jorge Osvaldo A. L. Torres</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-900 pt-6">
          <p className="text-xs text-zinc-600">© {year} Checkpoint · Projeto Integrador UNIEURO</p>
          <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-600">v1.7.0</span>
        </div>
      </div>
    </footer>
  );
}
