/**
 * Hooks reutilizáveis do Checkpoint v1.4
 */

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── useDebounce ────────────────────────────────────────────
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── useReveal ──────────────────────────────────────────────
// Anima elementos com classe .reveal quando entram na viewport
export function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); }),
      { threshold: 0.12 },
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── useLibraryMap ──────────────────────────────────────────
// Map de id_jogo → StatusJogo para verificações rápidas nos GameCards
export function useLibraryMap() {
  const { isAuthenticated } = useAuth();

  const { data = [] } = useQuery({
    queryKey:  ['library', 'map'],
    queryFn:   () => api.get('/library').then(r => r.data),
    enabled:   isAuthenticated,
    staleTime: 30_000,
  });

  return new Map(
    (data as Array<{ jogo: { id_jogo: number }; [key: string]: unknown }>)
      .map(item => [item.jogo.id_jogo, item]),
  );
}

// ── today ──────────────────────────────────────────────────
// Retorna a data de hoje no formato YYYY-MM-DD
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
