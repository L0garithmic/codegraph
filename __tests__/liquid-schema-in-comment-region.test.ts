import { describe, it, expect } from 'vitest';
import { extractFromSource } from '../src/extraction/tree-sitter';

describe('Liquid schema extraction skips non-executing regions', () => {
  it('creates no schema node for a schema block inside {% comment %}', () => {
    const source = [
      '{% comment %}',
      '{% schema %}',
      '{"name": "Hidden"}',
      '{% endschema %}',
      '{% endcomment %}',
      '{% schema %}',
      '{"name": "Shown"}',
      '{% endschema %}',
    ].join('\n');
    const names = extractFromSource('sections/hero.liquid', source)
      .nodes.filter((n) => n.kind === 'constant')
      .map((n) => n.name);
    expect(names).toContain('Shown');
    expect(names).not.toContain('Hidden');
  });
});
