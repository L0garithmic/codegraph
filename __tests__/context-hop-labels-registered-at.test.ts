import { describe, it, expect } from 'vitest';
import { ContextBuilder } from '../src/context';
import type { Node, Edge } from '../src/types';

// The call-paths section names each dynamic hop and, when the synthesizer
// recorded one, the registration site. JSX and Vue hops must carry it too.
function node(id: string, name: string): Node {
  return {
    id,
    kind: 'function',
    name,
    qualifiedName: name,
    filePath: `src/${name}.tsx`,
    language: 'typescript',
    startLine: 1,
    endLine: 2,
    startColumn: 0,
    endColumn: 0,
    updatedAt: 0,
  } as Node;
}

describe('context call paths: dynamic hop labels', () => {
  it('appends the registration site to jsx-render and vue-handler hops', () => {
    const nodes = new Map<string, Node>([
      ['a', node('a', 'Parent')],
      ['b', node('b', 'Middle')],
      ['c', node('c', 'Handler')],
    ]);
    const edges = [
      {
        source: 'a',
        target: 'b',
        kind: 'calls',
        provenance: 'heuristic',
        metadata: { synthesizedBy: 'jsx-render', via: 'Child', registeredAt: 'src/parent.tsx:4' },
      },
      {
        source: 'b',
        target: 'c',
        kind: 'calls',
        provenance: 'heuristic',
        metadata: { synthesizedBy: 'vue-handler', event: 'click', registeredAt: 'src/middle.vue:9' },
      },
    ] as unknown as Edge[];
    const subgraph = { nodes, edges, roots: ['a', 'c'] };

    const builder = Object.create(ContextBuilder.prototype) as {
      buildCallPathsSection(s: typeof subgraph): string;
    };
    const section = builder.buildCallPathsSection(subgraph);

    expect(section).toContain('renders <Child> @src/parent.tsx:4');
    expect(section).toContain('Vue @click handler @src/middle.vue:9');
  });
});
