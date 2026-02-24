import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/stores/chatStore';
import type { ChatAnalysis } from '@/lib/types';
import ProfileCard from './ProfileCard';
import CompareView from './CompareView';

interface DNAProfileProps {
  analysis: ChatAnalysis;
  onBack: () => void;
}

export default function DNAProfile({ analysis, onBack }: DNAProfileProps) {
  const selectedParticipant = useChatStore((s) => s.selectedParticipant);
  const setSelectedParticipant = useChatStore((s) => s.setSelectedParticipant);
  const addToast = useChatStore((s) => s.addToast);
  const [showCompare, setShowCompare] = useState(false);

  const current = selectedParticipant ?? analysis.participants[0] ?? '';
  const profile = analysis.dnaProfiles[current];
  const stats = analysis.participantStats[current];

  const handleSaveImage = useCallback(async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const el = document.getElementById('profile-card');
      if (!el) return;
      const canvas = await html2canvas(el, {
        backgroundColor: '#0a0d14',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = 'chatdna-' + current + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      addToast('success', '이미지가 저장되었습니다');
    } catch {
      addToast('error', '이미지 저장에 실패했습니다');
    }
  }, [current, addToast]);

  const handleCopyClipboard = useCallback(async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const el = document.getElementById('profile-card');
      if (!el) return;
      const canvas = await html2canvas(el, {
        backgroundColor: '#0a0d14',
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        addToast('success', '클립보드에 복사되었습니다');
      }, 'image/png');
    } catch {
      addToast('error', '클립보드 복사에 실패했습니다');
    }
  }, [addToast]);

  if (showCompare) {
    return (
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <motion.button
          onClick={() => setShowCompare(false)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          프로필로 돌아가기
        </motion.button>
        <CompareView analysis={analysis} />
      </div>
    );
  }

  if (!profile || !stats) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
      <motion.button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        분석으로 돌아가기
      </motion.button>

      <div className="flex items-center gap-2 mb-8 flex-wrap">
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
            onClick={() => setShowCompare(true)}
            className="ml-auto px-4 py-2 rounded-lg text-xs font-medium transition-all border border-dna-purple/30 text-dna-purple hover:bg-dna-purple/10"
          >
            비교하기
          </button>
        )}
      </div>

      <ProfileCard profile={profile} stats={stats} dateRange={analysis.dateRange} />

      <motion.div
        className="flex justify-center gap-3 mt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={handleSaveImage}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border text-sm text-text hover:border-dna-green/40 hover:bg-surface-hover transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          이미지 저장
        </button>
        <button
          onClick={handleCopyClipboard}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border text-sm text-text hover:border-dna-purple/40 hover:bg-surface-hover transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          클립보드 복사
        </button>
      </motion.div>
    </div>
  );
}
