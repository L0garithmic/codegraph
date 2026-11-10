import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { CodeGraph } from '../src';

/**
 * One registration channel links at most MAX_CALLBACKS_PER_CHANNEL (40)
 * callback edges, even when a single registrar call site has many dispatchers
 * sharing the same field. The cap must hold per dispatcher, not only per
 * incoming registration edge.
 */
let dir: string;
let cg: CodeGraph | undefined;
afterEach(() => {
  cg?.close();
  cg = undefined;
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
});

describe('callback channel edge cap', () => {
  it('links at most 40 dispatchers to one registered callback', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-callback-cap-'));
    const dispatchers = Array.from({ length: 45 }, (_, i) => `  emit${i}() { this.handlers.forEach(h => h()); }`).join('\n');
    // Registrar, dispatchers and the registering call share one file (the channel pairs within a file).
    fs.writeFileSync(path.join(dir, 'store.ts'), `export class Store {
  handlers = new Set<Function>();
  subscribe(cb: Function) { this.handlers.add(cb); }
  init() { this.subscribe(this.triggerRender); }
  triggerRender() { return 'real'; }
${dispatchers}
}
`);
    cg = CodeGraph.initSync(dir);
    await cg.indexAll();
    await cg.resolveReferencesBatched();
    const db = (cg as any).db.db;
    const row = db
      .prepare(
        `SELECT count(*) c FROM edges
         WHERE json_extract(metadata,'$.synthesizedBy') = 'callback'
           AND json_extract(metadata,'$.via') = 'subscribe'`
      )
      .get() as { c: number };
    expect(row.c).toBe(40);
  });
});
