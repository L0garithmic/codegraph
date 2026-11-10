/**
 * A qualified path citation (`lib/a/utils.js`) credits exactly that path. Its
 * basename is the same citation, not a second one that would also match
 * `lib/b/utils.js` through suffix matching.
 */
import { describe, it, expect } from 'vitest';
import { answerCitations } from '../scripts/agent-eval/parse-run.mjs';

describe('answerCitations', () => {
  it('does not add the bare basename of a qualified path citation', () => {
    const exts = new Set(['js']);
    expect([...answerCitations('The fix is in `lib/a/utils.js:10`.', exts).paths]).toEqual(['lib/a/utils.js']);
    // A bare basename on its own is still a citation.
    expect([...answerCitations('The helper is utils.js.', exts).paths]).toEqual(['utils.js']);
  });
});
