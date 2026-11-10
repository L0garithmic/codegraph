import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction/tree-sitter';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
});

describe('Kotlin async detection reads the suspend modifier, not annotation text', () => {
  it('does not mark a function async because an annotation argument says "suspend"', () => {
    const source = [
      'class Svc {',
      '  @Tag("suspend") fun plain(): Int { return 1 }',
      '  suspend fun real(): Int { return 2 }',
      '}',
    ].join('\n');
    const nodes = extractFromSource('Svc.kt', source).nodes.filter((n) => n.kind === 'method' || n.kind === 'function');
    expect(nodes.find((n) => n.name === 'plain')?.isAsync).toBeFalsy();
    expect(nodes.find((n) => n.name === 'real')?.isAsync).toBe(true);
  });
});
