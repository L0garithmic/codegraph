/**
 * A string is a callable only in a callable argument position. In
 * `call_user_func('handler', 'payload')` the first string names a function and
 * the second is plain data, so it must not become a reference to `payload`.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CodeGraph } from '../src';

let dir: string;
let cg: CodeGraph;

describe('PHP string callables respect the callable argument position', () => {
  beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'php-callable-position-'));
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'src', 'app.php'),
      [
        '<?php',
        'function handler($x) { return $x; }',
        'function payload($x) { return $x; }',
        'function run($data) {',
        "    call_user_func('handler', 'payload');",
        '    return $data;',
        '}',
        '',
      ].join('\n')
    );
    cg = await CodeGraph.init(dir, { silent: true });
    await cg.indexAll();
  });

  afterAll(() => {
    cg?.close();
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('references the callable argument but not a data string that names another function', () => {
    const run = cg.getNodesByName('run')[0]!;
    const targets = cg
      .getOutgoingEdges(run.id)
      .map((e) => cg.getNode(e.target)?.name)
      .filter((n): n is string => !!n);

    expect(targets).toContain('handler');
    expect(targets).not.toContain('payload');
  });
});
