/**
 * Only an interface-style I[A-Z] name takes the C# service pattern.
 *
 * Any name starting with a capital I (Item, Invoice, Index) entered the service
 * branch and was resolved at confidence 0.85 with no directory check, which beat
 * the model pattern that would have matched a model class in /Domain/ at 0.7.
 */

import { describe, it, expect } from 'vitest';
import { aspnetResolver } from '../src/resolution/frameworks/csharp';
import type { ResolutionContext, UnresolvedRef } from '../src/resolution/types';
import type { Node } from '../src/types';

describe('C# service pattern requires an interface-style name', () => {
  it('resolves a model named Item by its model directory, not the service fallback', () => {
    const model = {
      id: 'class:item',
      kind: 'class',
      name: 'Item',
      filePath: 'src/Domain/Item.cs',
    } as unknown as Node;
    const context = {
      getNodesByName: (name: string) => (name === 'Item' ? [model] : []),
    } as unknown as ResolutionContext;
    const ref: UnresolvedRef = {
      fromNodeId: 'fn:caller',
      referenceName: 'Item',
      referenceKind: 'references',
      line: 1,
      column: 0,
      filePath: 'src/App/Caller.cs',
      language: 'csharp',
    } as UnresolvedRef;
    const resolved = aspnetResolver.resolve!(ref, context);
    expect(resolved?.targetNodeId).toBe('class:item');
    expect(resolved?.confidence).toBe(0.7);
  });
});
