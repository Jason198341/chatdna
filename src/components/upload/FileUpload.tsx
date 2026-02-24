import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseKakaoTalk } from '@/lib/parser';
import { analyzeChat } from '@/lib/analyzer';
import { generateDNAProfiles } from '@/lib/dna-engine';
import { useChatStore } from '@/stores/chatStore';
import type { ChatAnalysis } from '@/lib/types';

interface FileUploadProps {
  onAnalyzed: () => void;
}

function DNAHelixBackground() {
  const strandCount = 12;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {Array.from({ length: strandCount }).map((_, i) => {
        const y = (i / strandCount) * 100;
        const delay = i * 0.15;
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: y + '%' }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              x: ['-20px', '20px', '-20px'],
            }}
            transition={{
              duration: 4,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="flex items-center gap-16">
              <motion.div
                className="w-3 h-3 rounded-full bg-dna-green"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 3, delay, repeat: Infinity }}
              />
              <div className="w-24 h-px bg-gradient-to-r from-dna-green/40 to-dna-purple/40" />
              <motion.div
                className="w-3 h-3 rounded-full bg-dna-purple"
                animate={{ scale: [1.2, 0.8, 1.2] }}
                transition={{ duration: 3, delay, repeat: Infinity }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function DNASpinner() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-16">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: i % 2 === 0 ? '#06d6a0' : '#8b5cf6',
              marginLeft: '-5px',
              marginTop: '-5px',
            }}
            animate={{
              x: [
                Math.cos((i / 6) * Math.PI * 2) * 24,
                Math.cos(((i / 6) * Math.PI * 2) + Math.PI) * 24,
                Math.cos((i / 6) * Math.PI * 2) * 24,
              ],
              y: [
                Math.sin((i / 6) * Math.PI * 2) * 24,
                Math.sin(((i / 6) * Math.PI * 2) + Math.PI) * 24,
                Math.sin((i / 6) * Math.PI * 2) * 24,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
          />
        ))}
      </div>
      <motion.p
        className="text-text-muted text-sm"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        분석 중
        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>.</motion.span>
        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}>.</motion.span>
      </motion.p>
    </div>
  );
}

const featureCards = [
  { icon: '🔒', title: '100% 로컬 처리', desc: '파일이 서버로 전송되지 않습니다' },
  { icon: '⚡', title: '즉시 분석', desc: '업로드 즉시 결과를 확인하세요' },
  { icon: '📊', title: '상세 DNA 리포트', desc: '대화 성향을 DNA로 시각화' },
];

export default function FileUpload({ onAnalyzed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const setRawMessages = useChatStore((s) => s.setRawMessages);
  const setAnalysis = useChatStore((s) => s.setAnalysis);
  const isAnalyzing = useChatStore((s) => s.isAnalyzing);
  const setIsAnalyzing = useChatStore((s) => s.setIsAnalyzing);
  const addToast = useChatStore((s) => s.addToast);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.txt')) {
      addToast('error', '텍스트 파일(.txt)만 업로드할 수 있습니다');
      return;
    }

    setFileName(file.name);
    setIsAnalyzing(true);

    try {
      let text: string;
      try {
        text = await file.text();
        if (text.includes('\uFFFD')) throw new Error('encoding');
      } catch {
        const buf = await file.arrayBuffer();
        const decoder = new TextDecoder('euc-kr');
        text = decoder.decode(buf);
      }

      const messages = parseKakaoTalk(text);
      if (messages.length < 50) {
        addToast('error', '메시지가 너무 적습니다 (최소 50개)');
        setIsAnalyzing(false);
        return;
      }

      setRawMessages(messages);
      const result = analyzeChat(messages);
      const profiles = generateDNAProfiles(result.stats, result.participants);

      const dates = messages.map((m) => m.timestamp.getTime());
      const start = new Date(Math.min(...dates));
      const end = new Date(Math.max(...dates));
      const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));

      const fullAnalysis: ChatAnalysis = {
        participants: result.participants,
        totalMessages: messages.length,
        totalDays,
        dateRange: { start, end },
        participantStats: result.stats,
        dnaProfiles: profiles,
        conversationCount: result.conversationCount,
        avgMessagesPerDay: Math.round(messages.length / totalDays),
      };
      setAnalysis(fullAnalysis);
      addToast('success', '분석이 완료되었습니다!');
      onAnalyzed();
    } catch (err) {
      console.error(err);
      addToast('error', '파일을 분석하는 중 오류가 발생했습니다');
    } finally {
      setIsAnalyzing(false);
    }
  }, [setRawMessages, setAnalysis, setIsAnalyzing, addToast, onAnalyzed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      <DNAHelixBackground />

      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6"
          >
            <DNASpinner />
            {fileName && <p className="text-xs text-text-muted">{fileName}</p>}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 w-full max-w-xl flex flex-col items-center"
          >
            <motion.h1
              className="text-3xl md:text-4xl font-bold text-center mb-3 bg-gradient-to-r from-dna-green via-dna-cyan to-dna-purple bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              대화 속 숨겨진 DNA를 발견하세요
            </motion.h1>
            <motion.p
              className="text-text-muted text-center text-sm md:text-base mb-8 max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              카카오톡 대화를 업로드하면 AI가 당신의 대화 성향을 분석합니다
            </motion.p>

            <motion.div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={
                'w-full rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 ' +
                (isDragging
                  ? 'border-dna-green bg-dna-green/5 shadow-lg shadow-dna-green/10'
                  : 'border-border hover:border-dna-green/50 hover:bg-surface/50')
              }
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-surface flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-dna-green">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <p className="text-text font-medium mb-1">카카오톡 대화 파일을 여기에 끌어다 놓으세요</p>
              <p className="text-text-muted text-sm">또는 클릭하여 파일 선택</p>
              <p className="text-text-muted/60 text-xs mt-2">.txt 파일만 지원</p>
            </motion.div>

            <motion.div
              className="w-full mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={() => setHelpOpen(!helpOpen)}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mx-auto"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                어떻게 대화를 내보내나요?
                <motion.svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  animate={{ rotate: helpOpen ? 180 : 0 }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {helpOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 bg-surface rounded-xl border border-border p-5 space-y-4">
                      {[
                        { step: 1, text: '카카오톡 대화방 → 우측 상단 ≡ → 대화 내보내기' },
                        { step: 2, text: '텍스트 파일(.txt)로 저장' },
                        { step: 3, text: '이 페이지에 업로드' },
                      ].map((item) => (
                        <div key={item.step} className="flex items-start gap-3">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-dna-green/15 text-dna-green text-xs font-bold flex items-center justify-center">
                            {item.step}
                          </span>
                          <p className="text-sm text-text-muted">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="grid grid-cols-3 gap-3 mt-10 w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {featureCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  className="bg-surface/60 rounded-xl border border-border p-4 text-center"
                  whileHover={{ y: -2, borderColor: 'rgba(6,214,160,0.3)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <span className="text-2xl">{card.icon}</span>
                  <p className="text-xs font-semibold text-text mt-2">{card.title}</p>
                  <p className="text-[11px] text-text-muted mt-1">{card.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
