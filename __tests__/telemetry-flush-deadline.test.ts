import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Telemetry } from '../src/telemetry';

describe('telemetry flush honours one deadline across all batches', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-telemetry-deadline-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('stops sending once the flush timeout is spent, instead of giving every batch a fresh timeout', async () => {
    // Each POST takes 400 ms and honours its abort signal.
    const slowFetch = (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        const timer = setTimeout(() => resolve(new Response(null, { status: 204 })), 400);
        init?.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('aborted'));
        });
      });
    const t = new Telemetry({
      dir,
      env: {},
      fetchImpl: slowFetch as unknown as typeof globalThis.fetch,
      installExitHook: false,
      stderr: () => {},
    });
    t.setEnabled(true, 'cli');
    // 250 lifecycle events = three sequential batches of at most 100.
    for (let i = 0; i < 250; i++) t.recordLifecycle('index', { n: i });

    const started = Date.now();
    await t.flushNow(500);
    const elapsed = Date.now() - started;

    // Old code: three batches x 400 ms = ~1200 ms. The 500 ms deadline must hold.
    expect(elapsed).toBeLessThan(1000);
  });
});
