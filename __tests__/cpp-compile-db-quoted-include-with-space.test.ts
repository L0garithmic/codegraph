import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { clearCppIncludeDirCache, loadCppIncludeDirs } from '../src/resolution/import-resolver';

/**
 * A compile_commands.json command may embed a quoted part inside a token:
 * `-I"include dir"`. The discovered include directory is the unquoted path
 * `include dir`, with no stray quote characters.
 */
describe('compile_commands.json quoted include paths', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-cdb-quoted-'));
    fs.mkdirSync(path.join(dir, 'include dir'));
    fs.writeFileSync(path.join(dir, 'a.cpp'), 'int main() { return 0; }\n');
    fs.writeFileSync(
      path.join(dir, 'compile_commands.json'),
      JSON.stringify([{ directory: dir, command: 'clang++ -I"include dir" -c a.cpp', file: 'a.cpp' }])
    );
    clearCppIncludeDirCache();
  });
  afterEach(() => {
    clearCppIncludeDirCache();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('discovers the unquoted include directory when the quote sits inside the token', () => {
    const dirs = loadCppIncludeDirs(dir);
    expect(dirs).toContain('include dir');
    expect(dirs.some((d) => d.includes('"'))).toBe(false);
  });
});
