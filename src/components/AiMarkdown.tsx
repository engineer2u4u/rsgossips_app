import React from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';

// Lightweight renderer for AI-generated text (mirror of the web AiMarkdown).
// Models return light markdown — **bold**, *italic*, `code`, #/## headings,
// -/*/• bullets and 1./1) numbered lists — which would otherwise show as raw
// markup. No dependency: a tiny block+inline parser covers this subset.

const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;

function renderInline(text: string, keyBase: string | number) {
  const parts = String(text).split(INLINE_RE);
  return parts.map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <Text key={key} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (/^\*[^*\n]+\*$/.test(part)) {
      return (
        <Text key={key} style={styles.italic}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <Text key={key} style={styles.code}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={key}>{part}</Text>;
  });
}

type Block =
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'gap' }
  | { type: 'ul' | 'ol'; items: string[] };

export function AiMarkdown({ text, textStyle }: { text?: string | null; textStyle?: TextStyle }) {
  if (!text) return null;
  const lines = String(text).replace(/\r/g, '').split('\n');

  const blocks: Block[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  lines.forEach(raw => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)/);
    const heading = line.match(/^\s*(#{1,4})\s+(.*)/);

    if (bullet) {
      if (!list || list.type !== 'ul') {
        flushList();
        list = { type: 'ul', items: [] };
      }
      list.items.push(bullet[1]);
    } else if (num) {
      if (!list || list.type !== 'ol') {
        flushList();
        list = { type: 'ol', items: [] };
      }
      list.items.push(num[1]);
    } else {
      flushList();
      if (heading) blocks.push({ type: 'h', text: heading[2] });
      else if (!line.trim()) blocks.push({ type: 'gap' });
      else blocks.push({ type: 'p', text: line });
    }
  });
  flushList();

  return (
    <View>
      {blocks.map((b, i) => {
        if (b.type === 'gap') return <View key={i} style={styles.gap} />;
        if (b.type === 'h') {
          return (
            <Text key={i} style={[styles.base, textStyle, styles.heading]}>
              {renderInline(b.text, i)}
            </Text>
          );
        }
        if (b.type === 'p') {
          return (
            <Text key={i} style={[styles.base, textStyle, styles.para]}>
              {renderInline(b.text, i)}
            </Text>
          );
        }
        return (
          <View key={i} style={styles.list}>
            {b.items.map((item, j) => (
              <View key={j} style={styles.listRow}>
                <Text style={[styles.base, textStyle, styles.marker]}>
                  {b.type === 'ul' ? '•' : `${j + 1}.`}
                </Text>
                <Text style={[styles.base, textStyle, styles.listText]}>
                  {renderInline(item, `${i}-${j}`)}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

// Pulls the machine-readable `RATES_JSON: {...}` line the rate_card tool
// appends. Returns { rates, cleanText } — rates is null when absent/invalid,
// cleanText always has the line stripped so it never shows to the user.
export function parseAiRates(text?: string | null): {
  rates: Record<string, number> | null;
  cleanText: string;
} {
  if (!text) return { rates: null, cleanText: text || '' };
  const m = String(text).match(/RATES_JSON:\s*(\{[^}]*\})/);
  const cleanText = String(text)
    .replace(/\n?\s*RATES_JSON:\s*\{[^}]*\}\s*/g, '')
    .trim();
  if (!m) return { rates: null, cleanText };
  try {
    const raw = JSON.parse(m[1]);
    const rates: Record<string, number> = {};
    for (const k of ['reels', 'stories', 'shorts', 'posts', 'ugc']) {
      const v = Math.round(Number(raw[k]));
      if (Number.isFinite(v) && v > 0) rates[k] = v;
    }
    return { rates: Object.keys(rates).length ? rates : null, cleanText };
  } catch {
    return { rates: null, cleanText };
  }
}

const styles = StyleSheet.create({
  base: { fontSize: 13, lineHeight: 19, color: '#334155' },
  bold: { fontWeight: '700', color: '#0f172a' },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: 'monospace', backgroundColor: '#f1f5f9' },
  heading: { fontWeight: '800', color: '#0f172a', marginTop: 4, marginBottom: 2 },
  para: { marginVertical: 1 },
  gap: { height: 8 },
  list: { marginVertical: 2 },
  listRow: { flexDirection: 'row', gap: 6, paddingLeft: 4, marginBottom: 3 },
  marker: { fontWeight: '700' },
  listText: { flex: 1 },
});
