import type { ChatMessage, ParticipantStats } from './types';

// ─── Constants ────────────────────────────────────────

/** Gap in ms that defines a new "conversation" (4 hours) */
const CONVERSATION_GAP_MS = 4 * 60 * 60 * 1000;

/** Max response time to count (1 hour) */
const MAX_RESPONSE_TIME_MS = 60 * 60 * 1000;

/** Korean stopwords — particles, connectors, short fillers */
const STOPWORDS = new Set([
  '이', '가', '을', '를', '의', '에', '은', '는', '도', '로', '으로', '에서', '와', '과', '랑', '이랑', '한', '그', '저', '것', '수', '좀', '더', '안', '못', '잘', '또', '다', '네', '나', '너', '내', '니', '제', '저', '이거', '그거', '저거', '해', '했', '할', '하면', '하고', '해서', '하는', '합니다', '있어', '없어', '있는', '없는', '있다', '없다', '있어요', '없어요', '아', '어', '야', '여', '요', '죠', '지', '거', '건', '게', '음', '응', '앙', '엉', '뭐', '왜', '어디', '언제', '누구', '사진', '이모티콘', '동영상'
]);

/** Positive warmth words */
const WARMTH_WORDS = [
  '좋아', '사랑', '고마워', '감사', '행복', '최고', '대박', '귀여', '예쁘', '멋지', '좋다', '좋은', '짱', '화이팅', '응원', '보고싶', '그리워', '축하', '잘했'
];

/** Emoji regex for extraction */
const EMOJI_EXTRACT_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]+/gu;

// ─── Utility ────────────────────────────────────────────

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function extractEmojis(text: string): string[] {
  const matches = text.match(EMOJI_EXTRACT_REGEX);
  return matches ?? [];
}

