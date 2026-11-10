import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';
import { vbnetExtractor } from '../src/extraction/languages/vbnet';

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
});

describe('VB.NET constructors are owned by one rule', () => {
  it('leaves constructor_declaration to the Sub New hook and creates exactly one New', () => {
    expect(vbnetExtractor.methodTypes).not.toContain('constructor_declaration');
    const source =
      'Public Class Repo\n' +
      '    Public Sub New()\n' +
      '    End Sub\n' +
      'End Class\n';
    const ctors = extractFromSource('Repo.vb', source).nodes.filter((n) => n.name === 'New');
    expect(ctors).toHaveLength(1);
  });
});
