/**
 * Busca inteligente com dropdown de resultados
 * Debounce de 300ms + navegação por teclado
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { api } from '../services/api';
import { useDebounce } from '../hooks';
import { Jogo } from '../types';

export function SearchCommand() {
  const navigate   = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const [idx, setIdx]     = useState(-1);
  const inputRef   = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounced  = useDebounce(query, 300);

  const { data: results = [] } = useQuery<Jogo[]>({
    queryKey: ['search', debounced],
    queryFn:  () => api.get('/games/search', { params: { q: debounced } }).then(r => r.data),
    enabled:  debounced.length >= 2,
    staleTime: 30_000,
  });

  // Fecha ao clicar fora
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function go(id: number) {
    navigate(`/jogos/${id}`);
    setQuery('');
    setOpen(false);
    setIdx(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter') {
      if (idx >= 0) go(results[idx].id_jogo);
      else if (results[0]) go(results[0].id_jogo);
    }
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  }

  return (
    <div ref={wrapperRef} className="relative w-72">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 focus-within:border-checkpoint-green transition-colors">
        <Search size={16} className="text-zinc-500 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); setIdx(-1); }}
          onKeyDown={onKeyDown}
          placeholder="Buscar jogos..."
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="text-zinc-500 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {open && query.length >= 2 && (
        <div className="dropdown absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-zinc-400">Nenhum resultado para "{query}"</p>
          ) : (
            results.map((g, i) => (
              <button
                key={g.id_jogo}
                onMouseDown={() => go(g.id_jogo)}
                className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${
                  i === idx ? 'bg-zinc-800' : 'hover:bg-zinc-900'
                }`}
              >
                <img src={g.img_jogo} className="h-14 w-10 rounded object-cover flex-shrink-0" alt="" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-sm">{g.nm_jogo}</p>
                  <p className="text-xs text-zinc-400">{g.genero} · ★ {g.media}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