function tokenize(text: string): string[] {
  return text
    .replace(/[.,!?~ㅋㅎㅠㅜ…·•\-_=+|\\/<>()\[\]{}'"]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

// ─── Conversation segmentation ────────────────────────────

interface Conversation {
  startIdx: number;
  firstSender: string;
}

function segmentConversations(messages: ChatMessage[]): Conversation[] {
  if (messages.length === 0) return [];

  const conversations: Conversation[] = [
    { startIdx: 0, firstSender: messages[0].sender },
  ];

  for (let i = 1; i < messages.length; i++) {
    const gap =
      messages[i].timestamp.getTime() - messages[i - 1].timestamp.getTime();
    if (gap >= CONVERSATION_GAP_MS) {
      conversations.push({ startIdx: i, firstSender: messages[i].sender });
    }
  }

  return conversations;
}

// ─── Streak calculation ─────────────────────────────────

function calculateStreaks(
  messages: ChatMessage[],
): { longest: number; current: number } {
  if (messages.length === 0) return { longest: 0, current: 0 };

  const days = new Set<string>();
  for (const m of messages) {
    days.add(dayKey(m.timestamp));
  }

  const sortedDays = [...days].sort((a, b) => {
    const [ay, am, ad] = a.split('-').map(Number);
    const [by, bm, bd] = b.split('-').map(Number);
    const da = new Date(ay, am - 1, ad);
    const db = new Date(by, bm - 1, bd);
    return da.getTime() - db.getTime();
  });

  if (sortedDays.length === 0) return { longest: 0, current: 0 };

  const parsedDays = sortedDays.map((s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  });

  let longest = 1;
  let currentStreak = 1;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  for (let i = 1; i < parsedDays.length; i++) {
    const diff = parsedDays[i].getTime() - parsedDays[i - 1].getTime();
    if (diff <= ONE_DAY) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    if (currentStreak > longest) longest = currentStreak;
  }

  let streakAtEnd = 1;
  for (let i = parsedDays.length - 1; i >= 1; i--) {
    const diff = parsedDays[i].getTime() - parsedDays[i - 1].getTime();
    if (diff <= ONE_DAY) {
      streakAtEnd++;
    } else {
      break;
    }
  }

  return { longest, current: streakAtEnd };
}

// ─── Response time calculation ────────────────────────────

function calculateResponseTimes(
  messages: ChatMessage[],
  participant: string,
): number[] {
  const times: number[] = [];

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];

    if (curr.sender === participant && prev.sender !== participant) {
      const gap = curr.timestamp.getTime() - prev.timestamp.getTime();
      if (gap > 0 && gap < MAX_RESPONSE_TIME_MS) {
        times.push(gap);
      }
    }
  }

  return times;
}

// ─── Warmth scoring ─────────────────────────────────────

function calculateWarmth(messages: ChatMessage[]): number {
  if (messages.length === 0) return 0;

  let score = 0;
  let count = 0;

  for (const m of messages) {
    const text = m.content;
    let msgScore = 0;

    // ㅋ/ㅎ usage (laughter indicators)
    const kCount = (text.match(/ㅋ/g) ?? []).length;
    const hCount = (text.match(/ㅎ/g) ?? []).length;
    if (kCount >= 2) msgScore += Math.min(kCount * 3, 20);
    if (hCount >= 2) msgScore += Math.min(hCount * 3, 15);

    // Heart emojis
    const hearts = (text.match(/[❤️♥]/g) ?? []).length;
    msgScore += hearts * 10;

    // Exclamation marks
    const excl = (text.match(/!/g) ?? []).length;
    msgScore += Math.min(excl * 5, 15);

    // Positive words
    for (const word of WARMTH_WORDS) {
      if (text.includes(word)) {
        msgScore += 8;
      }
    }

    // General emojis
    const emojis = extractEmojis(text).length;
    msgScore += Math.min(emojis * 2, 10);

    score += Math.min(msgScore, 50);
    count++;
  }

  const avgScore = score / count;
  return Math.min(100, Math.round((avgScore / 20) * 100));
}

// ─── Main analyzer ──────────────────────────────────────

export function analyzeChat(messages: ChatMessage[]): {
  participants: string[];
  stats: Record<string, ParticipantStats>;
  conversationCount: number;
} {
  const participantSet = new Set<string>();
  for (const m of messages) {
    participantSet.add(m.sender);
  }
  const participants = [...participantSet].sort();

  const conversations = segmentConversations(messages);
  const conversationCount = conversations.length;

  const firstContactCounts: Record<string, number> = {};
  for (const p of participants) firstContactCounts[p] = 0;
  for (const conv of conversations) {
    if (firstContactCounts[conv.firstSender] !== undefined) {
      firstContactCounts[conv.firstSender]++;
    }
  }

  const byParticipant: Record<string, ChatMessage[]> = {};
  for (const p of participants) byParticipant[p] = [];
  for (const m of messages) {
    byParticipant[m.sender]?.push(m);
  }

  const stats: Record<string, ParticipantStats> = {};

  for (const name of participants) {
    const msgs = byParticipant[name];
    const total = msgs.length;

    if (total === 0) {
      stats[name] = emptyStats(name);
      continue;
    }

    const lengths = msgs.map((m) => m.content.length);
    const avgLen = lengths.reduce((a, b) => a + b, 0) / total;
    const medLen = median(lengths);

    const emojiMsgs = msgs.filter((m) => {
      return m.isEmoji || extractEmojis(m.content).length > 0;
    }).length;
    const emojiRate = emojiMsgs / total;

    const photoCount = msgs.filter((m) => m.isPhoto).length;
    const videoCount = msgs.filter((m) => m.isVideo).length;

    const firstContactCount = firstContactCounts[name] || 0;
    const firstContactRate =
      conversationCount > 0 ? firstContactCount / conversationCount : 0;

    const responseTimes = calculateResponseTimes(messages, name);
    const avgResponseTimeMs =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
    const medianResponseTimeMs = median(responseTimes);

    const hourly = new Array(24).fill(0);
    for (const m of msgs) hourly[m.timestamp.getHours()]++;

    const daily = new Array(7).fill(0);
    for (const m of msgs) {
      const jsDay = m.timestamp.getDay();
      const isoDay = jsDay === 0 ? 6 : jsDay - 1;
      daily[isoDay]++;
    }

    const monthly = new Array(12).fill(0);
    for (const m of msgs) monthly[m.timestamp.getMonth()]++;

    const { longest: longestStreak, current: currentStreak } =
      calculateStreaks(msgs);

    const emojiCountMap = new Map<string, number>();
    for (const m of msgs) {
      const emojis = extractEmojis(m.content);
      for (const e of emojis) {
        emojiCountMap.set(e, (emojiCountMap.get(e) || 0) + 1);
      }
    }
    const topEmojis = [...emojiCountMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([emoji, count]) => ({ emoji, count }));

    const wordCountMap = new Map<string, number>();
    for (const m of msgs) {
      const words = tokenize(m.content);
      for (const w of words) {
        wordCountMap.set(w, (wordCountMap.get(w) || 0) + 1);
      }
    }
    const topWords = [...wordCountMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));

    const lateNight = msgs.filter((m) => {
      const h = m.timestamp.getHours();
      return h >= 0 && h < 5;
    }).length;
    const lateNightRate = lateNight / total;

    const warmthScore = calculateWarmth(msgs);

    const questionMsgs = msgs.filter((m) =>
      m.content.trimEnd().endsWith('?'),
    ).length;
    const questionRate = questionMsgs / total;

    const exclMsgs = msgs.filter((m) =>
      m.content.trimEnd().endsWith('!'),
    ).length;
    const exclamationRate = exclMsgs / total;

    const kkMsgs = msgs.filter((m) =>
      /[ㅋ]{2,}|[ㅎ]{2,}/.test(m.content),
    ).length;
    const kkkkRate = kkMsgs / total;

    stats[name] = {
      name,
      totalMessages: total,
      avgMessageLength: Math.round(avgLen * 10) / 10,
      medianMessageLength: medLen,
      emojiRate: Math.round(emojiRate * 1000) / 1000,
      photoCount,
      videoCount,
      firstContactCount,
      firstContactRate: Math.round(firstContactRate * 1000) / 1000,
      avgResponseTimeMs: Math.round(avgResponseTimeMs),
      medianResponseTimeMs: Math.round(medianResponseTimeMs),
      hourlyDistribution: hourly,
      dailyDistribution: daily,
      monthlyDistribution: monthly,
      longestStreak,
      currentStreak,
      topEmojis,
      topWords,
      lateNightRate: Math.round(lateNightRate * 1000) / 1000,
      warmthScore,
      questionRate: Math.round(questionRate * 1000) / 1000,
      exclamationRate: Math.round(exclamationRate * 1000) / 1000,
      kkkkRate: Math.round(kkkkRate * 1000) / 1000,
    };
  }

  return { participants, stats, conversationCount };
}

// ─── Empty stats factory ──────────────────────────────────

function emptyStats(name: string): ParticipantStats {
  return {
    name,
    totalMessages: 0,
    avgMessageLength: 0,
    medianMessageLength: 0,
    emojiRate: 0,
    photoCount: 0,
    videoCount: 0,
    firstContactCount: 0,
    firstContactRate: 0,
    avgResponseTimeMs: 0,
    medianResponseTimeMs: 0,
    hourlyDistribution: new Array(24).fill(0),
    dailyDistribution: new Array(7).fill(0),
    monthlyDistribution: new Array(12).fill(0),
    longestStreak: 0,
    currentStreak: 0,
    topEmojis: [],
    topWords: [],
    lateNightRate: 0,
    warmthScore: 0,
    questionRate: 0,
    exclamationRate: 0,
    kkkkRate: 0,
  };
}