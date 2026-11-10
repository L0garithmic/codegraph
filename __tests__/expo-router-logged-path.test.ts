/**
 * A helper's navigation destinations are the screens its RETURN value can be.
 * A screen path that is only logged inside the helper is not a destination.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CodeGraph } from '../src';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

let dir: string;
let cg: CodeGraph;

const write = (rel: string, body: string) => {
  const abs = path.join(dir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
};

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-expo-log-'));
  write('package.json', JSON.stringify({ name: 'app', dependencies: { expo: '52', 'expo-router': '4', react: '18' } }));
  write('src/app/home.tsx', 'export default function Home() { return null }\n');
  write('src/app/welcome.tsx', 'export default function Welcome() { return null }\n');
  write(
    'src/services/post.ts',
    "import { router } from 'expo-router'\n" +
      'export function nextRoute() {\n  console.log(\'/welcome\')\n  return \'/home\'\n}\n' +
      'export function go() {\n  router.replace(nextRoute())\n}\n'
  );
  cg = CodeGraph.initSync(dir);
  await cg.indexAll();
});

afterAll(() => {
  cg.destroy();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('expo-router return destinations', () => {
  it('takes only the returned screen, not a logged path', () => {
    const helper = cg.getNodesByName('nextRoute')[0]!;
    const targets = cg
      .getOutgoingEdges(helper.id)
      .filter((e) => e.kind === 'navigates')
      .map((e) => cg.getNode(e.target)?.name);
    expect(targets).toEqual(['/home']);
  });
});
