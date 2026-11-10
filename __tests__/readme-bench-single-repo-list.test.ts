import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import * as path from 'path';
import { README_BENCH } from '../scripts/agent-eval/readme-bench-report.mjs';

describe('README A/B repo list has one owner', () => {
  const sh = readFileSync(path.join(process.cwd(), 'scripts/agent-eval/bench-readme.sh'), 'utf8');

  it('takes its repos and output root from readme-bench.json, not a copy in the shell script', () => {
    expect(README_BENCH.repos.map((r: { name: string }) => r.name)).toEqual([
      'vscode', 'excalidraw', 'django', 'tokio', 'okhttp', 'gin', 'alamofire',
    ]);
    expect(sh).not.toContain('vscode|');
    expect(sh).not.toContain('/tmp/ab-readme');
    expect(sh).toContain('readme-bench.json');
  });
});
