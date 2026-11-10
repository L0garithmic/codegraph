import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Telemetry } from '../src/telemetry';

describe('telemetry queue cap counts UTF-8 bytes', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-telemetry-cap-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('keeps the queue file within 256 KiB of bytes when metadata is multibyte', () => {
    const t = new Telemetry({ dir, env: {}, installExitHook: false, stderr: () => {} });
    t.setEnabled(true, 'cli');

    // 150k 2-byte characters: under 256k UTF-16 units, but ~300 KB of UTF-8.
    t.recordLifecycle('index', { note: 'é'.repeat(150_000) });
    t.persistSync();
    t.recordLifecycle('index', { languages: ['go'] });
    t.persistSync();

    const onDisk = fs.readFileSync(t.queuePath);
    expect(onDisk.length).toBeLessThanOrEqual(256 * 1024);
    expect(onDisk.toString('utf8')).toContain('"languages":["go"]');
  });
});
