/**
 * The daemon-clients harness must not start its concurrent wave when the warm
 * explore fails: it aborts, kills its clients, and exits non-zero.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const HARNESS = path.resolve(__dirname, '../scripts/agent-eval/repro-daemon-clients.mjs');
const FAKE_CLI = [
  "import fs from 'node:fs';",
  "import readline from 'node:readline';",
  'const log = process.env.FAKE_CLI_LOG;',
  'const send = (m) => process.stdout.write(JSON.stringify(m) + "\\n");',
  "readline.createInterface({ input: process.stdin }).on('line', (line) => {",
  '  const msg = JSON.parse(line);',
  '  if (msg.method) fs.appendFileSync(log, `${msg.method} ${msg.id ?? ""}\\n`);',
  "  if (msg.method === 'initialize') {",
  "    send({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2024-11-05', capabilities: {}, serverInfo: { name: 'fake', version: '1' } } });",
  "  } else if (msg.method === 'tools/call') {",
  "    send({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: 'warm failed' } });",
  '  }',
  '});',
  '',
].join('\n');

let dir: string;
let logFile: string;

describe('repro-daemon-clients: warm failure aborts the wave', () => {
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-repro-warm-'));
    logFile = path.join(dir, 'calls.log');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ type: 'module' }));
    fs.mkdirSync(path.join(dir, 'dist', 'bin'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'dist', 'bin', 'codegraph.js'), FAKE_CLI);
  });

  afterAll(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('exits without sending any concurrent explore after a failed warm call', async () => {
    const result = await new Promise<{ code: number | null; timedOut: boolean }>((resolve) => {
      const child = spawn(process.execPath, [HARNESS, dir, '2', '5000', '1'], {
        cwd: dir,
        env: { ...process.env, FAKE_CLI_LOG: logFile },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, 30_000);
      child.stdout.resume();
      child.stderr.resume();
      child.on('exit', (code) => {
        clearTimeout(timer);
        resolve({ code, timedOut });
      });
    });

    const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
    expect(result.timedOut).toBe(false);
    expect(result.code).toBe(1);
    expect(log).toContain('tools/call warm-0');
    expect(log).not.toMatch(/tools\/call call-/);
  });
});
