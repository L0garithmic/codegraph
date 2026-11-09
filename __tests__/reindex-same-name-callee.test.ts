import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import CodeGraph from '../src/index';

/**
 * Re-indexing a callee file must keep an incoming edge on the symbol it
 * targeted, even when another class in that file declares a same-named method.
 */
describe('re-index keeps a cross-file edge on the right same-named method', () => {
  let cg: CodeGraph | undefined;
  let dir: string | undefined;

  afterEach(() => {
    cg?.close();
    cg = undefined;
    if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it('does not rebind a caller of Alpha.run to Beta.run after the callee file changes', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-reindex-same-name-'));
    const src = path.join(dir, 'src');
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, 'B.ts'), [
      'export class Alpha {',
      '  static run(): number { return 1; }',
      '}',
      'export class Beta {',
      '  static run(): number { return 2; }',
      '}',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(src, 'C.ts'), [
      "import { Alpha } from './B';",
      'export function callAlpha(): number {',
      '  return Alpha.run();',
      '}',
      '',
    ].join('\n'));

    cg = CodeGraph.initSync(dir, {
      config: { include: ['src/**/*.ts'], exclude: [] },
    });
    await cg.indexAll();
    cg.resolveReferences();

    const alphaRun = () => cg!.getNodesByQualifiedName('Alpha::run')[0];
    const betaRun = () => cg!.getNodesByQualifiedName('Beta::run')[0];
    const callersOf = (id: string) =>
      cg!.getIncomingEdgesTo([id], ['calls']).map((e) => e.source);
    const callAlphaId = cg.getNodesByName('callAlpha')[0]!.id;

    // Precondition: the edge exists on the first indexing pass.
    expect(callersOf(alphaRun()!.id)).toContain(callAlphaId);

    // Change only the callee file (shifts every line), then sync it.
    fs.writeFileSync(path.join(src, 'B.ts'), '// shifted\n' + fs.readFileSync(path.join(src, 'B.ts'), 'utf-8'));
    await cg.sync();

    expect(callersOf(alphaRun()!.id)).toContain(callAlphaId);
    expect(callersOf(betaRun()!.id)).not.toContain(callAlphaId);
  });
});
