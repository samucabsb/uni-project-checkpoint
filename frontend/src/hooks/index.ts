/**
 * Hooks customizados — v1.6
 * Fix crítico: useReveal usava classList.add('active') mas o CSS
 * espera '.reveal.show'. Corrigido para 'show' + ativação imediata
 * de elementos já visíveis no viewport.
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusJogo } from '../types';

// ── useDebounce ────────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ── useReveal ──────────────────────────────────────────────
// Ativa elementos .reveal → .reveal.show para animar entrada
// CORREÇÃO: o CSS usa a classe 'show' (não 'active')
export function useReveal() {
  useEffect(() => {
    function activate(el: Element) {
      el.classList.add('show');
    }

    function observeAll() {
      document.querySelectorAll('.reveal:not(.show)').forEach(el => {
        const rect = el.getBoundingClientRect();
        // Ativa imediatamente se já estiver visível no viewport
        if (rect.top < window.innerHeight + 60 && rect.bottom > 0) {
          activate(el);
        } else {
          io.observe(el);
        }
      });
    }

    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); }
      }),
      { threshold: 0, rootMargin: '60px' },
    );

    observeAll();

    // Re-verifica quando novos elementos aparecerem no DOM (ex: após data fetch)
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}

// ── useLibraryMap ──────────────────────────────────────────
export function useLibraryMap(): Map<number, StatusJogo> {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery<StatusJogo[]>({
    queryKey: ['library'],
    queryFn:  () => api.get('/library').then(r => r.data),
    enabled:  isAuthenticated,
    staleTime: 60_000,
  });
  const map = new Map<number, StatusJogo>();
  data?.forEach(item => map.set(item.id_jogo, item));
  return map;
}

// ── useClickOutside ────────────────────────────────────────
export function useClickOutside<T extends HTMLElement>(cb: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [cb]);
  return ref;
}

// ── useScrollTop ───────────────────────────────────────────
// Rola para o topo instantaneamente ao mudar de rota
export function useScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
}

