import type { ChatMessage } from './types';

// ─── Regex patterns for KakaoTalk export formats ──────────

// Format A (PC): [홍길동] [오후 3:25] 안녕하세요
const FORMAT_A_MSG =
  /^\[(.+?)\]\s*\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s*(.*)$/;

// Format B (Mobile): 2026년 2월 20일 오후 3:25, 홍길동 : 안녕하세요
const FORMAT_B_MSG =
  /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2}),\s*(.+?)\s*:\s*(.*)$/;

// Format C (Another mobile): 2026. 2. 20. 오후 3:25, 홍길동 : 안녕하세요
const FORMAT_C_MSG =
  /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}),\s*(.+?)\s*:\s*(.*)$/;

// Date header: --------------- 2026년 2월 20일 목요일 ---------------
const DATE_HEADER_A =
  /^-+\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*.+?\s*-+$/;

// System messages
const SYSTEM_KEYWORDS = [
  '님이 들어왔습니다',
  '님이 나갔습니다',
  '님을 초대했습니다',
  '채팅방을 나갔습니다',
  '님이 삭제되었습니다',
  '톡을 닫았습니다',
  '대화내용을 저장했습니다',
];

// Emoji regex: covers most Unicode emoji ranges
const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u;

// ─── Helpers ──────────────────────────────────────────────

function convertTo24h(period: string, hour: number): number {
  if (period === '오전') {
    return hour === 12 ? 0 : hour;
  }
  // 오후
  return hour === 12 ? 12 : hour + 12;
}

function checkIsSystem(content: string): boolean {
  return SYSTEM_KEYWORDS.some((kw) => content.includes(kw));
}

function isOnlyEmoji(text: string): boolean {
  // Remove whitespace, ZWJ, variation selectors
  const stripped = text
    .replace(/[\s\u200D\uFE0E\uFE0F]/g, '')
    .replace(EMOJI_REGEX, '');
  return stripped.length === 0 && text.trim().length > 0;
}

function isEmojiOrSticker(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed === '이모티콘') return true;
  if (isOnlyEmoji(trimmed)) return true;
  return false;
}

function isPhoto(content: string): boolean {
  const t = content.trim();
  return t === '사진' || t.startsWith('사진 ') || t === '사진을 보냈습니다.';
}

function isVideo(content: string): boolean {
  const t = content.trim();
  return t === '동영상' || t.startsWith('동영상 ') || t === '동영상을 보냈습니다.';
}

// ─── Parse entry point ────────────────────────────────────

export function parseKakaoTalk(text: string): ChatMessage[] {
  const lines = text.split(/\r?\n/);
  const messages: ChatMessage[] = [];

  // State for Format A (needs date from header lines)
  let currentDateA: { year: number; month: number; day: number } | null = null;

  // Track last message for multi-line append
  let lastMessage: ChatMessage | null = null;

  for (const line of lines) {
    // Skip blank lines
    if (line.trim() === '') continue;

    // ── Try date header (Format A) ──
    const dateMatch = line.match(DATE_HEADER_A);
    if (dateMatch) {
      currentDateA = {
        year: parseInt(dateMatch[1], 10),
        month: parseInt(dateMatch[2], 10),
        day: parseInt(dateMatch[3], 10),
      };
      continue;
    }

    // ── Try Format A ──
    const matchA = line.match(FORMAT_A_MSG);
    if (matchA && currentDateA) {
      const sender = matchA[1];
      const period = matchA[2];
      const hour = convertTo24h(period, parseInt(matchA[3], 10));
      const minute = parseInt(matchA[4], 10);
      const content = matchA[5];

      const timestamp = new Date(
        currentDateA.year,
        currentDateA.month - 1,
        currentDateA.day,
        hour,
        minute,
      );

      const sysMsg = checkIsSystem(content);
      const msg: ChatMessage = {
        sender: sysMsg ? '__system__' : sender,
        timestamp,
        content,
        isSystem: sysMsg,
        isEmoji: isEmojiOrSticker(content),
        isPhoto: isPhoto(content),
        isVideo: isVideo(content),
        length: content.length,
      };

      messages.push(msg);
      lastMessage = msg;
      continue;
    }

    // ── Try Format B ──
    const matchB = line.match(FORMAT_B_MSG);
    if (matchB) {
      const year = parseInt(matchB[1], 10);
      const month = parseInt(matchB[2], 10);
      const day = parseInt(matchB[3], 10);
      const period = matchB[4];
      const hour = convertTo24h(period, parseInt(matchB[5], 10));
      const minute = parseInt(matchB[6], 10);
      const sender = matchB[7];
      const content = matchB[8];

      const timestamp = new Date(year, month - 1, day, hour, minute);
      const sysMsg = checkIsSystem(content);

      const msg: ChatMessage = {
        sender: sysMsg ? '__system__' : sender,
        timestamp,
        content,
        isSystem: sysMsg,
        isEmoji: isEmojiOrSticker(content),
        isPhoto: isPhoto(content),
        isVideo: isVideo(content),
        length: content.length,
      };

      messages.push(msg);
      lastMessage = msg;
      continue;
    }

    // ── Try Format C ──
    const matchC = line.match(FORMAT_C_MSG);
    if (matchC) {
      const year = parseInt(matchC[1], 10);
      const month = parseInt(matchC[2], 10);
      const day = parseInt(matchC[3], 10);
      const period = matchC[4];
      const hour = convertTo24h(period, parseInt(matchC[5], 10));
      const minute = parseInt(matchC[6], 10);
      const sender = matchC[7];
      const content = matchC[8];

      const timestamp = new Date(year, month - 1, day, hour, minute);
      const sysMsg = checkIsSystem(content);

      const msg: ChatMessage = {
        sender: sysMsg ? '__system__' : sender,
        timestamp,
        content,
        isSystem: sysMsg,
        isEmoji: isEmojiOrSticker(content),
        isPhoto: isPhoto(content),
        isVideo: isVideo(content),
        length: content.length,
      };

      messages.push(msg);
      lastMessage = msg;
      continue;
    }

    // ── Skip file header lines ──
    if (
      line.includes('카카오톡 대화') ||
      line.startsWith('저장한 날짜') ||
      line.trim().startsWith('---')
    ) {
      continue;
    }

    // ── Multi-line continuation ──
    // Lines that don't match any pattern belong to the previous message
    if (lastMessage && !lastMessage.isSystem) {
      lastMessage.content += '\n' + line;
      // Re-evaluate emoji status (multi-line is rarely all emoji)
      lastMessage.isEmoji = isEmojiOrSticker(lastMessage.content);
    }
  }

  // Filter out system messages from the returned array
  const userMessages = messages.filter((m) => !m.isSystem);

  // Sort by timestamp (stable)
  userMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return userMessages;
}
