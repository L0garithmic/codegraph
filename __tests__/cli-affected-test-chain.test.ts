/**
 * `codegraph affected` keeps walking through a test file, so a test that
 * imports another test is still reported (within the depth limit).
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

function affected(cwd: string, args: string[]): string[] {
  const out = execFileSync(process.execPath, [BIN, 'affected', ...args, '--quiet', '-p', cwd], {
    encoding: 'utf-8',
    env: { ...process.env, CODEGRAPH_NO_DAEMON: '1', CODEGRAPH_WASM_RELAUNCHED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return out.split('\n').map((s) => s.trim()).filter(Boolean).sort();
}

describe('codegraph affected — a test that imports another test', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-affected-chain-'));
    fs.mkdirSync(path.join(tempDir, 'src'));
    // source.ts <- helper.test.ts <- consumer.test.ts
    fs.writeFileSync(path.join(tempDir, 'src/source.ts'), 'export function source(){ return 1; }\n');
    fs.writeFileSync(
      path.join(tempDir, 'src/helper.test.ts'),
      "import { source } from './source';\nexport function helper(){ return source(); }\ntest('h', () => helper());\n",
    );
    fs.writeFileSync(
      path.join(tempDir, 'src/consumer.test.ts'),
      "import { helper } from './helper.test';\ntest('c', () => helper());\n",
    );
    const cg = CodeGraph.initSync(tempDir);
    await cg.indexAll();
    cg.close();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('reports both the direct test and the test that imports it', () => {
    expect(affected(tempDir, ['src/source.ts'])).toEqual(['src/consumer.test.ts', 'src/helper.test.ts']);
  });
});
