import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastCtx = createContext();
let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const id = ++_id;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const api = {
    success: (m) => push('success', m),
    error:   (m) => push('error', m),
    info:    (m) => push('info', m),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />)}
      </div>
    </ToastCtx.Provider>
  );
}

const TONES = {
  success: { bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
             text: 'text-emerald-800 dark:text-emerald-200', Icon: CheckCircle2, iconCls: 'text-emerald-500' },
  error:   { bg: 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800',
             text: 'text-red-800 dark:text-red-200', Icon: AlertCircle, iconCls: 'text-red-500' },
  info:    { bg: 'bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800',
             text: 'text-brand-800 dark:text-brand-200', Icon: Info, iconCls: 'text-brand-500' },
};

function ToastItem({ toast, onClose }) {
  const tone = TONES[toast.type] || TONES.info;
  const { Icon } = tone;
  return (
    <div className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm px-4 py-3 rounded-xl border shadow-lg backdrop-blur animate-slide-up ${tone.bg} ${tone.text}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tone.iconCls}`} />
      <p className="flex-1 text-sm font-medium whitespace-pre-wrap">{toast.message}</p>
      <button onClick={onClose} className="opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export const useToast = () => useContext(ToastCtx);
