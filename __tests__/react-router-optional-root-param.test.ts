/**
 * A route made only of an optional parameter (`/:id?`) also serves the bare `/`,
 * so a link to `/` reaches that route.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CodeGraph } from '../src';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

describe('react-router: optional root parameter', () => {
  let tmpDir: string;
  let cg: CodeGraph;

  beforeAll(async () => {
    await initGrammars();
    await loadAllGrammars();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-rr-root-optional-'));
    const write = (rel: string, body: string) => {
      const full = path.join(tmpDir, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, body);
    };
    write(
      'src/App.jsx',
      [
        "import { Route, Routes, Link } from 'react-router-dom';",
        'export function Home() {',
        '  return <Routes><Route path="/:id?" element={<Viewer />} /></Routes>;',
        '}',
        'export function Viewer() { return <div />; }',
        'export function Navbar() { return <Link to="/">Home</Link>; }',
        '',
      ].join('\n')
    );
    cg = CodeGraph.initSync(tmpDir);
    await cg.indexAll();
  });

  afterAll(() => {
    cg?.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('a link to "/" navigates to the "/:id?" route', () => {
    const navbar = cg.getNodesByName('Navbar').find((n) => n.kind === 'function')!;
    const navs = cg.getOutgoingEdges(navbar.id).filter((e) => e.kind === 'navigates');
    const toRoot = navs.find((e) => (e.metadata as Record<string, unknown>).href === '/');
    expect(toRoot).toBeDefined();
    expect(cg.getNode(toRoot!.target)?.name).toBe('/:id?');
  });
});
