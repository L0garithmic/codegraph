import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { CodeGraph } from '../src';

/**
 * `mod.member()` after `import pkg.mod as mod` may only link to a top-level
 * definition of `pkg/mod.py`. A function nested inside another function is not
 * a module attribute and must not be linked through the import.
 */
let dir: string;
let cg: CodeGraph | undefined;
afterEach(() => {
  cg?.close();
  cg = undefined;
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
});

describe('python module member resolution', () => {
  it('does not link mod.member to a nested function of the same name', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-py-nested-'));
    fs.mkdirSync(path.join(dir, 'pkg'));
    fs.writeFileSync(path.join(dir, 'pkg', '__init__.py'), '');
    fs.writeFileSync(path.join(dir, 'pkg', 'mod.py'), `def outer():
    def member():
        return 1
    return member
`);
    fs.writeFileSync(path.join(dir, 'main.py'), `import pkg.mod as mod

def run():
    return mod.member()
`);
    cg = CodeGraph.initSync(dir);
    await cg.indexAll();
    await cg.resolveReferencesBatched();
    const run = cg.getNodesByName('run').find((n) => n.filePath === 'main.py')!;
    const targets = cg.getOutgoingEdges(run.id).filter((e) => e.kind === 'calls').map((e) => cg!.getNode(e.target));
    expect(targets.filter((t) => t?.name === 'member')).toEqual([]);
  });
});
