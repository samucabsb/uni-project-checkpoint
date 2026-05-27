import { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';
type Toast     = { id: number; type: ToastType; message: string };

type ToastContextData = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextData>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string, type: ToastType = 'success') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }

  const colors: Record<ToastType, string> = {
    success: 'bg-checkpoint-green text-black',
    error:   'bg-red-500 text-white',
    info:    'bg-zinc-800 text-white border border-zinc-700',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed right-5 top-5 z-[99] space-y-3">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`dropdown rounded-2xl px-5 py-4 text-sm font-bold shadow-xl ${colors[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
