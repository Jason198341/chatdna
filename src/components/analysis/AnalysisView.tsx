import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/stores/chatStore';
import type { ChatAnalysis } from '@/lib/types';
import StatsGrid from './StatsGrid';
import TimelineChart from './TimelineChart';
import DNARadar from './DNARadar';

interface AnalysisViewProps {
  analysis: ChatAnalysis;
  onViewProfile: () => void;
}

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    }
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);

  return value;
}

function TopStatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return (
    <div className="bg-surface rounded-xl border border-border p-4 text-center">
      <p className="text-2xl md:text-3xl font-bold text-text">
        {animated.toLocaleString()}
        {suffix && <span className="text-lg text-text-muted ml-0.5">{suffix}</span>}
      </p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  );
}

function formatDateKo(d: Date): string {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return y + '.' + m + '.' + day;
}

export default function AnalysisView({ analysis, onViewProfile }: AnalysisViewProps) {
  const selectedParticipant = useChatStore((s) => s.selectedParticipant);
  const setSelectedParticipant = useChatStore((s) => s.setSelectedParticipant);
  const compareMode = useChatStore((s) => s.compareMode);
  const toggleCompare = useChatStore((s) => s.toggleCompare);

  const current = selectedParticipant ?? analysis.participants[0] ?? '';
  const stats = analysis.participantStats[current];
  const profile = analysis.dnaProfiles[current];

  if (!stats) return null;

  const otherParticipant = analysis.participants.find((p) => p !== current) ?? '';

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <motion.p
        className="text-center text-xs text-text-muted mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {formatDateKo(analysis.dateRange.start)} ~ {formatDateKo(analysis.dateRange.end)}
      </motion.p>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <TopStatCard label="총 메시지 수" value={analysis.totalMessages} suffix="개" />
        <TopStatCard label="대화 기간" value={analysis.totalDays} suffix="일" />
        <TopStatCard label="하루 평균" value={Math.round(analysis.avgMessagesPerDay)} suffix="개" />
        <TopStatCard label="대화 횟수" value={analysis.conversationCount} suffix="회" />
      </motion.div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="flex bg-surface rounded-xl border border-border p-1 gap-1">
          {analysis.participants.map((name) => (
            <button
              key={name}
              onClick={() => setSelectedParticipant(name)}
              className={
                'px-4 py-2 rounded-lg text-sm font-medium transition-all ' +
                (current === name
                  ? 'bg-dna-green/15 text-dna-green border border-dna-green/30'
                  : 'text-text-muted hover:text-text hover:bg-surface-hover')
              }
            >
              {name}
            </button>
          ))}
        </div>
        {analysis.participants.length >= 2 && (
          <button
            onClick={toggleCompare}
            className={
              'ml-auto px-3 py-2 rounded-lg text-xs font-medium transition-all border ' +
              (compareMode
                ? 'bg-dna-purple/15 text-dna-purple border-dna-purple/30'
                : 'text-text-muted border-border hover:text-text hover:bg-surface-hover')
            }
          >
            {compareMode ? '비교 모드 ON' : '비교 모드'}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <section>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">주요 지표</h2>
            <StatsGrid stats={stats} />
          </section>

          {profile && (
            <section>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">DNA 프로필</h2>
              <div className="bg-surface rounded-xl border border-border p-4">
                <DNARadar
                  axes={profile.axes}
                  color={profile.color || '#06d6a0'}
                  size={280}
                  compareAxes={compareMode ? analysis.dnaProfiles[otherParticipant]?.axes : undefined}
                  compareColor="#8b5cf6"
                />
                {compareMode && analysis.participants.length >= 2 && (
                  <div className="flex justify-center gap-6 mt-3">
                    <span className="flex items-center gap-1.5 text-xs text-text-muted">
                      <span className="w-3 h-3 rounded-full bg-dna-green" />
                      {current}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-text-muted">
                      <span className="w-3 h-3 rounded-full bg-dna-purple" />
                      {otherParticipant}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">시간 패턴</h2>
            <TimelineChart
              hourlyData={stats.hourlyDistribution}
              dailyData={stats.dailyDistribution}
              participantName={current}
            />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">자주 쓰는 단어</h2>
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="flex flex-wrap gap-2 items-baseline">
                {stats.topWords.slice(0, 30).map((w, i) => {
                  const maxCount = stats.topWords[0]?.count ?? 1;
                  const ratio = w.count / maxCount;
                  const fontSize = 12 + ratio * 16;
                  return (
                    <motion.span
                      key={w.word}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="text-text hover:text-dna-green transition-colors cursor-default"
                      style={{ fontSize: fontSize + 'px', lineHeight: 1.4 }}
                      title={w.count + '회'}
                    >
                      {w.word}
                    </motion.span>
                  );
                })}
              </div>
            </div>
          </section>

          {stats.topEmojis.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">자주 쓰는 이모지</h2>
              <div className="bg-surface rounded-xl border border-border p-5">
                <div className="flex flex-wrap gap-3">
                  {stats.topEmojis.slice(0, 15).map((e, i) => (
                    <motion.div
                      key={e.emoji}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <span className="text-2xl md:text-3xl">{e.emoji}</span>
                      <span className="text-[10px] text-text-muted">{e.count}회</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="mt-10 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={onViewProfile}
          className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-dna-green to-dna-purple text-bg font-semibold text-base hover:shadow-lg hover:shadow-dna-green/20 transition-all"
        >
          DNA 프로필 보기
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
}
