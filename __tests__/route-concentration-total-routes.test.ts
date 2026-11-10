/**
 * Route concentration is judged against every route-bearing file, not the top 20.
 *
 * getTopRouteFile() used to LIMIT 20 before dropping low-value files, so the
 * share it measured was top-20 routes over top-20 routes. One file with 10
 * routes among 99 single-route files (10 of 109, diffuse) looked like 10 of 29
 * and was wrongly named the answer file.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DatabaseConnection } from '../src/db';
import { QueryBuilder } from '../src/db/queries';
import type { Node } from '../src/types';

function routeNode(id: string, filePath: string, line: number): Node {
  return {
    id,
    kind: 'route',
    name: `GET /${id}`,
    qualifiedName: `${filePath}::${id}`,
    filePath,
    startLine: line,
    endLine: line,
    startColumn: 0,
    endColumn: 1,
    language: 'typescript',
    updatedAt: 1,
  };
}

describe('getTopRouteFile measures concentration over all route files', () => {
  let dir: string;
  let db: DatabaseConnection;
  let q: QueryBuilder;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-route-concentration-'));
    db = DatabaseConnection.initialize(path.join(dir, 'test.db'));
    q = new QueryBuilder(db.getDb());
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns null when the top file holds under 30% of all routes, even if the top 20 files look concentrated', () => {
    // 10 routes in one file plus 99 files with one route each: 10 of 109 routes
    // is diffuse. The old top-20 cut measured 10 of 29 (34%) and named the file.
    for (let i = 0; i < 10; i++) q.insertNode(routeNode(`big${i}`, 'src/big.ts', i + 1));
    for (let f = 0; f < 99; f++) q.insertNode(routeNode(`r${f}`, `src/feature${f}.ts`, 1));
    expect(q.getTopRouteFile()).toBeNull();
  });
});
