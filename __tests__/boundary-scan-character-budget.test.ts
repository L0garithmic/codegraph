/**
 * The boundary scan's character budget covers the body that crosses it: a body
 * that starts inside the budget must not be scanned past the remaining chars.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { findDynamicBoundaries } from '../src/graph/dynamic-boundary-report';
import type CodeGraph from '../src/index';
import type { Node } from '../src/types';

let dir: string;

const makeNode = (id: string, filePath: string, endLine: number): Node =>
  ({
    id,
    kind: 'function',
    name: id,
    qualifiedName: id,
    filePath,
    language: 'typescript',
    startLine: 1,
    endLine,
  }) as unknown as Node;

const DISPATCH = 'void import(pluginPath);';

describe('findDynamicBoundaries: character budget', () => {
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-boundary-budget-'));
    // big.ts uses 150k of the 200k budget. mid.ts starts with 50k left, and its
    // dispatch site sits at ~55k: inside the scanner's own 60k window, beyond the budget.
    fs.writeFileSync(
      path.join(dir, 'big.ts'),
      ['export function big() {', `  const filler = '${'a'.repeat(150_000)}';`, '}', ''].join('\n')
    );
    fs.writeFileSync(
      path.join(dir, 'mid.ts'),
      ['export function mid() {', `  const filler = '${'b'.repeat(55_000)}'; ${DISPATCH}`, '}', ''].join('\n')
    );
  });

  afterAll(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('does not report a site beyond the character budget', () => {
    const cg = { getProjectRoot: () => dir } as unknown as CodeGraph;
    const big = makeNode('big', 'big.ts', 3);
    const mid = makeNode('mid', 'mid.ts', 3);

    const boundaries = findDynamicBoundaries(cg, [big, mid]);

    expect(boundaries).toEqual([]);
  });
});
