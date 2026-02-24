import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '@/stores/chatStore';

const colorMap = {
  success: {
    bg: 'bg-dna-green/10',
    border: 'border-dna-green/30',
    text: 'text-dna-green',
    iconPath: 'M20 6 9 17l-5-5',
  },
  error: {
    bg: 'bg-dna-red/10',
    border: 'border-dna-red/30',
    text: 'text-dna-red',
    iconPath: 'M18 6 6 18M6 6l12 12',
  },
  info: {
    bg: 'bg-dna-cyan/10',
    border: 'border-dna-cyan/30',
    text: 'text-dna-cyan',
    iconPath: 'M12 16v-4M12 8h.01',
  },
} as const;

export default function Toast() {
  const toasts = useChatStore((s) => s.toasts);
  const removeToast = useChatStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = colorMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              role="alert"
              aria-live="assertive"
              layout
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg max-w-xs ' + style.bg + ' ' + style.border}
            >
              <span className={style.text}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {toast.type !== 'error' && <circle cx="12" cy="12" r="10" />}
                  <path d={style.iconPath} />
                </svg>
              </span>
              <span className="text-sm text-text">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-auto text-text-muted hover:text-text transition-colors shrink-0"
                aria-label="닫기"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
