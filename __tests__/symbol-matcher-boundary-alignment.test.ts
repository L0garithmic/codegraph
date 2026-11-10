/**
 * A qualified query matches only on a scope boundary: `Bar::run` names the
 * `run` inside a `Bar` scope, never the `run` inside `FooBar`.
 */
import { describe, it, expect } from 'vitest';
import { matchesSymbol } from '../src/graph/symbol-lookup';
import type { Node } from '../src/types';

const runIn = (qualifiedName: string): Node =>
  ({
    id: qualifiedName,
    kind: 'method',
    name: 'run',
    qualifiedName,
    filePath: 'src/x.ts',
    language: 'typescript',
    startLine: 1,
    endLine: 2,
  }) as unknown as Node;

describe('matchesSymbol: qualified queries align to scope boundaries', () => {
  it('rejects a substring match that starts mid-segment', () => {
    expect(matchesSymbol(runIn('FooBar::run'), 'Bar::run')).toBe(false);
  });

  it('accepts a match that lands on a whole scope segment', () => {
    expect(matchesSymbol(runIn('Outer::Bar::run'), 'Bar::run')).toBe(true);
  });
});
