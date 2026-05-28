/**
 * ToastContext — v1.6.1
 * - Máximo de 3 toasts simultâneos
 * - Deduplicação: mesma mensagem não aparece duas vezes
 * - Botão de fechar manual
 * - Duração customizável por tipo
 */

import { createContext, ReactNode, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
type Toast     = { id: number; type: ToastType; message: string };

type ToastContextData = {
  toast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

const COLORS: Record<ToastType, string> = {
  success: 'bg-checkpoint-green text-black',
  error:   'bg-red-500 text-white',
  info:    'bg-zinc-700 text-zinc-100',
};

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  error:   5000,
  info:    4000,
};

const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success', duration?: number) => {
    setToasts(prev => {
      // Deduplicação: não adicionar se a mesma mensagem já estiver ativa
      if (prev.some(t => t.message === message)) return prev;
      // Máximo de 3 toasts — remove o mais antigo se necessário
      const trimmed = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
      return [...trimmed, { id: Date.now(), type, message }];
    });

    const dur = duration ?? DEFAULT_DURATION[type];
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.message !== message));
    }, dur);
  }, []);

  function dismiss(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`dropdown flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm font-bold shadow-xl pointer-events-auto ${COLORS[t.type]}`}>
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity" aria-label="Fechar notificação">
              <X size={15}/>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
