/**
 * The value a registration is written inside is the SMALLEST enclosing one.
 * When two values start on the same line, the answer must not depend on the
 * order the nodes are listed in.
 */
import { describe, it, expect } from 'vitest';
import { enclosingValue } from '../src/resolution/synth-utils';
import type { Node } from '../src/types';

const valueNode = (id: string, startLine: number, endLine: number): Node =>
  ({
    id,
    kind: 'constant',
    name: id,
    qualifiedName: id,
    filePath: 'src/w.ts',
    language: 'typescript',
    startLine,
    endLine,
  }) as unknown as Node;

describe('enclosingValue: smallest enclosing range wins', () => {
  const inner = valueNode('inner', 5, 5);
  const outer = valueNode('outer', 5, 20);

  it('picks the inner value whichever order the nodes arrive in', () => {
    expect(enclosingValue([outer, inner], 5)?.id).toBe('inner');
    expect(enclosingValue([inner, outer], 5)?.id).toBe('inner');
  });
});
