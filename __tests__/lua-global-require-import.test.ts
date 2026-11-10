import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadGrammarsForLanguages } from '../src/extraction/grammars';

describe('Lua global assignment of require', () => {
  beforeAll(async () => {
    await initGrammars();
    await loadGrammarsForLanguages(['lua']);
  });

  it('x = require("x") produces an import node and an imports reference', () => {
    const result = extractFromSource('init.lua', 'x = require("net.http")\n', 'lua');
    const imports = result.nodes.filter((n) => n.kind === 'import');
    expect(imports.map((n) => n.name)).toContain('net.http');
    expect(
      result.unresolvedReferences.some(
        (r) => r.referenceKind === 'imports' && r.referenceName === 'net.http'
      )
    ).toBe(true);
  });
});
