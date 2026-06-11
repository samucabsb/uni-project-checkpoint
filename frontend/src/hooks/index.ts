/**
 * Hooks utilitários — Checkpoint v1.9
 *
 * useReveal        — anima .reveal via IntersectionObserver + MutationObserver
 * useDebounce      — debounce de valor reativo
 * useClickOutside  — detecta clique fora de um elemento
 *
 * Removido v1.9: useLibraryMap (biblioteca descontinuada)
 */

import { useState, useEffect, RefObject } from 'react';

// ── useReveal ─────────────────────────────────────────────
// Usa MutationObserver para observar elementos .reveal inseridos
// dinamicamente no DOM após carregamento de dados assíncronos.
export function useReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll<HTMLElement>('.reveal').forEach(el => el.classList.add('show'));
      return;
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' },
    );

    function observeUntracked() {
      document.querySelectorAll<HTMLElement>('.reveal:not(.show)').forEach(el => io.observe(el));
    }

    observeUntracked();

    const mo = new MutationObserver(observeUntracked);
    mo.observe(document.documentElement, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}

// ── useDebounce ───────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ── useClickOutside ───────────────────────────────────────
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  callback: () => void,
) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}
