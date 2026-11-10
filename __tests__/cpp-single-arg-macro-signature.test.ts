/**
 * A function whose name is recovered from a single-argument macro is not
 * stored with the macro's argument list as its signature. `DEFINE_HANDLER(on_event)`
 * defines `on_event`; `(on_event)` is the macro call, not a parameter list.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadGrammarsForLanguages } from '../src/extraction/grammars';

describe('C++ macro-defined functions carry no macro-argument signature', () => {
  beforeAll(async () => {
    await initGrammars();
    await loadGrammarsForLanguages(['cpp']);
  });

  it('does not store the invocation arguments of a single-argument macro as the signature', () => {
    const source = [
      '#define DEFINE_HANDLER(name) void name(int code)',
      'DEFINE_HANDLER(on_event) { }',
      '',
    ].join('\n');
    const result = extractFromSource('handler.cpp', source, 'cpp');
    const handler = result.nodes.find((n) => n.name === 'on_event' && n.kind === 'function');
    expect(handler).toBeDefined();
    expect(handler?.signature).toBeUndefined();
  });
});
