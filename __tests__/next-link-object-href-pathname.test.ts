/**
 * `<Link href={{ pathname: '/users' }}>` is a navigation to the /users page,
 * the same as `<Link href="/users">`.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CodeGraph } from '../src';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

let tmpDir: string;
let cg: CodeGraph;

describe('next-link: object href with a pathname key', () => {
  beforeAll(async () => {
    await initGrammars();
    await loadAllGrammars();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-next-object-href-'));
    const write = (rel: string, content: string) => {
      const full = path.join(tmpDir, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content);
    };
    write('package.json', JSON.stringify({ name: 'site', dependencies: { next: '15', react: '19' } }));
    write(
      'app/page.tsx',
      "import Link from 'next/link'\n" +
        'export default function Home() {\n' +
        '  return (\n' +
        '    <main>\n' +
        "      <Link href={{ pathname: '/users' }}>Users</Link>\n" +
        '    </main>\n' +
        '  )\n' +
        '}\n'
    );
    write('app/users/page.tsx', 'export default function Users() {\n  return <div>Users</div>\n}\n');
    cg = CodeGraph.initSync(tmpDir);
    await cg.indexAll();
  });

  afterAll(() => {
    cg?.close();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('draws a navigates edge from the component to the users page', () => {
    const home = cg.getNodesByName('Home')[0]!;
    const targets = cg
      .getOutgoingEdges(home.id)
      .filter((e) => e.kind === 'navigates')
      .map((e) => cg.getNode(e.target)?.filePath);

    expect(targets).toContain('app/users/page.tsx');
  });
});
