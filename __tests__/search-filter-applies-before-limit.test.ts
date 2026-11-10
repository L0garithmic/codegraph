/**
 * A hard path:/name: filter sees every fetched candidate, not only the top `limit`.
 *
 * searchNodes() trimmed to `limit` after scoring and only then applied the
 * path:/name: gates, so a candidate that passed the gate but ranked below the
 * cut was discarded and the search reported a false miss.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DatabaseConnection } from '../src/db';
import { QueryBuilder } from '../src/db/queries';
import type { Node } from '../src/types';

function fn(id: string, name: string, filePath: string): Node {
  return {
    id,
    kind: 'function',
    name,
    qualifiedName: `${filePath}::${name}`,
    filePath,
    startLine: 1,
    endLine: 1,
    startColumn: 0,
    endColumn: 1,
    language: 'typescript',
    updatedAt: 1,
  };
}

describe('searchNodes applies name: filters before trimming to limit', () => {
  let dir: string;
  let db: DatabaseConnection;
  let q: QueryBuilder;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-search-filter-'));
    db = DatabaseConnection.initialize(path.join(dir, 'test.db'));
    q = new QueryBuilder(db.getDb());
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns the one candidate that passes a name: filter even when it is not the top-ranked fetched candidate', () => {
    // A filter-only search fetches 5× the limit ordered by name. The four
    // aaa* functions sort first and fail the filter; the match is the fifth.
    // With limit 1 the old code kept aaa0 and then filtered it out (0 results).
    for (let i = 0; i < 4; i++) q.insertNode(fn(`a${i}`, `aaa${i}`, 'src/app.ts'));
    q.insertNode(fn('target', 'zzz_target', 'src/app.ts'));
    const results = q.searchNodes('kind:function name:target', { limit: 1 });
    expect(results.map((r) => r.node.name)).toEqual(['zzz_target']);
  });
});
