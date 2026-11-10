import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { CodeGraph } from '../src';

/**
 * A middleware name registered with `.Use(name)` may be defined in several Go
 * packages. The chain must not link to an arbitrary one: with no handler in the
 * registering file and more than one same-named candidate, no edge is made.
 */
let dir: string;
let cg: CodeGraph | undefined;
afterEach(() => {
  cg?.close();
  cg = undefined;
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
});

const chain = `package gin

type HandlerFunc func(*Context)

type Context struct {
	handlers []HandlerFunc
	index    int8
}

func (c *Context) Next() {
	c.index++
	for c.index < int8(len(c.handlers)) {
		c.handlers[c.index](c)
		c.index++
	}
}
`;

describe('gin middleware-chain handler resolution', () => {
  it('links no edge for a registered name defined in two packages', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-gin-ambiguous-'));
    fs.writeFileSync(path.join(dir, 'go.mod'), 'module ginapp\n\ngo 1.21\n');
    fs.writeFileSync(path.join(dir, 'gin.go'), chain);
    fs.mkdirSync(path.join(dir, 'a'));
    fs.mkdirSync(path.join(dir, 'b'));
    fs.writeFileSync(path.join(dir, 'a', 'auth.go'), 'package a\n\nfunc auth(c *Context) {}\n');
    fs.writeFileSync(path.join(dir, 'b', 'auth.go'), 'package b\n\nfunc auth(c *Context) {}\n');
    fs.writeFileSync(path.join(dir, 'main.go'), 'package main\n\nfunc setup(r *Engine) {\n\tr.Use(auth)\n}\n');
    cg = CodeGraph.initSync(dir);
    await cg.indexAll();
    await cg.resolveReferencesBatched();
    const db = (cg as any).db.db;
    const rows = db
      .prepare(
        `SELECT t.file_path file FROM edges e JOIN nodes t ON t.id = e.target
         WHERE json_extract(e.metadata,'$.synthesizedBy') = 'gin-middleware-chain'`
      )
      .all();
    expect(rows).toEqual([]);
  });
});
