import { describe, it, expect } from 'vitest';
import { AstroExtractor } from '../src/extraction/astro-extractor';

describe('astro template scan on a line shared with a script block', () => {
  it('still reports a component tag that follows a same-line script block', () => {
    const source = '---\nconst title = "x";\n---\n<script>const x = 1;</script><Card />\n';
    const result = new AstroExtractor('Page.astro', source).extract();
    const names = result.unresolvedReferences.map((r) => r.referenceName);
    expect(names).toContain('Card');
  });
});
