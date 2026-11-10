/**
 * clearCaches() is the full invalidation point for the resolver's per-file
 * memos. The Razor @using memo must be cleared with the rest, or a resolver
 * that outlives a pass keeps resolving markup against a stale namespace set.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DatabaseConnection } from '../src/db';
import { QueryBuilder } from '../src/db/queries';
import { createResolver } from '../src/resolution';

describe('ReferenceResolver.clearCaches drops the Razor @using memo', () => {
  let dir: string;
  let db: DatabaseConnection;
  let q: QueryBuilder;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-razor-usings-'));
    db = DatabaseConnection.initialize(path.join(dir, 'test.db'));
    q = new QueryBuilder(db.getDb());
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('forgets a cached @using set so a changed _Imports.razor is re-read on the next pass', () => {
    const resolver = createResolver(dir, q);
    const usings = (resolver as unknown as { razorUsingsCache: Map<string, string[]> }).razorUsingsCache;
    usings.set('Pages/Index.razor', ['Old.Namespace']);

    resolver.clearCaches();

    expect(usings.has('Pages/Index.razor')).toBe(false);
    expect(usings.size).toBe(0);
  });
});
