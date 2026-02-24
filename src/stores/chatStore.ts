import { create } from 'zustand';
import type { ChatAnalysis, ChatMessage, ToastMessage } from '@/lib/types';

interface ChatState {
  rawMessages: ChatMessage[];
  analysis: ChatAnalysis | null;
  selectedParticipant: string | null;
  compareMode: boolean;
  compareParticipants: [string, string] | null;
  isAnalyzing: boolean;
  toasts: ToastMessage[];

  setRawMessages: (msgs: ChatMessage[]) => void;
  setAnalysis: (a: ChatAnalysis) => void;
  setSelectedParticipant: (name: string | null) => void;
  toggleCompare: () => void;
  setCompareParticipants: (pair: [string, string] | null) => void;
  setIsAnalyzing: (v: boolean) => void;
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rawMessages: [],
  analysis: null,
  selectedParticipant: null,
  compareMode: false,
  compareParticipants: null,
  isAnalyzing: false,
  toasts: [],

  setRawMessages: (rawMessages) => set({ rawMessages }),
  setAnalysis: (analysis) => set({
    analysis,
    selectedParticipant: analysis.participants[0] ?? null,
  }),
  setSelectedParticipant: (selectedParticipant) => set({ selectedParticipant }),
  toggleCompare: () => set((s) => ({ compareMode: !s.compareMode })),
  setCompareParticipants: (compareParticipants) => set({ compareParticipants }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  addToast: (type, message) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  reset: () => set({
    rawMessages: [],
    analysis: null,
    selectedParticipant: null,
    compareMode: false,
    compareParticipants: null,
    isAnalyzing: false,
  }),
}));
