/**
 * `async def` is async and a plain `def` is not. The `async` keyword is a child
 * of the function_definition node, not a sibling placed before it.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CodeGraph } from '../src';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

let dir: string;
let cg: CodeGraph;

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-async-'));
  fs.writeFileSync(path.join(dir, 'mod.py'), 'async def fetch_user():\n    return 1\n\ndef load_user():\n    return 2\n');
  cg = CodeGraph.initSync(dir);
  await cg.indexAll();
});

afterAll(() => {
  cg.destroy();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('python async detection', () => {
  it('marks async def as async and plain def as not', () => {
    expect(cg.getNodesByName('fetch_user')[0]?.isAsync).toBe(true);
    expect(cg.getNodesByName('load_user')[0]?.isAsync).toBeFalsy();
  });
});
