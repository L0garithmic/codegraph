/**
 * parse-session's explore count is the main thread PLUS the subagents. When both
 * use codegraph_explore, the verdict must add them, not keep only the subagent's.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';

const explore = (id: string) => ({
  type: 'assistant',
  message: { id, usage: { input_tokens: 1, output_tokens: 1 }, content: [{ type: 'tool_use', id, name: 'mcp__codegraph__codegraph_explore', input: { query: 'x' } }] },
});

describe('parse-session explore count', () => {
  it('adds main-thread and subagent explore calls', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-explore-'));
    try {
      const home = path.join(base, 'home');
      const proj = path.join(base, 'proj');
      fs.mkdirSync(proj);
      const real = fs.realpathSync(proj);
      const projLogs = path.join(home, '.claude', 'projects', real.replace(/\//g, '-'));
      const subDir = path.join(projLogs, 'sess1', 'subagents');
      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(
        path.join(projLogs, 'sess1.jsonl'),
        [explore('e1'), explore('e2')].map((l) => JSON.stringify(l)).join('\n') + '\n'
      );
      fs.writeFileSync(
        path.join(subDir, 'agent-a.jsonl'),
        [explore('s1'), explore('s2'), explore('s3')].map((l) => JSON.stringify(l)).join('\n') + '\n'
      );
      const out = execFileSync(
        process.execPath,
        [path.resolve(process.cwd(), 'scripts/agent-eval/parse-session.mjs'), real],
        { env: { ...process.env, HOME: home }, encoding: 'utf8' }
      );
      expect(out).toContain('codegraph_explore used 5x');
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  });
});
