import { motion } from 'framer-motion';
import type { ChatAnalysis } from '@/lib/types';
import ProfileCard from './ProfileCard';
import DNARadar from '../analysis/DNARadar';

interface CompareViewProps {
  analysis: ChatAnalysis;
}

function formatResponseTime(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return Math.round(seconds) + '초';
  if (seconds < 3600) return Math.round(seconds / 60) + '분';
  return (seconds / 3600).toFixed(1) + '시간';
}

interface ComparisonItemProps {
  label: string;
  leftName: string;
  rightName: string;
  leftValue: number;
  rightValue: number;
  format?: (v: number) => string;
  higherWins?: boolean;
}

function ComparisonItem({ label, leftName, rightName, leftValue, rightValue, format, higherWins = true }: ComparisonItemProps) {
  const fmt = format || ((v: number) => String(Math.round(v)));
  const leftWins = higherWins ? leftValue > rightValue : leftValue < rightValue;
  const rightWins = higherWins ? rightValue > leftValue : rightValue < leftValue;
  const tie = Math.abs(leftValue - rightValue) < 0.01;

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-xs text-text-muted text-center mb-3">{label}</p>
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <p className={'text-lg font-bold ' + (leftWins && !tie ? 'text-dna-green' : 'text-text-muted')}>
            {leftWins && !tie ? '👑 ' : ''}{fmt(leftValue)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">{leftName}</p>
        </div>
        <div className="px-3">
          <span className="text-xs text-text-muted font-medium">{tie ? '=' : 'VS'}</span>
        </div>
        <div className="text-center flex-1">
          <p className={'text-lg font-bold ' + (rightWins && !tie ? 'text-dna-purple' : 'text-text-muted')}>
            {rightWins && !tie ? '👑 ' : ''}{fmt(rightValue)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">{rightName}</p>
        </div>
      </div>
    </div>
  );
}

export default function CompareView({ analysis }: CompareViewProps) {
  const [p1, p2] = analysis.participants;
  if (!p1 || !p2) return null;

  const profile1 = analysis.dnaProfiles[p1];
  const profile2 = analysis.dnaProfiles[p2];
  const stats1 = analysis.participantStats[p1];
  const stats2 = analysis.participantStats[p2];

  if (!profile1 || !profile2 || !stats1 || !stats2) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
        <div className="scale-[0.85] origin-center">
          <ProfileCard profile={profile1} stats={stats1} dateRange={analysis.dateRange} />
        </div>
        <motion.div
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-dna-green to-dna-purple text-bg font-black text-lg shrink-0 shadow-lg shadow-dna-green/20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
        >
          VS
        </motion.div>
        <div className="scale-[0.85] origin-center">
          <ProfileCard profile={profile2} stats={stats2} dateRange={analysis.dateRange} />
        </div>
      </div>

      <motion.div
        className="bg-surface rounded-xl border border-border p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-sm font-semibold text-text text-center mb-4">DNA 비교</h3>
        <DNARadar
          axes={profile1.axes}
          color={profile1.color || '#06d6a0'}
          size={320}
          compareAxes={profile2.axes}
          compareColor={profile2.color || '#8b5cf6'}
        />
        <div className="flex justify-center gap-6 mt-4">
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-3 h-3 rounded-full bg-dna-green" />
            {p1}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-3 h-3 rounded-full bg-dna-purple" />
            {p2}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">상세 비교</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ComparisonItem
            label="누가 먼저 연락?"
            leftName={p1}
            rightName={p2}
            leftValue={stats1.firstContactRate * 100}
            rightValue={stats2.firstContactRate * 100}
            format={(v) => v.toFixed(0) + '%'}
            higherWins={true}
          />
          <ComparisonItem
            label="누가 더 빨리 답장?"
            leftName={p1}
            rightName={p2}
            leftValue={stats1.avgResponseTimeMs}
            rightValue={stats2.avgResponseTimeMs}
            format={formatResponseTime}
            higherWins={false}
          />
          <ComparisonItem
            label="누가 더 수다스러운?"
            leftName={p1}
            rightName={p2}
            leftValue={stats1.totalMessages}
            rightValue={stats2.totalMessages}
            format={(v) => v.toLocaleString() + '개'}
            higherWins={true}
          />
          <ComparisonItem
            label="누가 더 야행성?"
            leftName={p1}
            rightName={p2}
            leftValue={stats1.lateNightRate * 100}
            rightValue={stats2.lateNightRate * 100}
            format={(v) => v.toFixed(0) + '%'}
            higherWins={true}
          />
          <ComparisonItem
            label="누가 더 이모지를 많이?"
            leftName={p1}
            rightName={p2}
            leftValue={stats1.emojiRate * 100}
            rightValue={stats2.emojiRate * 100}
            format={(v) => v.toFixed(1) + '%'}
            higherWins={true}
          />
          <ComparisonItem
            label="누가 더 따뜻한?"
            leftName={p1}
            rightName={p2}
            leftValue={stats1.warmthScore}
            rightValue={stats2.warmthScore}
            format={(v) => v + '/100'}
            higherWins={true}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
