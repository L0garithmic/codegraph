/**
 * A plain highlight fallback names its real cause. A slice with no tokens is not
 * a missing grammar, so its reason must not say the grammar is unavailable.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { highlightLines, clearHighlightCache } from '../src/ui-server/highlight';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

describe('highlight: fallback reasons', () => {
  beforeAll(async () => {
    clearHighlightCache();
    await initGrammars();
    await loadAllGrammars();
  });

  it('names the zero-token case instead of blaming the grammar', async () => {
    const result = await highlightLines(['   '], { language: 'typescript' });
    expect(result.engine).toBe('plain');
    expect(result.reason).toBe('No highlightable tokens in this text.');
    expect(result.reason).not.toMatch(/not available/);
  });
});
