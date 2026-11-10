/**
 * Re-extracting the same Erlang path reads that file's CURRENT export list. A
 * module's exports must not be remembered from an earlier extraction of the path.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadGrammarsForLanguages } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadGrammarsForLanguages(['erlang']);
});

const fnF = (source: string) =>
  extractFromSource('src/m.erl', source, 'erlang').nodes.find((n) => n.kind === 'function' && n.name === 'f');

describe('erlang export status', () => {
  it('follows the export list of each extraction of the same path', () => {
    expect(fnF('-module(m).\n-export([f/1]).\nf(X) -> X.\n')?.isExported).toBe(true);
    expect(fnF('-module(m).\nf(X) -> X.\n')?.isExported).toBe(false);
  });
});
