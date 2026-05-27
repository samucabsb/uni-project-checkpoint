/**
 * Layout principal — Navbar + conteúdo + Guards de rota
 */

import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Gamepad2, LogOut, Shield, Library } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Avatar } from './ui';
import { SearchCommand } from './SearchCommand';

export function Layout() {
  const { user, logout } = useAuth();
  const { toast }        = useToast();
  const navigate         = useNavigate();

  function handleLogout() {
    logout();
    toast('Até a próxima!');
    navigate('/');
  }

  return (
    <div className="app-bg min-h-screen">
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-black flex-shrink-0">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-checkpoint-green text-black">
              <Gamepad2 size={20} />
            </span>
            <span className="hidden sm:block">Checkpoint</span>
          </Link>

          {/* Busca inteligente */}
          <SearchCommand />

          {/* Navegação principal */}
          <nav className="flex items-center gap-1 text-sm font-bold">
            {[
              { to: '/feed',   label: 'Feed'   },
              { to: '/jogos',  label: 'Jogos'  },
              { to: '/listas', label: 'Listas' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${isActive ? 'text-checkpoint-green' : 'text-zinc-400 hover:text-zinc-100'}`
                }
              >
                {label}
              </NavLink>
            ))}

            {user && (
              <NavLink
                to="/biblioteca"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${isActive ? 'text-checkpoint-green' : 'text-zinc-400 hover:text-zinc-100'}`
                }
              >
                <Library size={14} />
                <span className="hidden md:block">Biblioteca</span>
              </NavLink>
            )}

            {user?.tipo_usuario === 'ADMIN' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${isActive ? 'text-checkpoint-green' : 'text-zinc-400 hover:text-zinc-100'}`
                }
              >
                <Shield size={14} />
                <span className="hidden md:block">Admin</span>
              </NavLink>
            )}
          </nav>

          {/* Área do usuário */}
          {user ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to={`/usuarios/${user.id_usuario}`}
                className="flex items-center gap-2 rounded-xl p-1 hover:bg-zinc-900 transition-colors"
              >
                <Avatar src={user.img_usuario} name={user.nm_usuario} size="sm" />
                <span className="hidden text-sm font-semibold sm:block text-zinc-300 hover:text-white">
                  @{user.nm_usuario}
                </span>
              </Link>
              <Button variant="ghost" onClick={handleLogout} className="p-2" title="Sair">
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

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

/** Exige login — redireciona para /login se não autenticado */
export function Private({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-checkpoint-green border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

/** Exige tipo ADMIN — redireciona para /feed se não for admin */
export function AdminOnly({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user?.tipo_usuario !== 'ADMIN') return <Navigate to="/feed" replace />;
  return children;
}
