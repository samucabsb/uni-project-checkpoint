import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Singleton guard: evita criar múltiplos observers se o hook for chamado por vários componentes
let observerRegistered = false;

export function useReveal() {
  useEffect(() => {
    if (observerRegistered) return;
    observerRegistered = true;

    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); }),
      { threshold: 0.12 },
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
      observerRegistered = false;
    };
  }, []);
}

export function useLibraryMap() {
  const { isAuthenticated } = useAuth();
  const { data = [] } = useQuery({
    queryKey:  ['library', 'map'],
    queryFn:   () => api.get('/library').then(r => r.data),
    enabled:   isAuthenticated,
    staleTime: 30_000,
  });
  return new Map(
    (data as Array<{ jogo: { id_jogo: number }; [k: string]: unknown }>)
      .map(item => [item.jogo.id_jogo, item]),
  );
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
