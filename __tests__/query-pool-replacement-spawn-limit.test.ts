/**
 * A crashed worker's replacement obeys the same cold-start limit drain() enforces.
 * Before the fix, the replacement was spawned directly, so a crash while two
 * workers were still starting made a third concurrent cold start.
 */
import { describe, it, expect } from 'vitest';
import { QueryPool, type PoolWorker } from '../src/mcp/query-pool';
import type { ToolResult } from '../src/mcp/tools';

const ok = (text: string): ToolResult => ({ content: [{ type: 'text', text }] });

/** A worker that becomes ready when `ready` is true, and crashes on a call named `crash`. */
class ScriptedWorker implements PoolWorker {
  private msgCb?: (m: unknown) => void;
  private exitCb?: (code: number) => void;
  alive = true;
  constructor(private ready: boolean) {
    if (ready) setTimeout(() => this.msgCb?.({ type: 'ready', ok: true }), 0);
  }
  on(event: string, cb: (...args: any[]) => void): void {
    if (event === 'message') this.msgCb = cb;
    else if (event === 'exit') this.exitCb = cb;
  }
  postMessage(msg: unknown): void {
    const m = msg as { type?: string; id: number; toolName: string };
    if (!m || m.type !== 'call') return;
    if (m.toolName === 'crash') {
      this.alive = false;
      setTimeout(() => this.exitCb?.(13), 0);
      return;
    }
    setTimeout(() => this.msgCb?.({ type: 'result', id: m.id, result: ok(m.toolName) }), 0);
  }
  terminate(): Promise<number> { this.alive = false; return Promise.resolve(0); }
}

describe('QueryPool crash replacement', () => {
  it('does not start a third cold worker when a crash happens with two already starting', async () => {
    let created = 0;
    const pool = new QueryPool({
      root: '/x',
      size: 4,
      // The first worker is ready at once; every later worker stays "starting".
      createWorker: () => new ScriptedWorker(++created === 1),
    });
    await new Promise((r) => setTimeout(r, 5)); // worker #1 ready and idle

    const crashing = pool.run('crash', {});
    const queued1 = pool.run('a', {});
    const queued2 = pool.run('b', {});
    void crashing; void queued1; void queued2;
    await new Promise((r) => setTimeout(r, 20)); // crash handled; #2 and #3 still starting

    expect(created).toBe(3);
    await pool.destroy();
  });
});
