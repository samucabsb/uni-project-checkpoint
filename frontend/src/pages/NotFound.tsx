import { Link } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-checkpoint-green/10 text-checkpoint-green">
        <Gamepad2 size={36} />
      </div>
      <div>
        <p className="meta mb-2">Erro 404</p>
        <h1 className="text-5xl font-black">Página não encontrada</h1>
        <p className="mt-3 max-w-sm text-zinc-400">Esta página não existe ou foi removida.</p>
      </div>
      <div className="flex gap-3">
        <Link to="/" className="rounded-xl bg-checkpoint-green px-6 py-3 text-sm font-bold text-black hover:brightness-110 transition">Ir para o início</Link>
        <Link to="/jogos" className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-bold hover:bg-zinc-700 transition">Ver catálogo</Link>
      </div>
    </div>
  );
}
