import { motion } from 'framer-motion';
import { useChatStore } from '@/stores/chatStore';

interface HeaderProps {
  onReset: () => void;
}

export default function Header({ onReset }: HeaderProps) {
  const analysis = useChatStore((s) => s.analysis);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 h-14">
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M8 4C8 4 12 8 16 12C20 16 24 20 24 28" stroke="url(#hg1)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 4C24 4 20 8 16 12C12 16 8 20 8 28" stroke="url(#hg2)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="10" y1="8" x2="22" y2="8" stroke="#06d6a0" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="11" y1="16" x2="21" y2="16" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="10" y1="24" x2="22" y2="24" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <circle cx="10" cy="8" r="2" fill="#06d6a0" />
            <circle cx="22" cy="8" r="2" fill="#8b5cf6" />
            <circle cx="16" cy="16" r="2" fill="#22d3ee" />
            <circle cx="10" cy="24" r="2" fill="#06d6a0" />
            <circle cx="22" cy="24" r="2" fill="#8b5cf6" />
            <defs>
              <linearGradient id="hg1" x1="8" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#06d6a0" /><stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="hg2" x1="24" y1="4" x2="8" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8b5cf6" /><stop offset="1" stopColor="#06d6a0" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-lg font-bold bg-gradient-to-r from-dna-green to-dna-purple bg-clip-text text-transparent select-none">
            ChatDNA
          </span>
        </motion.div>

        {analysis && (
          <motion.button
            onClick={onReset}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-hover"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            다시 분석하기
          </motion.button>
        )}
      </div>
    </header>
  );
}
