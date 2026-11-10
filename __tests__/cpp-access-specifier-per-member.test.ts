/**
 * A class member takes the access section it sits in. With several sections,
 * each member must be labelled by the nearest specifier before it, not by the
 * first specifier in the class body.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction';
import { initGrammars, loadGrammarsForLanguages } from '../src/extraction/grammars';

describe('C++ member visibility follows the section a member sits in', () => {
  beforeAll(async () => {
    await initGrammars();
    await loadGrammarsForLanguages(['cpp']);
  });

  it('labels each member by its own access section across several sections', () => {
    const source = [
      'class Mixed {',
      'public:',
      '  void first() {}',
      'private:',
      '  void hidden() {}',
      'public:',
      '  void last() {}',
      '};',
      '',
    ].join('\n');
    const result = extractFromSource('mixed.cpp', source, 'cpp');
    const visibility = Object.fromEntries(
      result.nodes.filter((n) => n.kind === 'method').map((n) => [n.name, n.visibility]),
    );
    expect(visibility).toEqual({ first: 'public', hidden: 'private', last: 'public' });
  });
});
