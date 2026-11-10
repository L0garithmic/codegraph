import { describe, it, expect } from 'vitest';
import { resolveImportPath } from '../src/resolution/import-resolver';
import type { ResolutionContext } from '../src/resolution';

/**
 * Conventional aliases (`@src/`, `@app/`, `app/`, ...) resolve even when the
 * project declares no tsconfig paths. They must not be classified as npm
 * packages first, or their fallback mapping never runs.
 */
function contextWithFiles(files: string[]): ResolutionContext {
  const set = new Set(files);
  return {
    getNodesInFile: () => [],
    getNodesByName: () => [],
    getNodesByQualifiedName: () => [],
    getNodesByKind: () => [],
    fileExists: (p: string) => set.has(p),
    readFile: () => null,
    getProjectRoot: () => '/test',
    getAllFiles: () => files,
    getNodesByLowerName: () => [],
    getImportMappings: () => [],
  } as unknown as ResolutionContext;
}

describe('fallback alias imports without project alias configuration', () => {
  const ctx = contextWithFiles(['src/util.ts', 'app/util.ts', 'main.ts']);
  it.each([
    ['@/util', 'src/util.ts'],
    ['~/util', 'src/util.ts'],
    ['@src/util', 'src/util.ts'],
    ['src/util', 'src/util.ts'],
    ['@app/util', 'app/util.ts'],
    ['app/util', 'app/util.ts'],
  ])('resolves %s to %s', (importPath, expected) => {
    expect(resolveImportPath(importPath, 'main.ts', 'typescript', ctx)).toBe(expected);
  });
});
