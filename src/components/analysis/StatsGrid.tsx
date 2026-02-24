import { motion } from 'framer-motion';
import type { ParticipantStats } from '@/lib/types';

interface StatsGridProps {
  stats: ParticipantStats;
}

function formatResponseTime(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return Math.round(seconds) + '초';
  if (seconds < 3600) return Math.round(seconds / 60) + '분';
  return (seconds / 3600).toFixed(1) + '시간';
}

const metrics: Array<{
  key: string;
  label: string;
  iconPath: string;
  color: string;
  format: (s: ParticipantStats) => string;
}> = [
  {
    key: 'totalMessages',
    label: '총 메시지',
    iconPath: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    color: 'text-dna-green',
    format: (s) => s.totalMessages.toLocaleString() + '개',
  },
  {
    key: 'avgMessageLength',
    label: '평균 길이',
    iconPath: 'M17 10H3M21 6H3M21 14H3M17 18H3',
    color: 'text-dna-purple',
    format: (s) => s.avgMessageLength.toFixed(1) + '자',
  },
  {
    key: 'emojiRate',
    label: '이모지 비율',
    iconPath: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5 5s1.5 2 4 2 4-2 4-2',
    color: 'text-dna-amber',
    format: (s) => (s.emojiRate * 100).toFixed(1) + '%',
  },
  {
    key: 'firstContactRate',
    label: '먼저 연락',
    iconPath: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
    color: 'text-dna-cyan',
    format: (s) => (s.firstContactRate * 100).toFixed(0) + '%',
  },
  {
    key: 'avgResponseTime',
    label: '평균 답장',
    iconPath: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4v6l4 2',
    color: 'text-dna-pink',
    format: (s) => formatResponseTime(s.avgResponseTimeMs),
  },
  {
    key: 'longestStreak',
    label: '연속 대화',
    iconPath: 'M22 12 18 12 15 21 9 3 6 12 2 12',
    color: 'text-dna-green',
    format: (s) => s.longestStreak + '일',
  },
  {
    key: 'lateNightRate',
    label: '야행성 지수',
    iconPath: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
    color: 'text-dna-purple',
    format: (s) => (s.lateNightRate * 100).toFixed(0) + '%',
  },
  {
    key: 'warmthScore',
    label: '감정 온도',
    iconPath: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    color: 'text-dna-pink',
    format: (s) => s.warmthScore + '/100',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {metrics.map((m) => (
        <motion.div
          key={m.key}
          variants={itemVariants}
          className="bg-surface rounded-xl p-4 border border-border hover:border-dna-green/30 transition-colors group"
        >
          <div className="flex items-start gap-3">
            <span className={'opacity-70 group-hover:opacity-100 transition-opacity mt-0.5 ' + m.color}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={m.iconPath} />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold text-text truncate">{m.format(stats)}</p>
              <p className="text-xs text-text-muted mt-0.5">{m.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
