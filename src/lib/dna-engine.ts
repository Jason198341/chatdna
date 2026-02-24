import type { ParticipantStats, DNAProfile, DNAAxis } from './types';
import { ARCHETYPES } from '@/data/archetypes';

// ─── Axis calculation helpers ─────────────────────────────

/**
 * Map response time (ms) to a 0-100 speed score using a logarithmic curve.
 *   < 30s  = 100
 *   1 min  = 85
 *   5 min  = 70
 *   15 min = 50
 *   30 min = 30
 *   1 hr+  = 10
 */
function responseTimeToScore(avgMs: number): number {
  if (avgMs <= 0) return 50; // No data, neutral

  const seconds = avgMs / 1000;

  if (seconds <= 30) return 100;
  if (seconds <= 60) return 100 - ((seconds - 30) / 30) * 15;
  if (seconds <= 300) return 85 - ((seconds - 60) / 240) * 15;
  if (seconds <= 900) return 70 - ((seconds - 300) / 600) * 20;
  if (seconds <= 1800) return 50 - ((seconds - 900) / 900) * 20;
  if (seconds <= 3600) return 30 - ((seconds - 1800) / 1800) * 20;

  return 10;
}

/**
 * Calculate expression score from emoji rate, message length variety, and exclamation rate.
 */
function calculateExpression(stats: ParticipantStats): number {
  const emojiScore = Math.min(stats.emojiRate * 100, 40);

  let varietyScore = 0;
  if (stats.avgMessageLength > 0) {
    const ratio = Math.abs(stats.avgMessageLength - stats.medianMessageLength) /
      stats.avgMessageLength;
    varietyScore = Math.min(ratio * 100, 30);
  }

  const exclScore = Math.min(stats.exclamationRate * 100, 30);

  return Math.round(
    Math.min(100, emojiScore + varietyScore + exclScore),
  );
}

/**
 * Night owl score: weight late night (00-05) heavily, plus evening (22-24) partially.
 */
function calculateNightOwl(stats: ParticipantStats): number {
  const total = stats.totalMessages;
  if (total === 0) return 0;

  const hourly = stats.hourlyDistribution;

  let deepNightCount = 0;
  for (let h = 0; h < 5; h++) deepNightCount += hourly[h];

  let lateEveningCount = 0;
  for (let h = 22; h < 24; h++) lateEveningCount += hourly[h];

  const weightedNight = deepNightCount + lateEveningCount * 0.5;
  const ratio = weightedNight / total;

  return Math.round(Math.min(100, ratio * 333));
}

/**
 * Volume score based on daily average message count.
 */
function calculateVolume(stats: ParticipantStats, totalDays: number): number {
  if (totalDays <= 0) return 20;

  const dailyAvg = stats.totalMessages / totalDays;

  if (dailyAvg < 5) return Math.round(20 * (dailyAvg / 5));
  if (dailyAvg < 15) return Math.round(20 + 20 * ((dailyAvg - 5) / 10));
  if (dailyAvg < 30) return Math.round(40 + 20 * ((dailyAvg - 15) / 15));
  if (dailyAvg < 50) return Math.round(60 + 20 * ((dailyAvg - 30) / 20));
  return Math.min(100, Math.round(80 + 20 * ((dailyAvg - 50) / 50)));
}

/**
 * For 2-participant chats, normalize a rate so the higher one pushes toward 100.
 */
function normalizeForTwo(
  value: number,
  otherValue: number,
  baseMultiplier: number,
): number {
  const maxVal = Math.max(value, otherValue);
  if (maxVal <= 0) return 50;

  const normalized = (value / maxVal) * baseMultiplier;
  return Math.round(Math.min(100, normalized));
}

// ─── Archetype matching ─────────────────────────────────

const ARCHETYPE_AXIS_MAP: Record<string, string[]> = {
  'instant-replier': ['speed', 'volume'],
  'night-owl': ['nightOwl', 'expression'],
  'emoji-bomber': ['expression', 'warmth'],
  'essay-writer': ['expression', 'volume'],
  'slow-reader': ['speed-inverse', 'initiative-inverse'],
  'ping-pong': ['volume', 'speed'],
  'reaction-fairy': ['warmth', 'expression'],
  'conversation-leader': ['initiative', 'volume'],
};

