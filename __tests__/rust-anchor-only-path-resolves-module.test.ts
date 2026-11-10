import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { CodeGraph } from '../src';

/**
 * A Rust path anchored on the crate root or a parent module (`crate::helper()`,
 * `super::helper()`) names an item in that module's file. The anchor alone is
 * a complete module path and must resolve to that file. A same-named function
 * in another module must not be chosen instead.
 */
let dir: string;
let cg: CodeGraph | undefined;
afterEach(() => {
  cg?.close();
  cg = undefined;
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
});

describe('rust anchor-only module paths', () => {
  it('resolves crate::helper() to the crate root file', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-rust-anchor-'));
    fs.mkdirSync(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'src', 'lib.rs'), 'pub fn helper() {}\n');
    fs.writeFileSync(path.join(dir, 'src', 'other.rs'), 'pub fn helper() {}\n');
    fs.writeFileSync(path.join(dir, 'src', 'a.rs'), 'pub fn run() { crate::helper(); }\n');
    cg = CodeGraph.initSync(dir);
    await cg.indexAll();
    await cg.resolveReferencesBatched();
    const run = cg.getNodesByName('run').find((n) => n.filePath === 'src/a.rs')!;
    const targets = cg.getOutgoingEdges(run.id).filter((e) => e.kind === 'calls').map((e) => cg!.getNode(e.target));
    expect(targets.map((t) => t?.filePath)).toEqual(['src/lib.rs']);
  });
});
