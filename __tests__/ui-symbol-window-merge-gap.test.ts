/**
 * Two source windows separated by two omitted lines merge into one window
 * (the documented gap is up to two lines).
 */
import { describe, it, expect } from 'vitest';
import { buildCodeBlock } from '../ui/src/lib/symbol-model';

describe('buildCodeBlock: windows merge across a two-line gap', () => {
  it('merges the head ending at 80 with a window starting at 83', () => {
    const body = Array.from({ length: 300 }, (_, i) => `line ${i + 1}`);
    // Head is 1..80; the call at 87 opens a window 83..91 — lines 81 and 82 are omitted.
    const block = buildCodeBlock(1, body, [87]);
    expect(block.whole).toBe(false);
    expect(block.windows).toHaveLength(1);
    expect(block.windows[0]?.start).toBe(1);
    expect(block.windows[0]?.lines).toHaveLength(91);
  });
});
