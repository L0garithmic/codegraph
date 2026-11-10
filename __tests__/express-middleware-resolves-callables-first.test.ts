/**
 * A middleware name resolves to a function, preferring the middleware directory.
 *
 * The first pass took any node of any kind with the same name, so a variable
 * `const auth = firebase.auth()` in an unrelated file won the middleware edge
 * before the middleware function in /middleware/ was considered.
 */

import { describe, it, expect } from 'vitest';
import { expressResolver } from '../src/resolution/frameworks/express';
import type { ResolutionContext, UnresolvedRef } from '../src/resolution/types';
import type { Node } from '../src/types';

describe('Express middleware resolution prefers a callable in the middleware directory', () => {
  it('does not bind auth to a variable named auth elsewhere', () => {
    const variable = { id: 'var:auth', kind: 'variable', name: 'auth', filePath: 'src/firebase.ts' } as unknown as Node;
    const middleware = { id: 'fn:auth', kind: 'function', name: 'auth', filePath: 'src/middleware/auth.ts' } as unknown as Node;
    const context = {
      getNodesByName: (name: string) => (name === 'auth' ? [variable, middleware] : []),
    } as unknown as ResolutionContext;
    const ref: UnresolvedRef = {
      fromNodeId: 'route:1',
      referenceName: 'auth',
      referenceKind: 'references',
      line: 1,
      column: 0,
      filePath: 'src/routes.ts',
      language: 'typescript',
    } as UnresolvedRef;
    const resolved = expressResolver.resolve!(ref, context);
    expect(resolved?.targetNodeId).toBe('fn:auth');
  });
});
