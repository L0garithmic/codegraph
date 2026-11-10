import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { CodeGraph } from '../src';

/**
 * `.on('event', handler)` links the emitter's dispatcher to a handler named in
 * the registration. When several same-named functions exist in other files, no
 * arbitrary one may be chosen: the handler in the registering file wins, and an
 * ambiguous name with no same-file match gets no edge.
 */
let dir: string;
let cg: CodeGraph | undefined;
afterEach(() => {
  cg?.close();
  cg = undefined;
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
});

async function eventEdges(files: Record<string, string>): Promise<Array<{ target: string; file: string }>> {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-event-handler-'));
  for (const [file, source] of Object.entries(files)) fs.writeFileSync(path.join(dir, file), source);
  cg = CodeGraph.initSync(dir);
  await cg.indexAll();
  await cg.resolveReferencesBatched();
  const db = (cg as any).db.db;
  return db
    .prepare(
      `SELECT t.name target, t.file_path file FROM edges e JOIN nodes t ON t.id = e.target
       WHERE json_extract(e.metadata,'$.synthesizedBy') = 'event-emitter'`
    )
    .all();
}

describe('event-emitter handler resolution', () => {
  it('links no edge when the handler name is ambiguous and not in the registering file', async () => {
    const edges = await eventEdges({
      'a.ts': 'export function onSave() { return "a"; }',
      'b.ts': 'export function onSave() { return "b"; }',
      'app.ts': `const bus: any = {};
export function publish() { bus.emit('save'); }
bus.on('save', onSave);
`,
    });
    expect(edges).toEqual([]);
  });

  it('prefers the handler defined in the registering file', async () => {
    const edges = await eventEdges({
      'a.ts': 'export function onSave() { return "a"; }',
      'b.ts': 'export function onSave() { return "b"; }',
      'app.ts': `const bus: any = {};
export function publish() { bus.emit('save'); }
function onSave() { return "app"; }
bus.on('save', onSave);
`,
    });
    expect(edges).toEqual([{ target: 'onSave', file: 'app.ts' }]);
  });
});
