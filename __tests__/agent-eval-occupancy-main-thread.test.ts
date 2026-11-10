/**
 * The occupancy timeline (ctxBase / ctxFinal) follows the MAIN thread only. A
 * subagent's requests have their own context window, so a subagent request
 * logged last must not become the parent's final context.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseSession } from '../scripts/agent-eval/parse-run.mjs';

const assistant = (id: string, input: number, parent?: string) => ({
  type: 'assistant',
  ...(parent ? { parent_tool_use_id: parent } : {}),
  message: { id, usage: { input_tokens: input, output_tokens: 10 }, content: [{ type: 'text', text: id }] },
});

describe('parseSession occupancy', () => {
  it('ignores subagent requests when it reads the parent context window', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-occupancy-'));
    try {
      const file = path.join(dir, 'session.jsonl');
      fs.writeFileSync(
        file,
        [assistant('m1', 1000), assistant('m2', 2000), assistant('s1', 90000, 'toolu_task')]
          .map((e) => JSON.stringify(e))
          .join('\n') + '\n'
      );
      const s = parseSession([file]);
      expect(s.occupancy.ctxBase).toBe(1000);
      expect(s.occupancy.ctxFinal).toBe(2000);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
