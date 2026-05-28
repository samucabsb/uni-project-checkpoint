/**
 * Layout — v1.6
 * Adições: navbar mobile com menu hamburger, Esc fecha menus
 */

import { useState, useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Gamepad2, LogOut, Shield, Library, Menu, X, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Avatar } from './ui';
import { SearchCommand } from './SearchCommand';
import { Footer } from './Footer';

export function Layout() {
  const { user, logout } = useAuth();
  const { toast }        = useToast();
  const navigate         = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha menu mobile ao pressionar Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Fecha menu mobile ao navegar
  const closeMenu = () => setMobileOpen(false);

  const NAV_LINKS = [
    { to: '/feed',   label: 'Feed'   },
    { to: '/jogos',  label: 'Jogos'  },
    { to: '/listas', label: 'Listas' },
  ];

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-black flex-shrink-0">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-checkpoint-green text-black">
              <Gamepad2 size={20} />
            </span>
            <span className="hidden sm:block">Checkpoint</span>
          </Link>

          {/* Busca — oculta no mobile quando menu aberto */}
          <div className="hidden md:block flex-1 max-w-xs">
            <SearchCommand />
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-bold">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition-colors ${isActive ? 'text-checkpoint-green' : 'text-zinc-400 hover:text-zinc-100'}`}>
                {label}
              </NavLink>
            ))}
            {user && (
              <>
                <NavLink to="/biblioteca" className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${isActive ? 'text-checkpoint-green' : 'text-zinc-400 hover:text-zinc-100'}`}>
                  <Library size={14} /><span className="hidden lg:block">Biblioteca</span>
                </NavLink>
                <NavLink to="/diario" className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${isActive ? 'text-checkpoint-green' : 'text-zinc-400 hover:text-zinc-100'}`}>
                  <BookOpen size={14} /><span className="hidden lg:block">Diário</span>
                </NavLink>
              </>
            )}
            {user?.tipo_usuario === 'ADMIN' && (
              <NavLink to="/admin" className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${isActive ? 'text-checkpoint-green' : 'text-zinc-400 hover:text-zinc-100'}`}>
                <Shield size={14} /><span className="hidden lg:block">Admin</span>
              </NavLink>
            )}
          </nav>

          {/* Área do usuário — desktop */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                <Link to={`/usuarios/${user.id_usuario}`}
                  className="flex items-center gap-2 rounded-xl p-1 hover:bg-zinc-900 transition-colors">
                  <Avatar src={user.img_usuario} name={user.nm_usuario} size="sm" />
                  <span className="hidden text-sm font-semibold lg:block text-zinc-300">@{user.nm_usuario}</span>
                </Link>
                <Button variant="ghost" className="p-2" title="Sair"
                  onClick={() => { logout(); toast('Até a próxima!'); navigate('/'); }}>
                  <LogOut size={16} />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="secondary" className="py-2">Entrar</Button></Link>
                <Link to="/cadastro"><Button className="py-2">Criar conta</Button></Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            className="md:hidden rounded-xl p-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Menu mobile */}
        {mobileOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-black/95 px-6 py-4 space-y-3">
            <SearchCommand />

            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to} onClick={closeMenu}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-bold transition-colors ${isActive ? 'bg-checkpoint-green/10 text-checkpoint-green' : 'text-zinc-300 hover:bg-zinc-900'}`}>
                  {label}
                </NavLink>
              ))}
              {user && (
                <>
                  <NavLink to="/biblioteca" onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${isActive ? 'bg-checkpoint-green/10 text-checkpoint-green' : 'text-zinc-300 hover:bg-zinc-900'}`}>
                    <Library size={16} /> Biblioteca
                  </NavLink>
                  <NavLink to="/diario" onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${isActive ? 'bg-checkpoint-green/10 text-checkpoint-green' : 'text-zinc-300 hover:bg-zinc-900'}`}>
                    <BookOpen size={16} /> Diário
                  </NavLink>
                  <NavLink to={`/usuarios/${user.id_usuario}`} onClick={closeMenu}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-zinc-900 transition-colors">
                    <Avatar src={user.img_usuario} name={user.nm_usuario} size="sm" />
                    <span className="text-sm font-bold">@{user.nm_usuario}</span>
                  </NavLink>
                </>
              )}
            </nav>

            {user ? (
              <button onClick={() => { logout(); toast('Até a próxima!'); navigate('/'); closeMenu(); }}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-900/20 transition-colors">
                <LogOut size={16} /> Sair
              </button>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={closeMenu} className="flex-1">
                  <Button variant="secondary" className="w-full">Entrar</Button>
                </Link>
                <Link to="/cadastro" onClick={closeMenu} className="flex-1">
                  <Button className="w-full">Criar conta</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export function Private({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-checkpoint-green border-t-transparent" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function AdminOnly({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.tipo_usuario !== 'ADMIN') return <Navigate to="/feed" replace />;
  return children;
}
