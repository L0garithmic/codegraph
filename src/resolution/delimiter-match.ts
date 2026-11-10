/**
 * Balanced-delimiter scanning for framework extractors. One owner: the Express
 * and Expo Router extractors both match call parens and argument bodies with
 * these, so an escape or template-nesting fix lands in one place.
 */

/** Index of the closing backtick for the template starting at `open`. */
export function skipTemplate(s: string, open: number): number {
  let i = open + 1;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') return i;
    if (ch === '$' && s[i + 1] === '{') {
      let depth = 0;
      for (i = i + 1; i < s.length; i++) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}') {
          depth--;
          if (depth === 0) break;
        } else if (s[i] === '`') i = skipTemplate(s, i);
      }
    }
    i++;
  }
  return s.length;
}

/**
 * Index of the delimiter matching the one at `open`, skipping string and
 * template literals (nested `${…}` included) so a `)` or `}` inside a string
 * doesn't throw off the balance. -1 if unbalanced.
 */
export function matchDelim(s: string, open: number, oc: string, cc: string): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < s.length && s[i] !== q) {
        if (s[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (ch === '`') {
      i = skipTemplate(s, i);
      continue;
    }
    if (ch === oc) depth++;
    else if (ch === cc) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
