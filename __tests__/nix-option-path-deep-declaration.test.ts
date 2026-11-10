import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { CodeGraph } from '../src';

/**
 * A nix option declared seven segments deep (`services.a.b.c.d.e.f`) must still
 * be the longest-prefix target of a config write below it. The prefix search
 * may not stop at six segments.
 */
describe('nix-option-path synthesizer: deep option declarations', () => {
  let dir: string;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nix-deep-option-')); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('links a write under a seven-segment option declaration', async () => {
    fs.writeFileSync(
      path.join(dir, 'deep.nix'),
      `{ config, lib, ... }:
{
  options.services.a.b.c.d.e.f = lib.mkOption {
    type = lib.types.str;
    default = "";
  };
}
`
    );
    fs.writeFileSync(
      path.join(dir, 'use.nix'),
      `{ config, lib, ... }:
{
  config = lib.mkIf config.services.a.enable {
    services.a.b.c.d.e.f.x = "set";
  };
}
`
    );
    const cg = await CodeGraph.init(dir, { silent: true });
    await cg.indexAll();
    const db = (cg as any).db.db;
    const rows = db
      .prepare(
        `SELECT json_extract(e.metadata,'$.optionPath') optionPath
         FROM edges e
         WHERE json_extract(e.metadata,'$.synthesizedBy') = 'nix-option-path'`
      )
      .all() as Array<{ optionPath: string }>;
    cg.destroy();
    expect(rows.map((r) => r.optionPath)).toEqual(['services.a.b.c.d.e.f']);
  });
});
