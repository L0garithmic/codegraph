import { describe, it, expect } from 'vitest';
import { parseFailureReason } from '../scripts/agent-eval/readme-bench-report.mjs';

describe('README A/B names why a run was dropped', () => {
  it('says which result subtype made a run fail to parse', () => {
    expect(parseFailureReason([{ subtype: 'error_max_turns' }])).toBe('result subtype error_max_turns');
  });

  it('says when a transcript has no result event at all', () => {
    expect(parseFailureReason([])).toBe('no result event in the transcript');
  });
});
