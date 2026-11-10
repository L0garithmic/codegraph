import { describe, it, expect } from 'vitest';
import { residualCell } from '../scripts/agent-eval/readme-bench-report.mjs';

describe('README A/B per-row residual cell', () => {
  const tok = (t: number) => String(t);

  it('spells out the direction in words so a negative change never reads as a win', () => {
    // codegraph's residual 1000 vs Read/Grep's 100: codegraph occupies 900% MORE.
    expect(residualCell(1000, 100, tok)).toBe('1000→100 (900% HIGHER)');
    expect(residualCell(100, 1000, tok)).toBe('100→1000 (90% lower)');
  });
});
