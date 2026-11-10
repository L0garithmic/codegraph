/**
 * A rolled-back file bundle must not leave its names marked as already segmented.
 *
 * storeFileBundle() adds each name to the session's segmentedNames before the
 * transaction commits. When a late step fails, SQLite rolls the vocabulary rows
 * back, but the in-memory set kept the names, so a retry skipped writing them.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DatabaseConnection } from '../src/db';
import { QueryBuilder } from '../src/db/queries';
import type { FileRecord, Node } from '../src/types';

const NAME = 'parseUserRecord';

function node(): Node {
  return {
    id: 'fn:parse',
    kind: 'function',
    name: NAME,
    qualifiedName: `src/parse.ts::${NAME}`,
    filePath: 'src/parse.ts',
    startLine: 1,
    endLine: 1,
    startColumn: 0,
    endColumn: 1,
    language: 'typescript',
    updatedAt: 1,
  };
}

function fileRecord(): FileRecord {
  return {
    path: 'src/parse.ts',
    contentHash: 'h',
    language: 'typescript',
    size: 1,
    modifiedAt: 1,
    indexedAt: 1,
    nodeCount: 1,
  } as FileRecord;
}

describe('storeFileBundle rollback keeps the name vocabulary consistent', () => {
  let dir: string;
  let db: DatabaseConnection;
  let q: QueryBuilder;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-vocab-rollback-'));
    db = DatabaseConnection.initialize(path.join(dir, 'test.db'));
    q = new QueryBuilder(db.getDb());
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writes the name segments on retry after a bundle failed late and rolled back', () => {
    // The file record is missing, so the write fails after the nodes were inserted.
    expect(() =>
      q.storeFileBundle({ nodes: [node()], edges: [], refs: [], file: undefined as unknown as FileRecord })
    ).toThrow();

    q.storeFileBundle({ nodes: [node()], edges: [], refs: [], file: fileRecord() });

    const rows = db
      .getDb()
      .prepare('SELECT segment FROM name_segment_vocab WHERE name = ?')
      .all(NAME) as Array<{ segment: string }>;
    expect(rows.length).toBeGreaterThan(0);
  });
});
