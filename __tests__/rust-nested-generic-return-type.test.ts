/**
 * A Rust function returning a nested generic keeps its base type. The return type
 * feeds chained-call resolution, so `Option<Vec<Foo>>` must reduce to `Option`.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
});

describe('rust: nested generic return types', () => {
  it('reduces Option<Vec<Foo>> to Option, not to the broken "Option>"', () => {
    const result = extractFromSource('lib.rs', 'pub fn f() -> Option<Vec<Foo>> { None }\n');
    expect(result.nodes.find((n) => n.name === 'f' && n.kind === 'function')?.returnType).toBe('Option');
  });
});
