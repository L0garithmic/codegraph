import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ExtractionOrchestrator } from '../src/extraction';

/**
 * Framework detection lists directories relative to the project root. A
 * relative path that climbs out of the root must not list the parent's entries.
 */
describe('framework detection directory listing stays inside the project root', () => {
  let tmp: string | undefined;

  afterEach(() => {
    if (tmp && fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
    tmp = undefined;
  });

  it('listDirectories("../") returns nothing instead of the parent folder', () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-detect-list-'));
    const root = path.join(tmp, 'proj');
    fs.mkdirSync(path.join(root, 'packages'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'sibling-outside'));

    const orch = new ExtractionOrchestrator(root, {} as never);
    // buildDetectionContext is private; the detectors reach it this way.
    const ctx = (orch as unknown as { buildDetectionContext: (files: string[]) => { listDirectories: (rel: string) => string[] } })
      .buildDetectionContext([]);

    expect(ctx.listDirectories('../')).toEqual([]);
    expect(ctx.listDirectories('packages')).toEqual([]);
    expect(ctx.listDirectories('.')).toEqual(['packages']);
  });
});
