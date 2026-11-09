/**
 * CLI option parsing: `--filter` keeps whole directory names, and numeric
 * options accept only whole numbers (parseInt would read `1.5` as 1).
 */

import { describe, it, expect } from 'vitest';
import { filterFilesUnderDir, parseWholeNumber } from '../src/bin/option-parsing';

describe('--filter keeps whole directory names', () => {
  it('matches a directory, not a sibling that shares its name as a prefix', () => {
    const files = [{ path: 'src/file.ts' }, { path: 'src-old/file.ts' }, { path: 'src2/file.ts' }];
    expect(filterFilesUnderDir(files, 'src').map((f) => f.path)).toEqual(['src/file.ts']);
    expect(filterFilesUnderDir(files, './src/').map((f) => f.path)).toEqual(['src/file.ts']);
  });
});

describe('numeric options accept only whole numbers', () => {
  it.each(['1.5', '8garbage', '-3', '', 'abc'])('rejects %j', (raw) => {
    expect(parseWholeNumber(raw)).toBeNaN();
  });

  it('accepts a plain positive integer', () => {
    expect(parseWholeNumber('8')).toBe(8);
  });
});
