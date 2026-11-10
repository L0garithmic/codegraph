import { describe, it, expect } from 'vitest';
import { avg, avgText, savedText } from '../scripts/agent-eval/readme-bench-report.mjs';

describe('README A/B averages with no complete repo', () => {
  it('reports n/a, not a measured zero, when no repo had both arms', () => {
    expect(avg([])).toBeNull();
    expect(savedText(avg([]))).toBe('n/a');
    expect(avgText(avg([]), ' with codegraph')).toBe('n/a');
  });

  it('still averages real values', () => {
    expect(avg([40, -20])).toBe(10);
    expect(savedText(avg([40, -20]))).toBe('10%');
  });
});
