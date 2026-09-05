'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { cx } from '../../lib/utils';

interface ToastItem {
  id: number;
  message: string;
  variant: 'success' | 'error';
}

interface ToastContextValue {
  show: (message: string, variant?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              'acrylic animate-rise-in pointer-events-auto rounded-md px-4 py-2.5 text-sm shadow-depth-16',
              t.variant === 'success' ? 'text-ink-primary' : 'text-danger',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
