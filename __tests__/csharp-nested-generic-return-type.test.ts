/**
 * A C# method returning a nested generic keeps its base type. The return type
 * feeds chained-call resolution, so losing it drops the link to the class.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
});

describe('csharp: nested generic return types', () => {
  it('reduces List<List<Foo>> to List, not to the broken "List>"', () => {
    const code = `
namespace App {
  public class Repo {
    public List<List<Foo>> Groups() { return null; }
    public List<Foo> Flat() { return null; }
  }
}
`;
    const result = extractFromSource('Repo.cs', code);
    expect(result.nodes.find((n) => n.name === 'Groups' && n.kind === 'method')?.returnType).toBe('List');
    expect(result.nodes.find((n) => n.name === 'Flat' && n.kind === 'method')?.returnType).toBe('List');
  });
});
