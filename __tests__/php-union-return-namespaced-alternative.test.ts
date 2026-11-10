import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction/tree-sitter';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
});

describe('PHP return type: union with a namespaced alternative', () => {
  it('gives no return type to A|Vendor\\B, a union', () => {
    const source = [
      '<?php',
      'class Svc {',
      '  public function make(): A|Vendor\\B { return null; }',
      '}',
    ].join('\n');
    const method = extractFromSource('Svc.php', source).nodes.find(
      (n) => n.kind === 'method' && n.name === 'make',
    );
    expect(method).toBeDefined();
    expect(method?.returnType).toBeUndefined();
  });
});
