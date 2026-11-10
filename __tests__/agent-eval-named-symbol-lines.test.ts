/**
 * The named-symbol probe counts a declaration as delivered only when its own
 * file's section carries that line number, never when another file does.
 */
import { describe, it, expect } from 'vitest';
import { renderedLinesIn } from '../scripts/agent-eval/probe-lib.mjs';

describe('agent-eval: named-symbol delivery is per file', () => {
  const response = [
    '**`src/a.ts`** — alpha',
    '```ts',
    '10\tconst a = 1;',
    '```',
    '**`src/b.ts`** — beta',
    '```ts',
    '42\texport function target() {}',
    '```',
    '',
  ].join('\n');

  it('counts a line only under the file whose section holds it', () => {
    expect(renderedLinesIn(response, 'src/b.ts').has(42)).toBe(true);
    expect(renderedLinesIn(response, 'src/a.ts').has(42)).toBe(false);
  });

  it('does not treat a line in another file as the target declaration', () => {
    // target() is defined in src/c.ts (line 42), which the response never renders.
    expect(renderedLinesIn(response, 'src/c.ts').has(42)).toBe(false);
  });
});
