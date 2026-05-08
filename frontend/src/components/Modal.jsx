import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui.jsx';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
         onClick={onClose}>
      <div className={`w-full ${sizes[size]} bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 animate-slide-up`}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="btn-ghost !p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Are you sure?',
                               message, confirmText = 'Confirm', variant = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
           footer={<>
             <Button variant="secondary" onClick={onClose}>Cancel</Button>
             <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>
               {confirmText}
             </Button>
           </>}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    </Modal>
  );
}
