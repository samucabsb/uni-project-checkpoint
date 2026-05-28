/**
 * Busca global — v1.6
 * Um único request retorna jogos, usuários e listas
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Gamepad2, Users, List } from 'lucide-react';
import { api } from '../services/api';
import { useDebounce } from '../hooks';
import { Avatar } from './ui';
import { SearchResult } from '../types';

export function SearchCommand() {
  const navigate   = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const [idx, setIdx]     = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounced  = useDebounce(query, 300);
  const enabled    = debounced.length >= 2;

  // Um único request para jogos + usuários + listas
  const { data } = useQuery<SearchResult>({
    queryKey:  ['global-search', debounced],
    queryFn:   () => api.get('/search', { params: { q: debounced } }).then(r => r.data),
    enabled,
    staleTime: 30_000,
  });

  const jogos    = data?.games    || [];
  const usuarios = data?.users    || [];
  const listas   = data?.lists    || [];
  const hasAny   = jogos.length > 0 || usuarios.length > 0 || listas.length > 0;

  const items = [
    ...jogos.map(g    => ({ type: 'game' as const, id: g.id_jogo })),
    ...usuarios.map(u => ({ type: 'user' as const, id: u.id_usuario })),
    ...listas.map(l   => ({ type: 'list' as const, id: l.id_lista })),
  ];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function clear() { setQuery(''); setOpen(false); setIdx(-1); }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, items.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Escape')    { clear(); }
    if (e.key === 'Enter') {
      const item = items[idx] ?? items[0];
      if (!item) return;
      if (item.type === 'game') navigate(`/jogos/${item.id}`);
      else if (item.type === 'user') navigate(`/usuarios/${item.id}`);
      else navigate(`/listas/${item.id}`);
      clear();
    }
  }

  let gi = -1;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 focus-within:border-checkpoint-green transition-colors">
        <Search size={16} className="text-zinc-500 flex-shrink-0" />
        <input
          value={query}
          onFocus={() => enabled && setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); setIdx(-1); }}
          onKeyDown={onKeyDown}
          placeholder="Buscar jogos, jogadores, listas…"
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500"
          aria-label="Busca global"
        />
        {query && (
          <button onClick={clear} className="text-zinc-500 hover:text-white" aria-label="Limpar busca">
            <X size={14} />
          </button>
        )}
      </div>

      {open && enabled && (
        <div className="dropdown absolute left-0 right-0 top-14 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          {!hasAny ? (
            <p className="p-4 text-sm text-zinc-400">Nenhum resultado para "{debounced}"</p>
          ) : (
            <>
              {/* Jogos */}
              {jogos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 border-b border-zinc-800/50 px-3 py-2">
                    <Gamepad2 size={12} className="text-checkpoint-green" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Jogos</span>
                  </div>
                  {jogos.map(g => { gi++; const ci = gi; return (
                    <button key={g.id_jogo} onMouseDown={() => { navigate(`/jogos/${g.id_jogo}`); clear(); }} onMouseEnter={() => setIdx(ci)}
                      className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${idx === ci ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}>
                      <img src={g.img_jogo} className="h-12 w-9 flex-shrink-0 rounded object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/36x48/18181f/00e187?text=${encodeURIComponent(g.nm_jogo.slice(0,2))}`; }} alt="" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{g.nm_jogo}</p>
                        <p className="text-xs text-zinc-400">{g.genero} · ★ {g.media}</p>
                      </div>
                    </button>
                  ); })}
                </div>
              )}

              {/* Jogadores */}
              {usuarios.length > 0 && (
                <div className={jogos.length ? 'border-t border-zinc-800' : ''}>
                  <div className="flex items-center gap-2 border-b border-zinc-800/50 px-3 py-2">
                    <Users size={12} className="text-checkpoint-green" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Jogadores</span>
                  </div>
                  {usuarios.map(u => { gi++; const ci = gi; return (
                    <Link key={u.id_usuario} to={`/usuarios/${u.id_usuario}`} onMouseDown={clear} onMouseEnter={() => setIdx(ci)}
                      className={`flex items-center gap-3 p-3 transition-colors ${idx === ci ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}>
                      <Avatar src={u.img_usuario} name={u.nm_usuario} size="sm" />
                      <div>
                        <p className="text-sm font-bold">@{u.nm_usuario}</p>
                        <p className="text-xs text-zinc-400">{u._count?.avaliacoes || 0} avaliações</p>
                      </div>
                    </Link>
                  ); })}
                </div>
              )}

              {/* Listas */}
              {listas.length > 0 && (
                <div className={(jogos.length || usuarios.length) ? 'border-t border-zinc-800' : ''}>
                  <div className="flex items-center gap-2 border-b border-zinc-800/50 px-3 py-2">
                    <List size={12} className="text-checkpoint-green" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Listas</span>
                  </div>
                  {listas.map(l => { gi++; const ci = gi; return (
                    <Link key={l.id_lista} to={`/listas/${l.id_lista}`} onMouseDown={clear} onMouseEnter={() => setIdx(ci)}
                      className={`flex items-center gap-3 p-3 transition-colors ${idx === ci ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}>
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-800">
                        <List size={16} className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{l.nm_lista}</p>
                        <p className="text-xs text-zinc-400">por @{l.usuario?.nm_usuario} · {l.jogos?.length || 0} jogos</p>
                      </div>
                    </Link>
                  ); })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
