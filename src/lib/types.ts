export interface ChatMessage {
  timestamp: Date;
  sender: string;
  content: string;
  isEmoji: boolean;
  isPhoto: boolean;
  isVideo: boolean;
  isSystem: boolean;
  length: number;
}

export interface ParticipantStats {
  name: string;
  totalMessages: number;
  avgMessageLength: number;
  medianMessageLength: number;
  emojiRate: number;
  photoCount: number;
  videoCount: number;
  firstContactCount: number;
  firstContactRate: number;
  avgResponseTimeMs: number;
  medianResponseTimeMs: number;
  hourlyDistribution: number[];
  dailyDistribution: number[];
  monthlyDistribution: number[];
  longestStreak: number;
  currentStreak: number;
  topEmojis: Array<{ emoji: string; count: number }>;
  topWords: Array<{ word: string; count: number }>;
  lateNightRate: number;
  warmthScore: number;
  questionRate: number;
  exclamationRate: number;
  kkkkRate: number;
}

export interface DNAAxis {
  id: string;
  label: string;
  value: number;
  icon: string;
  description: string;
}

export interface Archetype {
  id: string;
  name: string;
  emoji: string;
  description: string;
  traits: string[];
  color: string;
  gradient: string;
}

export interface DNAProfile {
  participantName: string;
  axes: DNAAxis[];
  archetype: Archetype;
  highlights: string[];
  color: string;
  score: number;
}

export interface ChatAnalysis {
  participants: string[];
  totalMessages: number;
  totalDays: number;
  dateRange: { start: Date; end: Date };
  participantStats: Record<string, ParticipantStats>;
  dnaProfiles: Record<string, DNAProfile>;
  conversationCount: number;
  avgMessagesPerDay: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
