/**
 * A qualified name must resolve through the same exact-name path as the CLI and
 * MCP tools, so a real definition is not lost behind the first 50 FTS hits.
 */
import { describe, it, expect } from 'vitest';
import { findAllSymbols } from '../src/graph/named-symbol-flow';
import type CodeGraph from '../src/index';
import type { Node } from '../src/types';

const makeNode = (i: number, name: string, qualifiedName: string): Node =>
  ({
    id: `n${i}`,
    kind: 'method',
    name,
    qualifiedName,
    filePath: `src/f${i}.ts`,
    language: 'typescript',
    startLine: 1,
    endLine: 2,
  }) as unknown as Node;

describe('findAllSymbols: qualified names use the exact-name index', () => {
  it('finds a qualified definition that the first 50 FTS hits do not include', () => {
    const decoys = Array.from({ length: 60 }, (_, i) => makeNode(i, 'run', `Other${i}::run`));
    const target = makeNode(999, 'run', 'Service::run');
    const fake = {
      getNodesByName: (name: string) => (name === 'run' ? [...decoys, target] : []),
      // FTS only ever surfaces the decoys, so the target sits beyond the cap.
      searchNodes: () => decoys.slice(0, 50).map((node) => ({ node, score: 1 })),
      getNodesByNamePrefix: () => [],
      generatedFilePredicate: () => () => false,
    } as unknown as CodeGraph;

    const { nodes } = findAllSymbols(fake, 'Service::run');

    expect(nodes.map((n) => n.id)).toEqual(['n999']);
  });
});
