/**
 * Trailing commas are removed from a tsconfig, but a comma that sits inside a
 * quoted alias target is part of the path and must survive.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadProjectAliases } from '../src/resolution/path-aliases';

let dir: string;

describe('tsconfig JSONC: trailing-comma removal skips strings', () => {
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-tsconfig-comma-'));
    fs.writeFileSync(
      path.join(dir, 'tsconfig.json'),
      [
        '{',
        '  // real JSONC: comments and trailing commas',
        '  "compilerOptions": {',
        '    "baseUrl": ".",',
        '    "paths": {',
        '      "@lib/*": ["./src/a,}b/*",],',
        '    },',
        '  },',
        '}',
        '',
      ].join('\n')
    );
  });

  afterAll(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('keeps the comma inside a quoted alias target', () => {
    const aliases = loadProjectAliases(dir);
    const replacements = (aliases?.patterns ?? []).flatMap((p) => p.replacements);

    expect(replacements.some((r) => r.includes('a,}b'))).toBe(true);
  });
});
