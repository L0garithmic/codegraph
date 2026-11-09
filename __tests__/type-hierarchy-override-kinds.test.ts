import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import CodeGraph from '../src/index';
import { buildTypeHierarchy } from '../src/graph/type-hierarchy';

/**
 * A nearer ancestor's nested class must not hide a method of the same name in a
 * farther ancestor: only overridable members can be overridden.
 */
describe('override matching ignores non-overridable ancestor members', () => {
  let cg: CodeGraph | undefined;
  let dir: string | undefined;

  afterEach(() => {
    cg?.close();
    cg = undefined;
    if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it('reports the farther ancestor method as the overridden one', async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-override-kinds-'));
    const src = path.join(dir, 'src');
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, 'Shapes.java'), [
      'class Base {',
      '  void run() {}',
      '}',
      'class Mid extends Base {',
      '  static class run {}',
      '}',
      'class Leaf extends Mid {',
      '  void run() {}',
      '}',
      '',
    ].join('\n'));

    cg = CodeGraph.initSync(dir, {
      config: { include: ['src/**/*.java'], exclude: [] },
    });
    await cg.indexAll();
    cg.resolveReferences();

    const leaf = cg.getNodesByQualifiedName('Leaf')[0]!;
    const baseRun = cg.getNodesByQualifiedName('Base::run')[0]!;
    const hierarchy = buildTypeHierarchy(cg, leaf);
    expect(hierarchy).not.toBeNull();
    const matches = [...hierarchy!.overrides.values()];
    expect(matches).toHaveLength(1);
    expect(matches[0]!.baseId).toBe(baseRun.id);
  });
});
