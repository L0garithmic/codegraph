/**
 * Walking an object literal in source, for the framework resolvers whose route
 * table IS an object literal.
 *
 * Vue's `routes: [{ name, path, component }]`, TanStack Router's
 * `createRoute({ path, getParentRoute, component })` and its
 * `createFileRoute('/x')({ component })` all state a route as a JavaScript
 * object, and reading one field out of a WINDOW around another is wrong in a
 * way that is silent: a Vue `name` is written above the `path` it belongs to,
 * so a window around each path hands an entry its predecessor's name — every
 * route in vue-realworld came out pointing one entry too far down.
 *
 * So each object is matched as a unit and only its own depth-1 fields are
 * read; nested objects, arrays, calls, strings and templates are stepped over
 * rather than searched. This is a scanner, not a parser: it knows brackets,
 * quotes and template interpolation, and nothing else about JavaScript.
 */

/** The index of the bracket, brace or paren closing the one at `open`, or -1. */
export function matchBracket(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const ch = s[i]!;
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = skipString(s, i);
      if (end < 0) return -1;
      i = end;
      continue;
    }
    if (ch === '[' || ch === '{' || ch === '(') depth++;
    else if (ch === ']' || ch === '}' || ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** The index of the quote closing the string or template opened at `at`, or -1. */
export function skipString(s: string, at: number): number {
  const quote = s[at]!;
  for (let i = at + 1; i < s.length; i++) {
    const ch = s[i]!;
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === quote) return i;
    if (quote === '`' && ch === '$' && s[i + 1] === '{') {
      const end = matchBracket(s, i + 1);
      if (end < 0) return -1;
      i = end;
    }
  }
  return -1;
}

/** Each `{…}` written directly in `[from, to)`, as its own extent. */
export function* topLevelObjects(s: string, from: number, to: number): Generator<{ start: number; end: number }> {
  for (let i = from; i < to; i++) {
    const ch = s[i]!;
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = skipString(s, i);
      if (end < 0) return;
      i = end;
      continue;
    }
    if (ch === '{') {
      const end = matchBracket(s, i);
      if (end < 0) return;
      yield { start: i, end };
      i = end;
    }
  }
}

/** An object's own fields — key to its value text and where the key sits. Nested structures are stepped over. */
export function readFields(s: string, start: number, end: number): Map<string, { text: string; at: number }> {
  const out = new Map<string, { text: string; at: number }>();
  let i = start + 1;
  while (i < end) {
    const ch = s[i]!;
    if (ch === '{' || ch === '[' || ch === '(') {
      const close = matchBracket(s, i);
      if (close < 0) return out;
      i = close + 1;
      continue;
    }
    // A key is an identifier or a quoted string followed by a colon (`'path': '/users'`).
    // A quoted string with no colon after it is a value and is stepped over.
    let name: string;
    let keyEnd: number;
    if (ch === '"' || ch === "'" || ch === '`') {
      const close = skipString(s, i);
      if (close < 0) return out;
      const colon = /^\s*:/.exec(s.slice(close + 1, close + 65));
      if (!colon) {
        i = close + 1;
        continue;
      }
      name = s.slice(i + 1, close);
      keyEnd = close + 1 + colon[0].length;
    } else {
      const key = /^([A-Za-z_$][\w$]*)\s*:/.exec(s.slice(i, i + 64));
      if (!key) {
        i++;
        continue;
      }
      name = key[1]!;
      keyEnd = i + key[0].length;
    }
    let j = keyEnd;
    const valueAt = j;
    while (j < end) {
      const c = s[j]!;
      if (c === '"' || c === "'" || c === '`') {
        const close = skipString(s, j);
        if (close < 0) return out;
        j = close + 1;
        continue;
      }
      if (c === '{' || c === '[' || c === '(') {
        const close = matchBracket(s, j);
        if (close < 0) return out;
        j = close + 1;
        continue;
      }
      if (c === ',') break;
      j++;
    }
    if (!out.has(name)) out.set(name, { text: s.slice(valueAt, j), at: i });
    i = j + 1;
  }
  return out;
}
