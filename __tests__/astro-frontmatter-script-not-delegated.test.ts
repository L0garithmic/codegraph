import { describe, it, expect, beforeAll } from 'vitest';
import { AstroExtractor } from '../src/extraction/astro-extractor';
import { initGrammars, loadGrammarsForLanguages } from '../src/extraction/grammars';

describe('astro frontmatter is not re-scanned for script blocks', () => {
  beforeAll(async () => {
    await initGrammars();
    await loadGrammarsForLanguages(['typescript']);
  });

  it('does not delegate <script> markup inside a frontmatter string as code', () => {
    const source = [
      '---',
      'const html = "<script>function phantom(){}</script>";',
      'function real() {}',
      '---',
      '<div>{html}</div>',
      '',
    ].join('\n');
    const result = new AstroExtractor('Page.astro', source).extract();
    // Positive control: the frontmatter itself is delegated and yields `real`.
    expect(result.nodes.some((n) => n.name === 'real')).toBe(true);
    expect(result.nodes.some((n) => n.name === 'phantom')).toBe(false);
  });
});
