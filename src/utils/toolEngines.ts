import { TOOLS_REGISTRY } from '../data/toolsRegistry';
import { ToolCategoryId, ToolDefinition } from '../types/tools';

// ==================== SEARCH & NAVIGATION LOGIC ====================
export function normalizeTurkishSearch(str: string): string {
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

export function searchTools(
  query: string,
  categoryFilter: ToolCategoryId | 'all' = 'all'
): ToolDefinition[] {
  const pool =
    categoryFilter === 'all'
      ? TOOLS_REGISTRY
      : TOOLS_REGISTRY.filter((t) => t.category === categoryFilter);

  const trimmed = query.trim();
  if (!trimmed) return pool;

  const qLower = trimmed.toLocaleLowerCase('tr-TR');
  const qNorm = normalizeTurkishSearch(trimmed);

  return pool.filter((tool) => {
    const haystack = [
      tool.name,
      tool.englishName,
      tool.shortDescription,
      tool.category,
      ...tool.keywords,
    ].join(' ');
    const hayLower = haystack.toLocaleLowerCase('tr-TR');
    const hayNorm = normalizeTurkishSearch(haystack);
    return hayLower.includes(qLower) || hayNorm.includes(qNorm);
  });
}

// ==================== TEXT TOOLS (13 - 22) ====================
export interface WordCountStats {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTimeSeconds: number;
  speakingTimeSeconds: number;
  topWords: { word: string; count: number }[];
}

const TURKISH_STOP_WORDS = new Set([
  've', 'ile', 'için', 'bir', 'bu', 'şu', 'o', 'da', 'de', 'ki', 'mi', 'mı', 'mu', 'mü',
  'ama', 'fakat', 'lakin', 'ancak', 'veya', 'ya', 'yahut', 'gibi', 'kadar', 'sonra',
  'önce', 'daha', 'en', 'çok', 'az', 'her', 'hiç', 'ne', 'nasıl', 'neden', 'niçin',
  'olan', 'olarak', 'ise', 'üzere', 'göre', 'karşı', 'rağmen', 'dolayı', 'tarafından'
]);

export function analyzeTextStats(text: string, wpm = 200): WordCountStats {
  const charactersWithSpaces = text.length;
  const charactersWithoutSpaces = text.replace(/\s+/g, '').length;

  const trimmed = text.trim();
  if (!trimmed) {
    return {
      words: 0,
      charactersWithSpaces,
      charactersWithoutSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      lines: text ? text.split(/\r\n|\r|\n/).length : 0,
      readingTimeSeconds: 0,
      speakingTimeSeconds: 0,
      topWords: [],
    };
  }

  const wordMatches = trimmed.match(/[\p{L}\p{N}]+(?:['’'-][\p{L}\p{N}]+)*/gu) || [];
  const words = wordMatches.length;

  const sentenceSplits = trimmed
    .split(/[.!?…]+(?:\s+|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  const sentences = Math.max(words > 0 ? 1 : 0, sentenceSplits.length);

  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;

  const lines = text.split(/\r\n|\r|\n/).length;

  const safeWpm = Math.max(50, wpm);
  const readingTimeSeconds = Math.ceil((words / safeWpm) * 60);
  const speakingTimeSeconds = Math.ceil((words / 135) * 60);

  const freqMap = new Map<string, number>();
  for (const raw of wordMatches) {
    const w = raw.toLocaleLowerCase('tr-TR');
    if (w.length > 2 && !TURKISH_STOP_WORDS.has(w)) {
      freqMap.set(w, (freqMap.get(w) || 0) + 1);
    }
  }

  const topWords = Array.from(freqMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    words,
    charactersWithSpaces,
    charactersWithoutSpaces,
    sentences,
    paragraphs,
    lines,
    readingTimeSeconds,
    speakingTimeSeconds,
    topWords,
  };
}

export type CaseMode =
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'sentencecase'
  | 'camelcase'
  | 'snakecase'
  | 'kebabcase'
  | 'alternating';

export function convertTextCase(text: string, mode: CaseMode): string {
  if (!text) return '';
  switch (mode) {
    case 'uppercase':
      return text.toLocaleUpperCase('tr-TR');
    case 'lowercase':
      return text.toLocaleLowerCase('tr-TR');
    case 'titlecase':
      return text
        .toLocaleLowerCase('tr-TR')
        .replace(/(^|\s+|[-/(\["'])(\p{L})/gu, (_, prefix: string, letter: string) => {
          return prefix + letter.toLocaleUpperCase('tr-TR');
        });
    case 'sentencecase':
      return text
        .toLocaleLowerCase('tr-TR')
        .replace(/(^\s*\p{L}|[.!?]\s+\p{L}|\n\s*\p{L})/gu, (match) =>
          match.toLocaleUpperCase('tr-TR')
        );
    case 'camelcase': {
      const words =
        generateSlug(text, ' ')
          .split(' ')
          .filter(Boolean);
      return words
        .map((w, idx) =>
          idx === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
    }
    case 'snakecase':
      return generateSlug(text, '_');
    case 'kebabcase':
      return generateSlug(text, '-');
    case 'alternating':
      return Array.from(text)
        .map((ch, idx) =>
          idx % 2 === 0 ? ch.toLocaleLowerCase('tr-TR') : ch.toLocaleUpperCase('tr-TR')
        )
        .join('');
  }
}

export function removeDuplicateLines(
  text: string,
  options: { caseSensitive?: boolean; trimLines?: boolean; removeEmpty?: boolean } = {}
): { result: string; removedCount: number; originalCount: number; uniqueCount: number } {
  const { caseSensitive = true, trimLines = true, removeEmpty = false } = options;
  if (!text) {
    return { result: '', removedCount: 0, originalCount: 0, uniqueCount: 0 };
  }
  const lines = text.split(/\r\n|\r|\n/);
  const seen = new Set<string>();
  const kept: string[] = [];

  for (const rawLine of lines) {
    const processed = trimLines ? rawLine.trim() : rawLine;
    if (removeEmpty && processed === '') {
      continue;
    }
    const key = caseSensitive ? processed : processed.toLocaleLowerCase('tr-TR');
    if (!seen.has(key)) {
      seen.add(key);
      kept.push(processed);
    }
  }

  return {
    result: kept.join('\n'),
    removedCount: lines.length - kept.length,
    originalCount: lines.length,
    uniqueCount: kept.length,
  };
}

export interface CleanTextOptions {
  removeExtraSpaces?: boolean;
  removeEmptyLines?: boolean;
  trimEachLine?: boolean;
  stripHtmlTags?: boolean;
  removeLineBreaks?: boolean;
  removePunctuation?: boolean;
}

export function cleanText(text: string, options: CleanTextOptions): string {
  let out = text;
  if (options.stripHtmlTags) {
    out = out.replace(/<[^>]*>/g, ' ');
  }
  if (options.removePunctuation) {
    out = out.replace(/[^\p{L}\p{N}\s]/gu, '');
  }
  if (options.trimEachLine) {
    out = out
      .split(/\r\n|\r|\n/)
      .map((l) => l.trim())
      .join('\n');
  }
  if (options.removeEmptyLines) {
    out = out
      .split(/\r\n|\r|\n/)
      .filter((l) => l.trim().length > 0)
      .join('\n');
  }
  if (options.removeLineBreaks) {
    out = out.replace(/(\r\n|\r|\n)+/g, ' ');
  }
  if (options.removeExtraSpaces) {
    out = out
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n');
  }
  return out.trim();
}

export type LineSortMode = 'az' | 'za' | 'length-asc' | 'length-desc' | 'numeric-asc' | 'numeric-desc' | 'reverse';

export function sortLines(text: string, mode: LineSortMode, ignoreEmpty = true): string {
  if (!text) return '';
  let lines = text.split(/\r\n|\r|\n/);
  if (ignoreEmpty) {
    lines = lines.filter((l) => l.trim().length > 0);
  }
  const collator = new Intl.Collator('tr-TR', { sensitivity: 'base', numeric: false });
  const copy = [...lines];

  switch (mode) {
    case 'az':
      copy.sort((a, b) => collator.compare(a.trim(), b.trim()));
      break;
    case 'za':
      copy.sort((a, b) => collator.compare(b.trim(), a.trim()));
      break;
    case 'length-asc':
      copy.sort((a, b) => a.length - b.length);
      break;
    case 'length-desc':
      copy.sort((a, b) => b.length - a.length);
      break;
    case 'numeric-asc':
      copy.sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
      break;
    case 'numeric-desc':
      copy.sort((a, b) => (parseFloat(b) || 0) - (parseFloat(a) || 0));
      break;
    case 'reverse':
      copy.reverse();
      break;
  }
  return copy.join('\n');
}

const LOREM_SENTENCES = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Curabitur pretium tincidunt lacus, nulla gravida orci a odio.',
  'Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
  'Integer in mauris eu nibh euismod gravida, duis ac tellus et risus vulputate vehicula.',
  'Donec lobortis risus a elit, etiam tempor, ut ullamcorper, ligula eu tempor congue, eros est euismod turpis.',
  'Maecenas fermentum consequat mi, donec fermentum, pellentesque malesuada nulla a mi.',
];

export function generateLoremIpsum(
  count: number,
  unit: 'paragraphs' | 'sentences' | 'words',
  wrapHtml = false
): string {
  const safeCount = Math.max(1, Math.min(100, count));
  if (unit === 'words') {
    const allWords = LOREM_SENTENCES.join(' ')
      .replace(/[.,]/g, '')
      .toLowerCase()
      .split(/\s+/);
    const out: string[] = [];
    for (let i = 0; i < safeCount; i++) {
      out.push(allWords[i % allWords.length]);
    }
    const text = out.join(' ');
    const capitalized = text.charAt(0).toUpperCase() + text.slice(1) + '.';
    return wrapHtml ? `<p>${capitalized}</p>` : capitalized;
  }

  if (unit === 'sentences') {
    const out: string[] = [];
    for (let i = 0; i < safeCount; i++) {
      out.push(LOREM_SENTENCES[i % LOREM_SENTENCES.length]);
    }
    const joined = out.join(' ');
    return wrapHtml ? `<p>${joined}</p>` : joined;
  }

  // paragraphs
  const paragraphs: string[] = [];
  for (let p = 0; p < safeCount; p++) {
    const sents: string[] = [];
    for (let s = 0; s < 4; s++) {
      sents.push(LOREM_SENTENCES[(p * 3 + s) % LOREM_SENTENCES.length]);
    }
    const paraText = sents.join(' ');
    paragraphs.push(wrapHtml ? `<p>${paraText}</p>` : paraText);
  }
  return paragraphs.join('\n\n');
}

export function reverseText(
  text: string,
  mode: 'chars' | 'words' | 'each-word' | 'lines' = 'chars'
): string {
  if (!text) return '';
  switch (mode) {
    case 'chars':
      return Array.from(text).reverse().join('');
    case 'words':
      return text.trim().split(/\s+/).reverse().join(' ');
    case 'each-word':
      return text
        .split(/(\s+)/)
        .map((part) => (/\s+/.test(part) ? part : Array.from(part).reverse().join('')))
        .join('');
    case 'lines':
      return text.split(/\r\n|\r|\n/).reverse().join('\n');
  }
}

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c',
  ğ: 'g', Ğ: 'g',
  ı: 'i', I: 'i', İ: 'i',
  ö: 'o', Ö: 'o',
  ş: 's', Ş: 's',
  ü: 'u', Ü: 'u',
  â: 'a', Â: 'a',
  î: 'i', Î: 'i',
  û: 'u', Û: 'u',
};

export function generateSlug(
  text: string,
  separator: '-' | '_' | ' ' = '-',
  options: { removeStopWords?: boolean; maxWords?: number } = {}
): string {
  if (!text) return '';
  let mapped = '';
  for (const ch of text) {
    mapped += TURKISH_CHAR_MAP[ch] ?? ch;
  }

  let words = mapped
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (options.removeStopWords) {
    const asciiStops = new Set([
      've', 'ile', 'icin', 'bir', 'bu', 'su', 'da', 'de', 'ki', 'mi', 'mu',
      'ama', 'fakat', 'ancak', 'veya', 'ya', 'gibi', 'kadar', 'daha', 'en',
      'cok', 'her', 'ne', 'nasil', 'neden', 'olan', 'olarak', 'ise', 'gore'
    ]);
    const filtered = words.filter((w) => !asciiStops.has(w));
    if (filtered.length > 0) {
      words = filtered;
    }
  }

  if (options.maxWords && options.maxWords > 0) {
    words = words.slice(0, options.maxWords);
  }

  return words.join(separator);
}

// ==================== DEVELOPER TOOLS (23 - 32) ====================
export interface JsonValidationResult {
  valid: boolean;
  formatted?: string;
  minified?: string;
  error?: string;
  errorLine?: number;
  errorColumn?: number;
  stats?: {
    type: string;
    keysCount: number;
    depth: number;
    sizeBytes: number;
  };
}

function sortJsonKeysDeep(val: unknown): unknown {
  if (Array.isArray(val)) {
    return val.map(sortJsonKeysDeep);
  }
  if (val !== null && typeof val === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(val as Record<string, unknown>).sort()) {
      sorted[k] = sortJsonKeysDeep((val as Record<string, unknown>)[k]);
    }
    return sorted;
  }
  return val;
}

function analyzeJsonObject(val: unknown, currentDepth = 1): { keysCount: number; depth: number } {
  if (Array.isArray(val)) {
    let maxD = currentDepth;
    let totalK = 0;
    for (const item of val) {
      const sub = analyzeJsonObject(item, currentDepth + 1);
      totalK += sub.keysCount;
      if (sub.depth > maxD) maxD = sub.depth;
    }
    return { keysCount: totalK, depth: maxD };
  }
  if (val !== null && typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>);
    let maxD = currentDepth;
    let totalK = entries.length;
    for (const [, v] of entries) {
      const sub = analyzeJsonObject(v, currentDepth + 1);
      totalK += sub.keysCount;
      if (sub.depth > maxD) maxD = sub.depth;
    }
    return { keysCount: totalK, depth: maxD };
  }
  return { keysCount: 0, depth: currentDepth };
}

export function processJson(
  raw: string,
  indent: number | '\t' = 2,
  sortKeys = false
): JsonValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, error: 'Lütfen doğrulamak veya biçimlendirmek için JSON verisi girin.' };
  }
  try {
    const parsed = JSON.parse(trimmed);
    const target = sortKeys ? sortJsonKeysDeep(parsed) : parsed;
    const formatted = JSON.stringify(target, null, indent);
    const minified = JSON.stringify(target);
    const { keysCount, depth } = analyzeJsonObject(parsed);
    const type = Array.isArray(parsed)
      ? `Dizi (Array - ${parsed.length} öğe)`
      : parsed === null
      ? 'Null'
      : typeof parsed === 'object'
      ? 'Nesne (Object)'
      : typeof parsed;

    return {
      valid: true,
      formatted,
      minified,
      stats: {
        type,
        keysCount,
        depth,
        sizeBytes: new TextEncoder().encode(trimmed).length,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    let errorLine: number | undefined;
    let errorColumn: number | undefined;
    const posMatch = msg.match(/position\s+(\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const upToPos = trimmed.slice(0, pos);
      const lines = upToPos.split('\n');
      errorLine = lines.length;
      errorColumn = lines[lines.length - 1].length + 1;
    }
    return {
      valid: false,
      error: `Geçersiz JSON sözdizimi: ${msg}`,
      errorLine,
      errorColumn,
    };
  }
}

export function encodeBase64Utf8(input: string): string {
  if (!input) return '';
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeBase64Utf8(input: string): { result: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { result: '' };
  try {
    // Support URL-safe base64 as well
    let normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
    while (normalized.length % 4 !== 0) {
      normalized += '=';
    }
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { result: decoded };
  } catch {
    return {
      result: '',
      error: 'Geçersiz Base64 verisi. Lütfen girdiğiniz dizinin eksiksiz ve geçerli bir Base64 metni olduğundan emin olun.',
    };
  }
}

export function encodeUrlText(input: string, mode: 'component' | 'uri' = 'component', spaceAsPlus = false): string {
  if (!input) return '';
  const encoded = mode === 'component' ? encodeURIComponent(input) : encodeURI(input);
  return spaceAsPlus ? encoded.replace(/%20/g, '+') : encoded;
}

export function decodeUrlText(input: string, plusAsSpace = true): { result: string; error?: string } {
  if (!input) return { result: '' };
  try {
    const prepped = plusAsSpace ? input.replace(/\+/g, '%20') : input;
    return { result: decodeURIComponent(prepped) };
  } catch {
    return {
      result: '',
      error: 'URL çözümlenirken hata oluştu: Metin içinde tamamlanmamış veya bozuk yüzde (%) kodlaması bulunuyor.',
    };
  }
}

export function encodeHtmlEntities(input: string, encodeAllNonAscii = false): string {
  if (!input) return '';
  const basicMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  let out = input.replace(/[&<>"']/g, (ch) => basicMap[ch]);
  if (encodeAllNonAscii) {
    out = Array.from(out)
      .map((ch) => {
        const code = ch.codePointAt(0) || 0;
        return code > 127 ? `&#${code};` : ch;
      })
      .join('');
  }
  return out;
}

export function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  const named: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&euro;': '€',
    '&trade;': '™',
  };
  return input
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&[a-zA-Z0-9]+;/g, (entity) => named[entity] ?? entity);
}

export interface DiffLine {
  type: 'equal' | 'insert' | 'delete';
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export function computeLineDiff(
  oldText: string,
  newText: string,
  options: { ignoreWhitespace?: boolean; ignoreCase?: boolean } = {}
): DiffLine[] {
  const oldLines = oldText.split(/\r\n|\r|\n/);
  const newLines = newText.split(/\r\n|\r|\n/);

  const normalize = (s: string) => {
    let out = options.ignoreWhitespace ? s.trim().replace(/\s+/g, ' ') : s;
    if (options.ignoreCase) out = out.toLocaleLowerCase('tr-TR');
    return out;
  };

  const m = oldLines.length;
  const n = newLines.length;

  // LCS matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (normalize(oldLines[i]) === normalize(newLines[j])) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (normalize(oldLines[i]) === normalize(newLines[j])) {
      result.push({
        type: 'equal',
        text: newLines[j],
        oldLineNumber: i + 1,
        newLineNumber: j + 1,
      });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({
        type: 'delete',
        text: oldLines[i],
        oldLineNumber: i + 1,
      });
      i++;
    } else {
      result.push({
        type: 'insert',
        text: newLines[j],
        newLineNumber: j + 1,
      });
      j++;
    }
  }
  while (i < m) {
    result.push({ type: 'delete', text: oldLines[i], oldLineNumber: i + 1 });
    i++;
  }
  while (j < n) {
    result.push({ type: 'insert', text: newLines[j], newLineNumber: j + 1 });
    j++;
  }
  return result;
}

// ==================== SEO TOOLS (33 - 40) ====================
export function estimateSerpPixelWidth(text: string, isTitle = true): number {
  if (!text) return 0;
  // Accurate character width table for Google SERP (20px Arial for Title, 14px for Description)
  const scale = isTitle ? 1 : 0.72;
  let total = 0;
  for (const ch of text) {
    if ('ilI1|!.,:;'.includes(ch)) total += 5;
    else if ('ftrj()[]{} '.includes(ch)) total += 6.5;
    else if ('mwMWG@%&QÖÜÇŞĞ'.includes(ch)) total += 13.5;
    else if (ch === ch.toLocaleUpperCase('tr-TR') && ch !== ch.toLocaleLowerCase('tr-TR')) total += 11;
    else total += 9.2;
  }
  return Math.round(total * scale);
}

export interface KeywordDensityItem {
  phrase: string;
  count: number;
  densityPercent: number;
}

export function calculateKeywordDensity(text: string): {
  totalWords: number;
  unigrams: KeywordDensityItem[];
  bigrams: KeywordDensityItem[];
  trigrams: KeywordDensityItem[];
} {
  const words = (text.toLocaleLowerCase('tr-TR').match(/[\p{L}\p{N}]+/gu) || []).filter(
    (w) => w.length > 1
  );
  const totalWords = words.length;
  if (totalWords === 0) {
    return { totalWords: 0, unigrams: [], bigrams: [], trigrams: [] };
  }

  const countNGrams = (n: number): KeywordDensityItem[] => {
    const map = new Map<string, number>();
    for (let i = 0; i <= words.length - n; i++) {
      const slice = words.slice(i, i + n);
      if (n === 1 && TURKISH_STOP_WORDS.has(slice[0])) continue;
      const phrase = slice.join(' ');
      map.set(phrase, (map.get(phrase) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([phrase, count]) => ({
        phrase,
        count,
        densityPercent: Number(((count / totalWords) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  };

  return {
    totalWords,
    unigrams: countNGrams(1),
    bigrams: countNGrams(2),
    trigrams: countNGrams(3),
  };
}

export function generateRobotsTxt(config: {
  userAgent: string;
  allowAll: boolean;
  disallowPaths: string[];
  allowPaths: string[];
  crawlDelay?: number;
  sitemapUrl?: string;
}): string {
  const lines: string[] = [];
  lines.push(`User-agent: ${config.userAgent || '*'}`);
  if (!config.allowAll && config.disallowPaths.length === 0) {
    lines.push('Disallow: /');
  } else {
    for (const p of config.allowPaths.map((x) => x.trim()).filter(Boolean)) {
      lines.push(`Allow: ${p.startsWith('/') ? p : '/' + p}`);
    }
    for (const p of config.disallowPaths.map((x) => x.trim()).filter(Boolean)) {
      lines.push(`Disallow: ${p.startsWith('/') ? p : '/' + p}`);
    }
    if (config.allowAll && config.disallowPaths.filter(Boolean).length === 0) {
      lines.push('Disallow:');
    }
  }
  if (config.crawlDelay && config.crawlDelay > 0) {
    lines.push(`Crawl-delay: ${config.crawlDelay}`);
  }
  if (config.sitemapUrl && config.sitemapUrl.trim()) {
    lines.push('');
    lines.push(`Sitemap: ${config.sitemapUrl.trim()}`);
  }
  return lines.join('\n');
}

export function generateSitemapXml(config: {
  urls: string[];
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
  lastmod?: string;
}): string {
  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const validUrls = config.urls.map((u) => u.trim()).filter(Boolean);
  const items = validUrls.map((u) => {
    const loc = u.startsWith('http') ? u : `https://${u}`;
    return [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      config.lastmod ? `    <lastmod>${escapeXml(config.lastmod)}</lastmod>` : null,
      `    <changefreq>${config.changefreq}</changefreq>`,
      `    <priority>${config.priority}</priority>`,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...items,
    '</urlset>',
  ].join('\n');
}

// ==================== SECURITY TOOLS (41 - 45) ====================
export interface PasswordGenConfig {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

function getSecureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return array[0] % max;
}

export function generateSecurePassword(config: PasswordGenConfig): string {
  let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lower = 'abcdefghijklmnopqrstuvwxyz';
  let nums = '0123456789';
  const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (config.excludeAmbiguous) {
    upper = upper.replace(/[IO]/g, '');
    lower = lower.replace(/[lo]/g, '');
    nums = nums.replace(/[01]/g, '');
  }

  const pools: string[] = [];
  if (config.uppercase) pools.push(upper);
  if (config.lowercase) pools.push(lower);
  if (config.numbers) pools.push(nums);
  if (config.symbols) pools.push(syms);

  if (pools.length === 0) {
    pools.push(lower);
  }

  const safeLen = Math.max(4, Math.min(128, config.length));
  const combined = pools.join('');
  const chars: string[] = [];

  // Guarantee at least one character from each enabled pool
  for (const pool of pools) {
    if (chars.length < safeLen) {
      chars.push(pool[getSecureRandomInt(pool.length)]);
    }
  }
  while (chars.length < safeLen) {
    chars.push(combined[getSecureRandomInt(combined.length)]);
  }

  // Fisher-Yates shuffle using crypto random
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }

  return chars.join('');
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  entropyBits: number;
  crackTimeLabel: string;
  suggestions: string[];
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'Şifre Girilmedi',
      entropyBits: 0,
      crackTimeLabel: 'Anında',
      suggestions: ['Analiz için bir şifre girin.'],
    };
  }

  let poolSize = 0;
  const hasLower = /[a-zçğıöşü]/.test(password);
  const hasUpper = /[A-ZÇĞİÖŞÜ]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/.test(password);

  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigit) poolSize += 10;
  if (hasSymbol) poolSize += 32;

  const uniqueChars = new Set(password).size;
  const effectiveLength = password.length - (password.length - uniqueChars) * 0.35;
  const entropyBits = Math.max(
    1,
    Math.round(effectiveLength * Math.log2(Math.max(2, poolSize)))
  );

  const suggestions: string[] = [];
  if (password.length < 12) suggestions.push('Şifre uzunluğunu en az 12-16 karaktere çıkarın.');
  if (!hasUpper) suggestions.push('Büyük harfler (A-Z) ekleyin.');
  if (!hasLower) suggestions.push('Küçük harfler (a-z) ekleyin.');
  if (!hasDigit) suggestions.push('Rakamlar (0-9) ekleyin.');
  if (!hasSymbol) suggestions.push('Özel semboller (!@#$% vb.) ekleyin.');
  if (/(.)\1{2,}/.test(password)) suggestions.push('Ardışık tekrar eden karakterlerden kaçının.');

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  let label = 'Çok Zayıf';
  let crackTimeLabel = 'Birkaç saniye içinde';

  if (entropyBits >= 85) {
    score = 4;
    label = 'Çok Güçlü (Mükemmel)';
    crackTimeLabel = 'Yüzyıllar sürer';
  } else if (entropyBits >= 65) {
    score = 3;
    label = 'Güçlü';
    crackTimeLabel = 'Onlarca yıl';
  } else if (entropyBits >= 48) {
    score = 2;
    label = 'Orta';
    crackTimeLabel = 'Birkaç gün / hafta';
  } else if (entropyBits >= 32) {
    score = 1;
    label = 'Zayıf';
    crackTimeLabel = 'Birkaç dakika';
  }

  return { score, label, entropyBits, crackTimeLabel, suggestions };
}

export function generateRandomStrings(config: {
  length: number;
  count: number;
  charset: 'alphanumeric' | 'uppercase-num' | 'hex' | 'numeric' | 'alphabetic';
  prefix?: string;
}): string[] {
  const charsets: Record<typeof config.charset, string> = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    'uppercase-num': 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    hex: '0123456789abcdef',
    numeric: '0123456789',
    alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  };
  const pool = charsets[config.charset];
  const safeCount = Math.max(1, Math.min(100, config.count));
  const safeLen = Math.max(1, Math.min(128, config.length));
  const results: string[] = [];

  for (let c = 0; c < safeCount; c++) {
    let s = config.prefix || '';
    for (let i = 0; i < safeLen; i++) {
      s += pool[getSecureRandomInt(pool.length)];
    }
    results.push(s);
  }
  return results;
}

export function generateUuids(
  count = 1,
  options: { uppercase?: boolean; hyphens?: boolean } = {}
): string[] {
  const { uppercase = false, hyphens = true } = options;
  const safeCount = Math.max(1, Math.min(100, count));
  const out: string[] = [];

  for (let i = 0; i < safeCount; i++) {
    let uuid: string;
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      uuid = globalThis.crypto.randomUUID();
    } else {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    if (!hyphens) uuid = uuid.replace(/-/g, '');
    if (uppercase) uuid = uuid.toUpperCase();
    out.push(uuid);
  }
  return out;
}

export async function computeHashes(text: string): Promise<{
  sha1: string;
  sha256: string;
  sha384: string;
  sha512: string;
}> {
  const data = new TextEncoder().encode(text);
  const toHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  const [b1, b256, b384, b512] = await Promise.all([
    globalThis.crypto.subtle.digest('SHA-1', data),
    globalThis.crypto.subtle.digest('SHA-256', data),
    globalThis.crypto.subtle.digest('SHA-384', data),
    globalThis.crypto.subtle.digest('SHA-512', data),
  ]);

  return {
    sha1: toHex(b1),
    sha256: toHex(b256),
    sha384: toHex(b384),
    sha512: toHex(b512),
  };
}

// ==================== DESIGN TOOLS (46 - 49) ====================
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n || 0)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
