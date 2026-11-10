/**
 * An Expo Router navigation needs a router receiver. `steps.push(helper())` on a
 * plain array is not a navigation, so it must not add a navigates edge from the
 * helper; the same call on the imported `router` still does.
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
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-expo-push-'));
  write('package.json', JSON.stringify({ name: 'app', dependencies: { expo: '52', 'expo-router': '4', react: '18' } }));
  write('src/app/home.tsx', 'export default function Home() { return null }\n');
  write('src/app/welcome.tsx', 'export default function Welcome() { return null }\n');
  write('src/services/helper.ts', "export function nextRoute() { return '/welcome' }\n");
  write(
    'src/services/list.ts',
    "import { router } from 'expo-router'\n" +
      "import { nextRoute } from './helper'\n" +
      'export function collect() {\n  const steps: string[] = []\n  steps.push(nextRoute())\n  return steps\n}\n' +
      'export function go() {\n  router.replace(nextRoute())\n}\n'
  );
  cg = CodeGraph.initSync(dir);
  await cg.indexAll();
});

afterAll(() => {
  cg.destroy();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('expo-router navigation receivers', () => {
  it('creates navigation only for the router, not for an array push', () => {
    const helper = cg.getNodesByName('nextRoute')[0]!;
    const navs = cg.getOutgoingEdges(helper.id).filter((e) => e.kind === 'navigates');
    expect(navs.map((e) => e.metadata?.navMethod)).toEqual(['replace']);
  });
});
