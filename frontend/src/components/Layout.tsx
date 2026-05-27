import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Gamepad2, LogOut, Shield, Library } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Avatar } from './ui';
import { SearchCommand } from './SearchCommand';
import { Footer } from './Footer';

export function Layout() {
  const { user, logout } = useAuth();
  const { toast }        = useToast();
  const navigate         = useNavigate();

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-black flex-shrink-0">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-checkpoint-green text-black"><Gamepad2 size={20} /></span>
            <span className="hidden sm:block">Checkpoint</span>
          </Link>

          <SearchCommand />

          <nav className="flex items-center gap-1 text-sm font-bold">
            {[{to:'/feed',l:'Feed'},{to:'/jogos',l:'Jogos'},{to:'/listas',l:'Listas'}].map(({to,l}) => (
              <NavLink key={to} to={to} className={({isActive}) => `rounded-lg px-3 py-2 transition-colors ${isActive?'text-checkpoint-green':'text-zinc-400 hover:text-zinc-100'}`}>{l}</NavLink>
            ))}
            {user && (
              <NavLink to="/biblioteca" className={({isActive}) => `flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${isActive?'text-checkpoint-green':'text-zinc-400 hover:text-zinc-100'}`}>
                <Library size={14} /><span className="hidden md:block">Biblioteca</span>
              </NavLink>
            )}
            {user?.tipo_usuario === 'ADMIN' && (
              <NavLink to="/admin" className={({isActive}) => `flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${isActive?'text-checkpoint-green':'text-zinc-400 hover:text-zinc-100'}`}>
                <Shield size={14} /><span className="hidden md:block">Admin</span>
              </NavLink>
            )}
          </nav>

          {user ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to={`/usuarios/${user.id_usuario}`} className="flex items-center gap-2 rounded-xl p-1 hover:bg-zinc-900 transition-colors">
                <Avatar src={user.img_usuario} name={user.nm_usuario} size="sm" />
                <span className="hidden text-sm font-semibold sm:block text-zinc-300">@{user.nm_usuario}</span>
              </Link>
              <Button variant="ghost" className="p-2" title="Sair" onClick={() => { logout(); toast('Até a próxima!'); navigate('/'); }}>
                <LogOut size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/login"><Button variant="secondary" className="py-2">Entrar</Button></Link>
              <Link to="/cadastro"><Button className="py-2">Criar conta</Button></Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8"><Outlet /></main>
      <Footer />
    </div>
  );
}

export function Private({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-checkpoint-green border-t-transparent" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function AdminOnly({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.tipo_usuario !== 'ADMIN') return <Navigate to="/feed" replace />;
  return children;
}
