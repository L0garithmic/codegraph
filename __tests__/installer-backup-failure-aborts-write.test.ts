/**
 * When an unparseable config cannot be backed up, the write is aborted and the
 * user's file is left as it was. The backup exists to keep that config; a
 * silently failed backup must not let the overwrite go ahead.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { writeJsonFile } from '../src/installer/targets/shared';

const roots: string[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('writeJsonFile over an unparseable config whose backup fails', () => {
  it('throws and keeps the original content when the .backup path cannot be written', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-backup-'));
    roots.push(root);
    const file = path.join(root, 'mcp.json');
    fs.writeFileSync(file, '{ half a config');
    // A directory at the backup path makes copyFileSync fail.
    fs.mkdirSync(file + '.backup');
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => writeJsonFile(file, { mcpServers: {} })).toThrow();
    expect(fs.readFileSync(file, 'utf-8')).toBe('{ half a config');
  });
});
