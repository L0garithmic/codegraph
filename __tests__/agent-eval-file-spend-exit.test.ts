/**
 * The file-spend probe fails (exit 1) on a starved, flagged report, whatever the
 * output format; the exit status depends on the flags, not on --json.
 */
import { describe, it, expect } from 'vitest';
import { exitCodeFor } from '../scripts/agent-eval/probe-lib.mjs';

describe('agent-eval: file-spend exit status', () => {
  it('exits 1 when any repo has a starvation flag', () => {
    const flagged = [{ repo: 'vscode', sourceChars: 1, files: [], flags: [{ starved: 'a.ts' }] }];
    expect(exitCodeFor(flagged)).toBe(1);
  });

  it('exits 0 when no repo is flagged', () => {
    expect(exitCodeFor([{ repo: 'express', sourceChars: 1, files: [], flags: [] }])).toBe(0);
  });
});
