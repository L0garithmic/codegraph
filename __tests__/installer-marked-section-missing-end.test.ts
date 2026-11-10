/**
 * A marked section whose end marker is missing is refused, not re-appended.
 * Appending would give the file two start markers, and the next install would
 * pair the stray start with a later end and delete the user's text between.
 */
import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { replaceOrAppendMarkedSection } from '../src/installer/targets/shared';

const START = '<!-- CODEGRAPH_TEST_START -->';
const END = '<!-- CODEGRAPH_TEST_END -->';
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('replaceOrAppendMarkedSection with a start marker and no end marker', () => {
  it('throws and leaves the file unchanged instead of appending a second block', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-marker-'));
    roots.push(root);
    const file = path.join(root, 'CLAUDE.md');
    const original = `my notes\n${START}\nstale block\n`;
    fs.writeFileSync(file, original);

    expect(() => replaceOrAppendMarkedSection(file, `${START}\nfresh\n${END}`, START, END)).toThrow(
      /without a matching/,
    );
    expect(fs.readFileSync(file, 'utf-8')).toBe(original);
  });
});
