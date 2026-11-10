import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
});

describe('VB.NET nested generic return types keep their base name', () => {
  it('reduces Dictionary(Of String, List(Of Foo)) to Dictionary', () => {
    const source =
      'Public Class Repo\n' +
      '    Public Function Load() As Dictionary(Of String, List(Of Foo))\n' +
      '        Return Nothing\n' +
      '    End Function\n' +
      'End Class\n';
    const fn = extractFromSource('Repo.vb', source).nodes.find((n) => n.name === 'Load');
    expect(fn?.returnType).toBe('Dictionary');
  });
});
