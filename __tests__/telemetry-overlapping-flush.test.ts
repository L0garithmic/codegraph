import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Telemetry } from '../src/telemetry';

describe('overlapping telemetry flushes do not share a claim file', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-telemetry-overlap-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('keeps the first claim intact while a second flush starts with newer events', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const sent: string[] = [];
    const gatedFetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      await gate;
      sent.push(String(init?.body));
      return new Response(null, { status: 204 });
    };
    const t = new Telemetry({
      dir,
      env: {},
      fetchImpl: gatedFetch as unknown as typeof globalThis.fetch,
      installExitHook: false,
      stderr: () => {},
    });
    t.setEnabled(true, 'cli');

    t.recordLifecycle('index', { n: 'A' });
    const first = t.flushNow(5000); // claims A, then waits on the gated fetch
    t.recordLifecycle('index', { n: 'B' });
    const second = t.flushNow(5000);

    // While the first send is pending, its claim must still hold A on disk
    // (crash recovery depends on it).
    const claimText = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('telemetry-queue.sending.'))
      .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
      .join('');
    expect(claimText).toContain('"n":"A"');

    release();
    await Promise.all([first, second]);

    const bodies = sent.join('\n');
    expect(bodies.match(/"n":"A"/g)).toHaveLength(1);
    expect(bodies.match(/"n":"B"/g)).toHaveLength(1);
    expect(fs.readdirSync(dir).filter((f) => f.startsWith('telemetry-queue.sending.'))).toEqual([]);
  });
});
