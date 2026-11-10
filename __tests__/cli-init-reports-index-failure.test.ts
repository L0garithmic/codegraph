/**
 * `codegraph init --yes` must not print "Done" or exit 0 when the index it
 * built did not complete. A held writer lock makes `indexAll` return
 * `success: false` (not throw), which `init` used to ignore.
 *
 * Exercised end-to-end against the built binary.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const BIN = path.resolve(__dirname, '../dist/bin/codegraph.js');

describe('codegraph init --yes — a returned indexing failure', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-init-failure-'));
    fs.writeFileSync(path.join(tempDir, 'a.ts'), 'export const a = 1;\n');
    // A live PID (this test process) in the writer lock makes indexAll refuse
    // to run and return success: false.
    fs.mkdirSync(path.join(tempDir, '.codegraph'));
    fs.writeFileSync(path.join(tempDir, '.codegraph', 'codegraph.lock'), String(process.pid));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('exits nonzero and does not print Done', () => {
    const r = spawnSync(process.execPath, [BIN, 'init', '--yes'], {
      cwd: tempDir,
      encoding: 'utf-8',
      env: { ...process.env, CODEGRAPH_NO_DAEMON: '1', CODEGRAPH_TELEMETRY: '0', DO_NOT_TRACK: '1', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120_000,
    });
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).not.toContain('Done');
  });
});
