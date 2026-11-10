/**
 * The sweep probe never records a tool error as a successful size measurement.
 */
import { describe, it, expect } from 'vitest';
import { sweepRow } from '../scripts/agent-eval/probe-lib.mjs';

describe('agent-eval: sweep rows reject tool errors', () => {
  const subject = { id: 'gin-rw', repo: '/x', q: 'how?' };

  it('turns an unknown-tool error response into an error row, not a measurement', () => {
    const res = { isError: true, content: [{ type: 'text', text: 'Unknown tool: codegraph_context' }] };
    const row = sweepRow(subject, res, 12);
    expect(row.error).toMatch(/Unknown tool/);
    expect(row).not.toHaveProperty('chars');
  });

  it('measures a successful response', () => {
    const res = { content: [{ type: 'text', text: 'a\nb' }] };
    expect(sweepRow(subject, res, 7)).toEqual({ id: 'gin-rw', ms: 7, chars: 3, lines: 2 });
  });
});
