/**
 * `codegraph files --pattern` and `codegraph affected --filter` accept the same
 * glob vocabulary (one converter, `globToRegex`): `?` matches one character
 * and `**` spans directories. Before this, `affected` treated `?` as a regex
 * operator, so the two commands disagreed on the same glob.
 *
 * Exercised end-to-end against the built binary.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CodeGraph } from '../src';

const BIN = path.resolve(__dirname, '../dist/bin/codegraph.js');

function run(cwd: string, args: string[]): string {
  return execFileSync(process.execPath, [BIN, ...args, '-p', cwd], {
    encoding: 'utf-8',
    env: { ...process.env, CODEGRAPH_NO_DAEMON: '1', CODEGRAPH_WASM_RELAUNCHED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

describe('glob filters — files --pattern and affected --filter agree', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-glob-parity-'));
    fs.mkdirSync(path.join(tempDir, 'src/deep'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'src/a.ts'), 'export const a = 1;\n');
    fs.writeFileSync(path.join(tempDir, 'src/ab.ts'), 'export const ab = 1;\n');
    fs.writeFileSync(path.join(tempDir, 'src/deep/c.test.ts'), "test('c', () => {});\n");
    const cg = CodeGraph.initSync(tempDir);
    await cg.indexAll();
    cg.close();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const cases: Array<{ glob: string; changed: string[]; matches: string[]; decoys: string[] }> = [
    { glob: 'src/?.ts', changed: ['src/a.ts', 'src/ab.ts'], matches: ['src/a.ts'], decoys: ['src/ab.ts'] },
    { glob: 'src/**/*.test.ts', changed: ['src/a.ts', 'src/deep/c.test.ts'], matches: ['src/deep/c.test.ts'], decoys: ['src/a.ts'] },
  ];

  for (const c of cases) {
    it(`"${c.glob}" selects the same files in files --pattern and affected --filter`, () => {
      const filesOut = run(tempDir, ['files', '--pattern', c.glob, '--format', 'flat']);
      for (const m of c.matches) expect(filesOut).toContain(path.basename(m));
      for (const d of c.decoys) expect(filesOut).not.toContain(path.basename(d));

      const affectedOut = run(tempDir, ['affected', ...c.changed, '--filter', c.glob, '--quiet'])
        .split('\n').map((s) => s.trim()).filter(Boolean).sort();
      expect(affectedOut).toEqual([...c.matches].sort());
    });
  }
});
