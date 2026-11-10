/**
 * readJsonFile returns {} for valid JSON that is not an object. A config of
 * `null`, `[]`, a number or a string has no `mcpServers` to read, so callers
 * must get an empty object instead of a value that throws when indexed.
 */
import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { readJsonFile } from '../src/installer/targets/shared';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('readJsonFile with valid JSON that is not an object', () => {
  it.each(['null', '[]', '42', '"text"'])('returns {} for a file containing %s', (content) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-readjson-'));
    roots.push(root);
    const file = path.join(root, 'config.json');
    fs.writeFileSync(file, content);
    expect(readJsonFile(file)).toEqual({});
  });
});
