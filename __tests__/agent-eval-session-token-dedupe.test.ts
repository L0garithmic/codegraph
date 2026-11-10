/**
 * parse-session's token totals count each API message once. One response is
 * logged once per content block (thinking, text, tool_use), each repeating the
 * same usage, so the three events of message m1 must add its usage a single time.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';

describe('parse-session token totals', () => {
  it('counts a multi-block message once', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-tokens-'));
    try {
      const home = path.join(base, 'home');
      const proj = path.join(base, 'proj');
      fs.mkdirSync(proj);
      const real = fs.realpathSync(proj);
      const projLogs = path.join(home, '.claude', 'projects', real.replace(/\//g, '-'));
      fs.mkdirSync(projLogs, { recursive: true });
      const usage1 = { input_tokens: 2000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 1000 };
      const usage2 = { input_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 4000, output_tokens: 500 };
      const lines = [
        { type: 'assistant', message: { id: 'm1', usage: usage1, content: [{ type: 'thinking', thinking: '' }] } },
        { type: 'assistant', message: { id: 'm1', usage: usage1, content: [{ type: 'tool_use', id: 't1', name: 'Read', input: {} }] } },
        { type: 'assistant', message: { id: 'm1', usage: usage1, content: [{ type: 'text', text: 'hi' }] } },
        { type: 'assistant', message: { id: 'm2', usage: usage2, content: [{ type: 'text', text: 'done' }] } },
      ];
      fs.writeFileSync(path.join(projLogs, 'sess1.jsonl'), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
      const out = execFileSync(
        process.execPath,
        [path.resolve(process.cwd(), 'scripts/agent-eval/parse-session.mjs'), real],
        { env: { ...process.env, HOME: home }, encoding: 'utf8' }
      );
      expect(out).toContain('TOKENS: gen 1.5k | fresh-in 2.1k | cached-in 4.0k | billable≈ 3.6k');
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  });
});
