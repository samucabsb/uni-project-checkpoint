/**
 * ToastContext — v1.6
 * Melhorias: duração customizável, botão de fechar manual
 */

import { createContext, ReactNode, useContext, useState } from 'react';
import { X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
type Toast     = { id: number; type: ToastType; message: string };

type ToastContextData = {
  toast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

const colors: Record<ToastType, string> = {
  success: 'bg-checkpoint-green text-black',
  error:   'bg-red-500 text-white',
  info:    'bg-zinc-700 text-zinc-100',
};

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3500,
  error:   5000,
  info:    4000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string, type: ToastType = 'success', duration?: number) {
    const id  = Date.now();
    const dur = duration ?? DEFAULT_DURATION[type];
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), dur);
  }

  function dismiss(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`dropdown flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm font-bold shadow-xl pointer-events-auto ${colors[t.type]}`}
          >
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
