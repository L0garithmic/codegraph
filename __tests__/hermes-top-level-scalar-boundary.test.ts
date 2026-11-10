import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getTarget } from '../src/installer/targets/registry';

describe('hermes config: a top-level scalar after the codegraph server block is preserved', () => {
  let tmpHome: string;
  let savedHome: string | undefined;
  let savedHermesHome: string | undefined;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-scalar-'));
    savedHome = process.env.HOME;
    savedHermesHome = process.env.HERMES_HOME;
    process.env.HOME = tmpHome;
    delete process.env.HERMES_HOME;
  });

  afterEach(() => {
    if (savedHome === undefined) delete process.env.HOME;
    else process.env.HOME = savedHome;
    if (savedHermesHome === undefined) delete process.env.HERMES_HOME;
    else process.env.HERMES_HOME = savedHermesHome;
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('uninstall removes only the codegraph block and keeps the following model setting', () => {
    const hermes = getTarget('hermes')!;
    const config = path.join(tmpHome, '.hermes', 'config.yaml');
    fs.mkdirSync(path.dirname(config), { recursive: true });
    fs.writeFileSync(config, [
      'mcp_servers:',
      '  other:',
      '    command: other',
      '  codegraph:',
      '    command: codegraph',
      '    args:',
      '      - serve',
      '      - --mcp',
      'model: example',
      '',
    ].join('\n'));

    hermes.uninstall('global');

    const body = fs.readFileSync(config, 'utf-8');
    expect(body).not.toContain('  codegraph:');
    expect(body).toContain('model: example');
    expect(body).toContain('  other:\n    command: other');
  });
});
