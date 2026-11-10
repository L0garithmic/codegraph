/**
 * A method is static when ANY of its decorators is `@staticmethod`, even with
 * other decorators stacked around it. A decorator that merely contains the word
 * (`@not_staticmethod`) is not.
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
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-static-'));
  fs.writeFileSync(
    path.join(dir, 'svc.py'),
    'import functools\n\nclass Svc:\n' +
      '    @staticmethod\n    @functools.lru_cache\n    def stacked():\n        return 1\n\n' +
      '    @not_staticmethod\n    def misleading(self):\n        return 2\n'
  );
  cg = CodeGraph.initSync(dir);
  await cg.indexAll();
});

afterAll(() => {
  cg.destroy();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('python static detection', () => {
  it('finds @staticmethod under other decorators, and not a look-alike name', () => {
    expect(cg.getNodesByName('stacked')[0]?.isStatic).toBe(true);
    expect(cg.getNodesByName('misleading')[0]?.isStatic).toBeFalsy();
  });
});
