/**
 * The concurrent-explore harness must record a stall even when the batch blocks
 * and finishes before the heartbeat interval gets a turn.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const HARNESS = path.resolve(__dirname, '../scripts/agent-eval/repro-concurrent-explore.mjs');
const BLOCK_MS = 200;

let dir: string;

describe('repro-concurrent-explore: a blocking batch records its stall', () => {
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-repro-stall-'));
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ type: 'module' }));
    fs.mkdirSync(path.join(dir, 'dist', 'mcp'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'dist', 'index.js'),
      'export default { openSync() { return { getStats: () => ({ fileCount: 1 }), close() {} }; } };\n'
    );
    // execute() blocks the thread synchronously, then resolves: no timer can run in between.
    fs.writeFileSync(
      path.join(dir, 'dist', 'mcp', 'tools.js'),
      [
        'export class ToolHandler {',
        '  async execute() {',
        `    const end = Date.now() + ${BLOCK_MS};`,
        '    while (Date.now() < end) { /* block */ }',
        "    return { content: [{ type: 'text', text: 'x' }] };",
        '  }',
        '}',
        '',
      ].join('\n')
    );
  });

  afterAll(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('reports a stall of at least the blocked time', async () => {
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn(process.execPath, [HARNESS, dir, '3', '5000'], {
        cwd: dir,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let out = '';
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => (out += chunk));
      child.stderr.resume();
      const timer = setTimeout(() => child.kill('SIGKILL'), 30_000);
      child.on('error', reject);
      child.on('exit', () => {
        clearTimeout(timer);
        resolve(out);
      });
    });

    const m = /event-loop max stall: (\d+)ms\s+stalls>60ms: (\d+)/.exec(stdout);
    expect(m).not.toBeNull();
    expect(Number(m![2])).toBeGreaterThanOrEqual(1);
    expect(Number(m![1])).toBeGreaterThanOrEqual(BLOCK_MS * 2);
  });
});
