import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { CodeGraph } from '../src';

describe('GoFrame dispatch: a request type that is only returned is not a dispatch target', () => {
  let dir: string;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'goframe-ret-')); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('links the route only to the method that takes the request type as a parameter', async () => {
    fs.writeFileSync(path.join(dir, 'go.mod'), 'module example.com/app\n\nrequire github.com/gogf/gf/v2 v2.7.0\n');
    fs.mkdirSync(path.join(dir, 'api', 'system'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'api', 'system', 'dept.go'),
      `package system

import "github.com/gogf/gf/v2/frame/g"

type DeptSearchReq struct {
	g.Meta \`path:"/dept/list" tags:"Dept" method:"get" summary:"list"\`
	DeptName string
}
type DeptSearchRes struct{}
`
    );
    fs.mkdirSync(path.join(dir, 'internal', 'controller'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'internal', 'controller', 'dept.go'),
      `package controller

import (
	"context"

	"example.com/app/api/system"
)

type sysDeptController struct{}

func (c *sysDeptController) List(ctx context.Context, req *system.DeptSearchReq) (res *system.DeptSearchRes, err error) {
	return
}

// Returns the route's request type but does not accept one: must NOT be linked.
func (c *sysDeptController) Peek(ctx context.Context) (res *system.DeptSearchReq, err error) {
	return
}
`
    );

    const cg = await CodeGraph.init(dir, { silent: true });
    await cg.indexAll();
    const db = (cg as any).db.db;
    const targets = db
      .prepare(
        `SELECT t.name AS name FROM edges e JOIN nodes t ON t.id = e.target
         WHERE json_extract(e.metadata,'$.synthesizedBy') = 'goframe-route'`
      )
      .all()
      .map((r: { name: string }) => r.name);
    expect(targets).toContain('List');
    expect(targets).not.toContain('Peek');
    cg.close();
  });
});
