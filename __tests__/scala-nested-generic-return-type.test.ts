import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
});

describe('Scala nested generic return types keep their base name', () => {
  it('reduces Map[String, List[Foo]] to Map', () => {
    const source = 'object Repo {\n  def load(): Map[String, List[Foo]] = ???\n}\n';
    const fn = extractFromSource('Repo.scala', source).nodes.find((n) => n.name === 'load');
    expect(fn?.returnType).toBe('Map');
  });
});
