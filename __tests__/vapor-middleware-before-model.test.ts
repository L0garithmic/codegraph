/**
 * A `…Middleware` class also matches the PascalCase model pattern. It must
 * resolve through the middleware branch (its own directory, confidence 0.8),
 * not the model branch (confidence 0.75).
 */
import { describe, it, expect } from 'vitest';
import { vaporResolver } from '../src/resolution/frameworks/swift';

describe('vapor: a Middleware class resolves as middleware, not as a model', () => {
  it('prefers Middleware/ over Models/ for AuthMiddleware', () => {
    const classes = [
      { id: 'model-auth', kind: 'class', name: 'AuthMiddleware', filePath: 'Sources/App/Models/AuthMiddleware.swift' },
      { id: 'middleware-auth', kind: 'class', name: 'AuthMiddleware', filePath: 'Sources/App/Middleware/AuthMiddleware.swift' },
    ];
    const context = {
      readFile: () => null,
      getAllFiles: () => [],
      getNodesByName: (name: string) => classes.filter((n) => n.name === name),
    } as any;
    const ref = {
      referenceName: 'AuthMiddleware',
      referenceKind: 'calls',
      filePath: 'Sources/App/routes.swift',
      language: 'swift',
      line: 1,
      column: 0,
    } as any;
    const hit = vaporResolver.resolve(ref, context);
    expect(hit?.targetNodeId).toBe('middleware-auth');
    expect(hit?.confidence).toBe(0.8);
  });
});
