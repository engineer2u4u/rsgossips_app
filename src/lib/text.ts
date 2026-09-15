// Emoji-safe text shortening. Mirrors web src/lib/text.js and the edge
// helper supabase/functions/_shared/text.ts (rationale lives there).
//
// `s.slice(0, n)` counts UTF-16 units and can cut an emoji in half. On
// screen that renders as "�"; sent to the server it makes PostgREST reject
// the whole write as "Empty or invalid json". Use truncateText instead.
//
// No lookbehind in the regex: older Hermes builds do not support it, so lone
// surrogates are found with a manual scan.

/** Replace lone surrogates with U+FFFD. A valid string comes back unchanged. */
export function toWellFormedString(input: unknown): string {
  const s = String(input);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = s.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += s[i] + s[i + 1];
        i++;
      } else {
        out += '�';
      }
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      out += '�';
    } else {
      out += s[i];
    }
  }
  return out;
}

/** First `max` characters, counted in code points. null/undefined → "". */
export function truncateText(value: unknown, max: number): string {
  if (value == null) return '';
  const s = toWellFormedString(value);
  if (s.length <= max) return s;
  return Array.from(s).slice(0, max).join('');
}
