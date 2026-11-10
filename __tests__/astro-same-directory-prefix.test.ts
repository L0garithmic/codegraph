/**
 * "Same directory" means the same directory, not a string prefix: a component in
 * `src/components-old/` is not a neighbour of a page in `src/components/`.
 */
import { describe, it, expect } from 'vitest';
import { astroResolver } from '../src/resolution/frameworks/astro';

describe('astroResolver same-directory preference', () => {
  it('does not treat a sibling directory that shares a name prefix as the same directory', () => {
    const cardOld = { id: 'card-old', kind: 'component', name: 'Card', filePath: 'src/components-old/Card.astro' };
    const cardElsewhere = { id: 'card-elsewhere', kind: 'component', name: 'Card', filePath: 'src/elsewhere/Card.astro' };
    const ctx = { getNodesByName: () => [cardOld, cardElsewhere] } as any;
    const ref = {
      referenceName: 'Card', referenceKind: 'references', fromNodeId: 'page', language: 'astro',
      filePath: 'src/components/Page.astro', line: 1, column: 0,
    } as any;
    // Two same-named components, neither in the page's directory: ambiguous, so no pick.
    expect(astroResolver.resolve!(ref, ctx)).toBeNull();
  });
});
