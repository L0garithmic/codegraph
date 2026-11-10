/**
 * A JSX component reference prefers a component in the caller's own directory.
 * "Same directory" means the same parent folder: a sibling whose name starts with
 * the same letters (`src/application` next to `src/app`) does not count, and a
 * root-level caller only matches root-level components.
 */
import { describe, it, expect } from 'vitest';
import { reactResolver } from '../src/resolution/frameworks/react';
import type { Node } from '../src/types';

function component(id: string, filePath: string): Node {
  return {
    id,
    kind: 'function',
    name: 'Widget',
    qualifiedName: `${filePath}::Widget`,
    filePath,
    language: 'tsx',
    startLine: 1,
    endLine: 1,
    startColumn: 0,
    endColumn: 0,
    updatedAt: 0,
  } as Node;
}

function resolveFrom(callerFile: string, candidates: Node[]) {
  const context = {
    getNodesByName: (name: string) => candidates.filter((n) => n.name === name),
  } as never;
  const ref = {
    referenceName: 'Widget',
    referenceKind: 'references',
    filePath: callerFile,
    language: 'tsx',
    fromNodeId: 'caller',
    line: 1,
    column: 0,
  } as never;
  return reactResolver.resolve!(ref, context)?.targetNodeId;
}

describe('react: same-directory component resolution', () => {
  const sibling = component('sibling', 'src/application/Widget.tsx');
  const components = component('components', 'src/components/Widget.tsx');

  it('does not treat src/application as the same directory as src/app', () => {
    // The caller's own folder is src/app; src/application only shares its prefix.
    expect(resolveFrom('src/app/Page.tsx', [sibling, components])).toBe('components');
  });

  it('a root-level caller does not claim a component in a nested folder', () => {
    const nested = component('nested', 'src/widgets/Widget.tsx');
    expect(resolveFrom('App.tsx', [nested, components])).toBe('components');
  });
});
