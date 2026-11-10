/**
 * Re-extracting a single-function Erlang file keeps the function. Clause-merge
 * state belongs to one extraction; it must not make a later run treat the first
 * clause as a continuation of a node that run never created.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadGrammarsForLanguages } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadGrammarsForLanguages(['erlang']);
});

describe('erlang clause merging', () => {
  it('keeps a single-function file on every re-extraction', () => {
    const source = '-module(m).\nf(X) -> X.\n';
    for (let run = 0; run < 2; run++) {
      const fns = extractFromSource('src/m.erl', source, 'erlang').nodes.filter(
        (n) => n.kind === 'function' && n.name === 'f'
      );
      expect(fns).toHaveLength(1);
    }
  });
});