function findArchetype(axes: DNAAxis[]): string {
  const axisMap = new Map<string, number>();
  for (const a of axes) axisMap.set(a.id, a.value);

  let bestId = 'ping-pong';
  let bestScore = -Infinity;

  for (const [archetypeId, traits] of Object.entries(ARCHETYPE_AXIS_MAP)) {
    let score = 0;

    for (const trait of traits) {
      if (trait.endsWith('-inverse')) {
        const baseId = trait.replace('-inverse', '');
        const val = axisMap.get(baseId) ?? 50;
        score += (100 - val);
      } else {
        const val = axisMap.get(trait) ?? 50;
        score += val;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = archetypeId;
    }
  }

  return bestId;
}

// ─── Main DNA generation ──────────────────────────────

export function generateDNAProfiles(
  stats: Record<string, ParticipantStats>,
  participants: string[],
): Record<string, DNAProfile> {
  const profiles: Record<string, DNAProfile> = {};
  const isTwoPerson = participants.length === 2;

  let totalDays = 1;
  for (const name of participants) {
    const s = stats[name];
    if (s.longestStreak > totalDays) totalDays = s.longestStreak;
  }
  for (const name of participants) {
    const s = stats[name];
    const activeMonths = s.monthlyDistribution.filter((v) => v > 0).length;
    if (activeMonths > 0) {
      const estimatedDays = activeMonths * 30;
      if (estimatedDays > totalDays) totalDays = estimatedDays;
    }
  }

  for (const name of participants) {
    const s = stats[name];

    // 1. Initiative
    let initiative = Math.round(s.firstContactRate * 100);
    if (isTwoPerson) {
      const otherName = participants.find((p) => p !== name)!;
      const otherRate = stats[otherName].firstContactRate;
      initiative = normalizeForTwo(s.firstContactRate, otherRate, 90);
    }

    // 2. Speed
    let speed = responseTimeToScore(s.avgResponseTimeMs);
    speed = Math.round(speed);

    // 3. Expression
    const expression = calculateExpression(s);

    // 4. Night Owl
    const nightOwl = calculateNightOwl(s);

    // 5. Volume
    let volume = calculateVolume(s, totalDays);
    if (isTwoPerson) {
      const otherName = participants.find((p) => p !== name)!;
      const otherVolume = calculateVolume(stats[otherName], totalDays);
      const maxVol = Math.max(volume, otherVolume);
      if (maxVol > 0) {
        volume = Math.round((volume / maxVol) * Math.min(volume, 100));
        volume = Math.max(volume, 10);
      }
    }

    // 6. Warmth
    const warmth = s.warmthScore;

    const axes: DNAAxis[] = [
      { id: 'initiative', label: '주도성', value: clamp(initiative), icon: '👑', description: '먼저 연락하는 비율' },
      { id: 'speed', label: '반응속도', value: clamp(speed), icon: '⚡', description: '평균 답장 속도' },
      { id: 'expression', label: '표현력', value: clamp(expression), icon: '🎨', description: '이모지와 표현의 다양성' },
      { id: 'nightOwl', label: '야행성', value: clamp(nightOwl), icon: '🌙', description: '새벽 대화 비율' },
      { id: 'volume', label: '대화량', value: clamp(volume), icon: '💬', description: '일평균 메시지 수' },
      { id: 'warmth', label: '감정온도', value: clamp(warmth), icon: '❤️', description: '긍정적 표현의 정도' },
    ];

    const archetypeId = findArchetype(axes);
    const archetype =
      ARCHETYPES.find((a) => a.id === archetypeId) ?? ARCHETYPES[0];

    // Generate highlights from top axes
    const sortedAxes = [...axes].sort((a, b) => b.value - a.value);
    const highlights = sortedAxes.slice(0, 3).map(
      (a) => a.label + ' ' + a.value + '/100'
    );

    // Overall DNA score: weighted average of all axes
    const score = Math.round(
      axes.reduce((sum, a) => sum + a.value, 0) / axes.length
    );

    profiles[name] = {
      participantName: name,
      axes,
      archetype,
      highlights,
      color: archetype.color,
      score,
    };
  }

  return profiles;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}