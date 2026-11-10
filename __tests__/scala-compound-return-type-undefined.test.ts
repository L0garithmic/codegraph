import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
});

describe('Scala compound return types have no single receiver type', () => {
  it('returns no return type for def f(): Foo with Bar', () => {
    const source = 'object Repo {\n  def load(): Foo with Bar = ???\n}\n';
    const fn = extractFromSource('Repo.scala', source).nodes.find((n) => n.name === 'load');
    expect(fn).toBeDefined();
    expect(fn?.returnType).toBeUndefined();
  });
});
