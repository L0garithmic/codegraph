/**
 * A route made only of an optional parameter (`[[lang]]`) is also served at
 * `/`; the shortened address must reach the table even when it is the last
 * optional segment left.
 */
import { describe, it, expect } from 'vitest';
import { svelteResolver } from '../src/resolution/frameworks/svelte';
import { svelteKitTable } from '../src/resolution/frameworks/sveltekit-router';
import type { Node } from '../src/types';

describe('sveltekit: an optional-only route is also served at /', () => {
  it('shortens /:lang? to the root address', () => {
    const nodes = svelteResolver
      .extract!('src/routes/[[lang]]/+page.svelte', '')
      .nodes.filter((n) => n.kind === 'route') as Node[];
    expect(nodes.map((n) => n.name)).toEqual(['/:lang?']);

    const context = { getNodesByKind: (kind: string) => (kind === 'route' ? nodes : []) } as any;
    const table = svelteKitTable(context);
    const roots = [...table.byRoot.values()];
    expect(roots.some((t) => t.exact.has('/'))).toBe(true);
  });
});
