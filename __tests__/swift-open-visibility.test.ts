/**
 * Swift's `open` access level is public API, so an `open` class and its
 * `open` members report public visibility, not the internal default.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
});

describe('swift: open access level', () => {
  it('gives an open class and its open method public visibility', () => {
    const result = extractFromSource('A.swift', 'open class A { open func f() {} }\n');
    expect(result.nodes.find((n) => n.name === 'A' && n.kind === 'class')?.visibility).toBe('public');
    expect(result.nodes.find((n) => n.name === 'f' && n.kind === 'method')?.visibility).toBe('public');
  });
});
